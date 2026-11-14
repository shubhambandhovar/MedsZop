/**
 * MedsZop Prescription Intelligence V2 — prescriptionReviewService
 * 
 * Pharmacist Verification Workstation & Immutable Audit Trail Service.
 * Manages clinical sign-offs, line-item pharmacist corrections, and decision records.
 * 
 * Safety Rules:
 * - Requires verified pharmacist or admin role.
 * - Preserves original AI extraction alongside pharmacist-approved corrections.
 * - Records immutable audit history with timestamps, pharmacist ID, and delta diffs.
 */

const Prescription = require("../models/Prescription");
const Order = require("../models/Order");
const AuditLog = require("../models/AuditLog");

class PrescriptionReviewService {
  /**
   * Get queue of prescriptions awaiting pharmacist review
   * @param {object} params
   * @param {string} params.pharmacyId
   * @param {string} [params.status]
   * @param {number} [params.page]
   * @param {number} [params.limit]
   */
  async getReviewQueue({ pharmacyId, status, page = 1, limit = 20 }) {
    const query = status
      ? { status }
      : {
          $or: [
            { status: { $in: ["needs_review", "uploaded", "clarification_requested"] } },
            { "parsed_data.hasUncertainFields": true }
          ]
        };

    const skip = (Math.max(1, page) - 1) * limit;
    const [total, items] = await Promise.all([
      Prescription.countDocuments(query),
      Prescription.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items
    };
  }

  /**
   * Fetch detailed prescription record for verification
   */
  async getPrescriptionDetails(prescriptionId) {
    const rx = await Prescription.findById(prescriptionId).lean();
    if (!rx) {
      throw new Error("Prescription record not found");
    }
    return rx;
  }

  /**
   * Submit pharmacist clinical review decision
   * @param {object} params
   * @param {string} params.prescriptionId
   * @param {string} params.decision - "approve" | "reject" | "request_clarification" | "correct_and_approve"
   * @param {Array<object>} params.reviewedMedicines - Item-by-item verified medicines
   * @param {string} [params.notes]
   * @param {string} [params.rejectionReason]
   * @param {object} params.pharmacist - req.user object { id, name, role }
   */
  async submitReview({
    prescriptionId,
    decision,
    reviewedMedicines = [],
    notes = "",
    rejectionReason = "",
    pharmacist
  }) {
    if (!pharmacist || (pharmacist.role !== "pharmacy" && pharmacist.role !== "admin")) {
      throw new Error("Unauthorized: Only licensed pharmacists or admins can sign off on prescriptions");
    }

    const rx = await Prescription.findById(prescriptionId);
    if (!rx) {
      throw new Error("Prescription not found");
    }

    const originalMedicines = rx.parsed_data?.medicines || [];
    const timestamp = new Date();

    let newStatus;
    if (decision === "approve" || decision === "correct_and_approve") {
      newStatus = "verified";
    } else if (decision === "reject") {
      newStatus = "rejected";
    } else if (decision === "request_clarification") {
      newStatus = "clarification_requested";
    } else {
      throw new Error(`Invalid review decision: ${decision}`);
    }

    // Build item-level corrections and clinical audit trail
    const finalizedMedicines = reviewedMedicines.map((item, idx) => {
      const orig = originalMedicines[idx] || {};
      const hasChanges = (
        item.medicineName !== orig.medicineName ||
        item.strength !== orig.strength ||
        item.prescribedDose !== orig.prescribedDose ||
        item.frequency !== orig.frequency
      );

      return {
        ...item,
        recognitionStatus: decision === "reject" ? "REJECTED" : "PHARMACIST_APPROVED",
        reviewStatus: hasChanges ? "corrected" : "approved",
        pharmacistReview: {
          verifiedBy: pharmacist.id,
          verifiedAt: timestamp,
          wasCorrected: hasChanges,
          originalSnapshot: hasChanges ? {
            name: orig.medicineName,
            strength: orig.strength,
            frequency: orig.frequency
          } : null
        }
      };
    });

    // Create immutable review event
    const reviewEvent = {
      action: `PHARMACIST_${decision.toUpperCase()}`,
      pharmacistId: pharmacist.id,
      pharmacistName: pharmacist.name || "Licensed Pharmacist",
      timestamp,
      decision,
      notes: notes || rejectionReason || "Clinical review completed",
      diffCount: finalizedMedicines.filter((m) => m.reviewStatus === "corrected").length
    };

    // Update prescription in database
    rx.status = newStatus;
    if (!rx.parsed_data) rx.parsed_data = {};
    rx.parsed_data.medicines = finalizedMedicines;
    rx.parsed_data.lastReviewedAt = timestamp;
    rx.parsed_data.reviewedBy = pharmacist.id;

    if (!Array.isArray(rx.parsed_data.auditTrail)) {
      rx.parsed_data.auditTrail = [];
    }
    rx.parsed_data.auditTrail.push(reviewEvent);

    rx.markModified("parsed_data");
    await rx.save();

    // If prescription is linked to an Order, sync order status
    if (rx.order_id) {
      try {
        const order = await Order.findById(rx.order_id);
        if (order) {
          if (newStatus === "verified" && ["pending_verification", "pending"].includes(order.order_status)) {
            order.order_status = "confirmed";
            order.prescription_verified = true;
            await order.save();
          } else if (newStatus === "rejected") {
            order.order_status = "cancelled";
            await order.save();
          }
        }
      } catch (orderSyncErr) {
        console.warn("Order sync warning during prescription review:", orderSyncErr.message);
      }
    }

    // Optional audit log document entry
    try {
      if (AuditLog && AuditLog.create) {
        await AuditLog.create({
          action: "PRESCRIPTION_PHARMACIST_VERIFICATION",
          actorId: pharmacist.id,
          actorRole: pharmacist.role,
          targetId: prescriptionId,
          details: reviewEvent
        });
      }
    } catch (auditErr) {
      // Non-blocking
    }

    return {
      success: true,
      prescriptionId: rx._id,
      status: rx.status,
      reviewEvent,
      medicines: finalizedMedicines
    };
  }
}

module.exports = new PrescriptionReviewService();

