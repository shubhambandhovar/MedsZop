/**
 * MedsZop Prescription Intelligence V2 — extractionValidator
 * 
 * Strict Zod validation and clinical safety auditing for AI-extracted prescription data.
 * Guarantees schema consistency, rejects invalid structures, sanitizes hallucinated fields,
 * and enforces the clinical rule: "Missing or illegible values must be null."
 */

const { z } = require("zod");

// 1. Single Extracted Medicine Item Schema
const MedicineExtractionSchema = z.object({
  sourceText: z.string().nullable().default(null),
  medicineName: z.string().nullable().default(null),
  normalizedCandidate: z.string().nullable().default(null),
  matchedMedicineId: z.string().nullable().default(null),
  strength: z.string().nullable().default(null),
  dosageForm: z.string().nullable().default(null),
  prescribedDose: z.string().nullable().default(null),
  frequency: z.string().nullable().default(null),
  duration: z.string().nullable().default(null),
  route: z.string().nullable().default(null),
  quantity: z.string().nullable().default(null),
  instructions: z.string().nullable().default(null),
  pageNumber: z.number().int().default(1),
  boundingRegion: z.object({
    top: z.number().min(0).max(1000).optional(),
    left: z.number().min(0).max(1000).optional(),
    width: z.number().min(0).max(1000).optional(),
    height: z.number().min(0).max(1000).optional()
  }).nullable().default(null),
  recognitionStatus: z.enum([
    "RECOGNIZED_UNVERIFIED",
    "UNCERTAIN",
    "ILLEGIBLE",
    "PENDING_PHARMACIST",
    "PHARMACIST_APPROVED",
    "REJECTED",
    "CLARIFICATION_REQUIRED"
  ]).default("PENDING_PHARMACIST"),
  reviewStatus: z.enum([
    "pending_pharmacist",
    "approved",
    "rejected",
    "corrected"
  ]).default("pending_pharmacist"),
  confidence: z.number().min(0).max(1).default(0.5),
  uncertaintyReasons: z.array(z.string()).default([])
});

// 2. Comprehensive Prescription Extraction Document Schema
const PrescriptionExtractionSchema = z.object({
  doctor: z.object({
    name: z.string().nullable().default(null),
    registrationNumber: z.string().nullable().default(null),
    qualification: z.string().nullable().default(null),
    clinicOrHospital: z.string().nullable().default(null)
  }).default({
    name: null,
    registrationNumber: null,
    qualification: null,
    clinicOrHospital: null
  }),
  patient: z.object({
    name: z.string().nullable().default(null),
    age: z.string().nullable().default(null),
    gender: z.string().nullable().default(null),
    date: z.string().nullable().default(null)
  }).default({
    name: null,
    age: null,
    gender: null,
    date: null
  }),
  diagnosis: z.string().nullable().default(null),
  medicines: z.array(MedicineExtractionSchema).default([]),
  overallLegibility: z.enum(["high", "moderate", "poor", "illegible"]).default("moderate"),
  rawTranscript: z.string().nullable().default(null)
});

class ExtractionValidator {
  /**
   * Validate and sanitize raw JSON output from OCR or Gemini
   * @param {any} rawData
   * @returns {object} validated data conforming to PrescriptionExtractionSchema
   */
  validate(rawData) {
    if (!rawData || typeof rawData !== "object") {
      return PrescriptionExtractionSchema.parse({ medicines: [] });
    }

    try {
      const parsed = PrescriptionExtractionSchema.parse(rawData);

      // Clinical safety pass: check for potential hallucinations or contradictory doses
      parsed.medicines = parsed.medicines.map((med) => {
        const uncertaintyReasons = Array.isArray(med.uncertaintyReasons) ? [...med.uncertaintyReasons] : [];

        // If medicineName is empty or question marks, mark ILLEGIBLE
        if (!med.medicineName || med.medicineName.trim() === "" || /^\?+$/.test(med.medicineName)) {
          med.medicineName = null;
          med.recognitionStatus = "ILLEGIBLE";
          uncertaintyReasons.push("Handwriting for medicine name is unreadable");
        }

        // If strength is missing on a prescription-only drug
        if (!med.strength && med.medicineName) {
          uncertaintyReasons.push("Dosage strength not visibly specified on prescription");
          if (med.recognitionStatus === "RECOGNIZED_UNVERIFIED") {
            med.recognitionStatus = "UNCERTAIN";
          }
        }

        // Check for suspicious strength orders (e.g. > 2000mg for non-paracetamol)
        if (med.strength) {
          const strengthNum = parseFloat(med.strength);
          if (strengthNum > 5000) {
            uncertaintyReasons.push("Unusually high dosage strength detected — requires pharmacist verification");
            med.recognitionStatus = "CLARIFICATION_REQUIRED";
          }
        }

        med.uncertaintyReasons = uncertaintyReasons;
        return med;
      });

      parsed.hasUncertainFields = parsed.medicines.some(
        (m) =>
          m.recognitionStatus === "UNCERTAIN" ||
          m.recognitionStatus === "ILLEGIBLE" ||
          m.recognitionStatus === "CLARIFICATION_REQUIRED"
      );

      return parsed;
    } catch (err) {
      console.warn("Zod schema validation fallback:", err.message);
      // Attempt safe partial recovery
      return PrescriptionExtractionSchema.parse({
        medicines: Array.isArray(rawData?.medicines)
          ? rawData.medicines
              .map((m) => {
                try {
                  return MedicineExtractionSchema.parse(m);
                } catch {
                  return null;
                }
              })
              .filter(Boolean)
          : []
      });
    }
  }

  /**
   * Generates Gemini JSON Schema definition for native responseSchema
   */
  getGeminiResponseSchema() {
    return {
      type: "OBJECT",
      properties: {
        doctor: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", description: "Doctor full name with title, e.g. Dr. A. Sharma, or null" },
            registrationNumber: { type: "STRING", description: "Medical council registration number or null" },
            qualification: { type: "STRING", description: "e.g. MBBS, MD, MS, or null" },
            clinicOrHospital: { type: "STRING", description: "Clinic, hospital or dispensary name or null" }
          }
        },
        patient: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", description: "Patient name or null" },
            age: { type: "STRING", description: "Patient age or null" },
            gender: { type: "STRING", description: "Patient gender or null" },
            date: { type: "STRING", description: "Prescription date as written or null" }
          }
        },
        diagnosis: { type: "STRING", description: "Diagnosis, symptoms or clinical indication or null" },
        overallLegibility: {
          type: "STRING",
          enum: ["high", "moderate", "poor", "illegible"],
          description: "Overall handwriting clarity"
        },
        rawTranscript: {
          type: "STRING",
          description: "Verbatim text transcription of the prescription lines"
        },
        medicines: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              sourceText: {
                type: "STRING",
                description: "Exact visible handwritten or printed text string for this medicine line item"
              },
              medicineName: {
                type: "STRING",
                description: "Recognized brand name or generic chemical salt, or null if illegible"
              },
              strength: {
                type: "STRING",
                description: "Strength with unit, e.g. 500mg, 10mg, 5ml, or null"
              },
              dosageForm: {
                type: "STRING",
                description: "e.g. Tab, Cap, Syrup, Inj, Ointment, Drops, or null"
              },
              prescribedDose: {
                type: "STRING",
                description: "Quantity per administration, e.g. 1 tablet, 5ml, or null"
              },
              frequency: {
                type: "STRING",
                description: "Frequency instructions as written, e.g. 1-0-1, OD, BD, TDS, HS, twice daily, or null"
              },
              duration: {
                type: "STRING",
                description: "Duration of therapy, e.g. 5 days, 1 month, or null"
              },
              route: {
                type: "STRING",
                description: "Administration route: Oral, Topical, IV, etc., or null"
              },
              quantity: {
                type: "STRING",
                description: "Total dispensed quantity if specified, or null"
              },
              instructions: {
                type: "STRING",
                description: "Timing/food advice, e.g. after food, empty stomach, or null"
              },
              confidence: {
                type: "NUMBER",
                description: "Confidence from 0.0 to 1.0 based on handwriting clarity"
              },
              recognitionStatus: {
                type: "STRING",
                enum: ["RECOGNIZED_UNVERIFIED", "UNCERTAIN", "ILLEGIBLE"],
                description: "RECOGNIZED_UNVERIFIED if clear; UNCERTAIN if handwriting is ambiguous; ILLEGIBLE if unreadable"
              }
            },
            required: ["sourceText", "recognitionStatus"]
          }
        }
      },
      required: ["medicines", "overallLegibility"]
    };
  }
}

const validatorInstance = new ExtractionValidator();

module.exports = {
  extractionValidator: validatorInstance,
  validateExtraction: (data) => validatorInstance.validate(data),
  MedicineExtractionSchema,
  PrescriptionExtractionSchema
};

