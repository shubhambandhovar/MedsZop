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

const mongoose = require("mongoose");
const Prescription = require("../models/Prescription");
const Pharmacy = require("../models/Pharmacy");
const Order = require("../models/Order");
const AuditLog = require("../models/AuditLog");

class PrescriptionReviewService {
  /**
   * Get queue of prescriptions awaiting pharmacist review
   * @param {object} params
   * @param {string} [params.pharmacyId] - user_id or _id of requesting pharmacy
   * @param {string} [params.status]
   * @param {number} [params.page]
   * @param {number} [params.limit]
   */
  async getReviewQueue({ pharmacyId, status, page = 1, limit = 20 }) {
    let pharmacyDoc = null;
    if (pharmacyId) {
      pharmacyDoc = await Pharmacy.findOne({
        $or: [
          { user_id: pharmacyId },
          { _id: mongoose.Types.ObjectId.isValid(pharmacyId) ? pharmacyId : null }
        ]
      });

      if (!pharmacyDoc || !pharmacyDoc.verified) {
        const err = new Error("Forbidden: Only verified licensed pharmacists may access the review queue");
        err.statusCode = 403;
        throw err;
      }
    }

    const baseStatusFilter = status
      ? { status }
      : {
          $or: [
            { status: { $in: ["needs_review", "uploaded", "clarification_requested"] } },
            { "parsed_data.hasUncertainFields": true }
          ]
        };

    let query = { ...baseStatusFilter };

    // Enforce strict pharmacy-specific tenancy filtering
    if (pharmacyDoc) {
      const pIdStr = pharmacyDoc._id.toString();
      const pUserId = pharmacyDoc.user_id?.toString() || pharmacyId.toString();

      // Retrieve any orders explicitly assigned to this pharmacy with prescriptions
      let assignedOrderRxUrls = [];
      try {
        const pharmacyOrders = await Order.find({
          pharmacy_id: { $in: [pIdStr, pUserId] },
          prescription_url: { $exists: true, $ne: null }
        }).select("prescription_url");
        assignedOrderRxUrls = pharmacyOrders.map((o) => o.prescription_url).filter(Boolean);
      } catch {
        // Safe fallback if Order collection is mocked/empty
      }

      query = {
        $and: [
          baseStatusFilter,
          {
            $or: [
              { pharmacy_id: { $in: [pIdStr, pUserId] } },
              { file_url: { $in: assignedOrderRxUrls } },
              { pharmacy_id: null },
              { pharmacy_id: { $exists: false } }
            ]
          }
        ]
      };
    }

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
   * Fetch detailed prescription record for verification with strict role & tenant authorization
   * @param {string} prescriptionId
   * @param {object} [user] - authenticated req.user { id, role }
   */
  async getPrescriptionDetails(prescriptionId, user) {
    const rx = await Prescription.findById(prescriptionId).lean();
    if (!rx) {
      const err = new Error("Prescription record not found");
      err.statusCode = 404;
      throw err;
    }

    if (user) {
      if (user.role === "customer") {
        if (rx.user_id !== user.id?.toString()) {
          const err = new Error("Forbidden: You do not own this prescription");
          err.statusCode = 403;
          throw err;
        }
      } else if (user.role === "pharmacy") {
        const pharmacyDoc = await Pharmacy.findOne({
          $or: [
            { user_id: user.id },
            { _id: mongoose.Types.ObjectId.isValid(user.id) ? user.id : null }
          ]
        });

        if (!pharmacyDoc || !pharmacyDoc.verified) {
          const err = new Error("Forbidden: Only verified licensed pharmacists may inspect prescription details");
          err.statusCode = 403;
          throw err;
        }

        const pIdStr = pharmacyDoc._id.toString();
        const pUserId = pharmacyDoc.user_id?.toString() || user.id?.toString();

        // Cross-pharmacy access denial
        if (rx.pharmacy_id && rx.pharmacy_id !== pIdStr && rx.pharmacy_id !== pUserId) {
          const err = new Error("Forbidden: Cross-pharmacy access denied. This prescription is assigned to another pharmacy");
          err.statusCode = 403;
          throw err;
        }
      } else if (user.role !== "admin") {
        const err = new Error("Forbidden: Unauthorized role for prescription details");
        err.statusCode = 403;
        throw err;
      }
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
      const err = new Error("Unauthorized: Only licensed pharmacists or admins can sign off on prescriptions");
      err.statusCode = 403;
      throw err;
    }

    let pharmacyDoc = null;
    if (pharmacist.role === "pharmacy") {
      pharmacyDoc = await Pharmacy.findOne({
        $or: [
          { user_id: pharmacist.id },
          { _id: mongoose.Types.ObjectId.isValid(pharmacist.id) ? pharmacist.id : null }
        ]
      });

      if (!pharmacyDoc || !pharmacyDoc.verified) {
        const err = new Error("Forbidden: Only verified licensed pharmacists may clinically approve prescriptions");
        err.statusCode = 403;
        throw err;
      }
    }

    const rx = await Prescription.findById(prescriptionId);
    if (!rx) {
      const err = new Error("Prescription not found");
      err.statusCode = 404;
      throw err;
    }

    // Cross-pharmacy approval denial:
    if (pharmacyDoc) {
      const pIdStr = pharmacyDoc._id.toString();
      const pUserId = pharmacyDoc.user_id?.toString() || pharmacist.id?.toString();

      if (rx.pharmacy_id && rx.pharmacy_id !== pIdStr && rx.pharmacy_id !== pUserId) {
        const err = new Error("Forbidden: Cross-pharmacy review denied. This prescription is assigned to another pharmacy");
        err.statusCode = 403;
        throw err;
      }

      // Assign to this pharmacy if unassigned
      if (!rx.pharmacy_id) {
        rx.pharmacy_id = pIdStr;
      }
      rx.assigned_pharmacist_id = pharmacist.id;
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
      const err = new Error(`Invalid review decision: ${decision}`);
      err.statusCode = 400;
      throw err;
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

    // Create immutable review event with pharmacist license traceability
    const reviewEvent = {
      action: `PHARMACIST_${decision.toUpperCase()}`,
      pharmacistId: pharmacist.id,
      pharmacistName: pharmacist.name || pharmacyDoc?.pharmacist_name || "Licensed Pharmacist",
      pharmacistLicense: pharmacyDoc?.license_number || "LIC-ADMIN-SUPERVISORY",
      pharmacyId: pharmacyDoc?._id?.toString() || rx.pharmacy_id || null,
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
    rx.parsed_data.reviewedByLicense = reviewEvent.pharmacistLicense;
    rx.verification_notes = notes || rejectionReason || "";

    if (!Array.isArray(rx.parsed_data.auditTrail)) {
      rx.parsed_data.auditTrail = [];
    }
    rx.parsed_data.auditTrail.push(reviewEvent);

    rx.markModified("parsed_data");
    await rx.save();

    // If prescription is linked to an Order, sync order status
    let linkedOrder = null;
    if (rx.order_id) {
      try {
        if (mongoose.connection.readyState === 1 || Order.findById !== mongoose.Model.findById) {
          linkedOrder = await Order.findById(rx.order_id);
        }
      } catch (findErr) {
        console.warn("Could not find order by rx.order_id:", findErr.message);
      }
    }
    if (!linkedOrder && (rx.file_url || rx._id)) {
      try {
        if (mongoose.connection.readyState === 1 || Order.findOne !== mongoose.Model.findOne) {
          const orderQueries = [];
          if (rx._id) {
            orderQueries.push({ prescription_id: rx._id.toString() });
          }
          if (rx.file_url) {
            orderQueries.push({ prescription_url: rx.file_url });
          }
          if (orderQueries.length > 0) {
            linkedOrder = await Order.findOne({ $or: orderQueries });
          }
        }
      } catch (findErr) {
        console.warn("Could not find order by prescription relation:", findErr.message);
      }
    }

    if (linkedOrder) {
      try {
        if (!rx.order_id) {
          rx.order_id = linkedOrder._id.toString();
          await rx.save();
        }
        if (newStatus === "verified" && ["pending_verification", "pending"].includes(linkedOrder.order_status)) {
          linkedOrder.order_status = "confirmed";
          linkedOrder.prescription_verified = true;
          await linkedOrder.save();
        } else if (newStatus === "rejected") {
          linkedOrder.order_status = "cancelled";
          await linkedOrder.save();
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
    } catch {
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

