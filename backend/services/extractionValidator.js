/**
 * MedsZop Prescription Intelligence V2 — extractionValidator
 * 
 * Strict Zod validation and clinical safety auditing for AI-extracted prescription data.
 * Guarantees schema consistency, rejects invalid structures, sanitizes hallucinated fields,
 * and enforces the clinical rule: "Missing or illegible values must be null."
 * 
 * Separation of Observations from Suggestions:
 * - sourceText / recognizedFragment preserves raw visible character fragments.
 * - medicineName remains null for partial/uncertain readings until verified.
 * - possibleMatches holds up to 3 unverified candidates supported strictly by visible text.
 * - Visual state mapped strictly to:
 *     GREEN (AI recognized, still unverified)
 *     AMBER (Possible candidate / missing strength / LASA risk)
 *     RED (Illegible scribble / clinical contradiction)
 */

const { z } = require("zod");

// 1. Possible Medicine Match / Suggestion Schema
const PossibleMatchSchema = z.object({
  medicineName: z.string(),
  matchType: z.enum([
    "PARTIAL_HANDWRITING",
    "CATALOG_FUZZY",
    "ABBREVIATION",
    "PREFIX_MATCH",
    "PHONETIC_MATCH"
  ]).default("PARTIAL_HANDWRITING"),
  evidence: z.string().default("Visible character agreement"),
  verified: z.boolean().default(false),
  confidenceScore: z.number().min(0).max(1).optional(),
  genericName: z.string().nullable().optional().default(null),
  category: z.string().nullable().optional().default(null)
});

// 2. Single Extracted Medicine Item Schema
const MedicineExtractionSchema = z.object({
  sourceText: z.string().nullable().default(null),
  recognizedFragment: z.string().nullable().default(null),
  medicineName: z.string().nullable().default(null),
  canonicalName: z.string().nullable().default(null),
  normalizedCandidate: z.string().nullable().default(null),
  matchedMedicineId: z.string().nullable().default(null),
  matchedGenericName: z.string().nullable().default(null),
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
  possibleMatches: z.array(PossibleMatchSchema).default([]),
  requiresPharmacistReview: z.boolean().default(true),
  confidence: z.number().min(0).max(1).default(0.5),
  uncertaintyReasons: z.array(z.string()).default([]),
  missingStrengthWarning: z.boolean().default(false),
  lasaAlert: z.any().nullable().default(null),
  visualState: z.enum(["GREEN", "AMBER", "RED"]).default("AMBER")
});

// 3. Comprehensive Prescription Extraction Document Schema
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
  rawTranscript: z.string().nullable().default(null),
  hasUncertainFields: z.boolean().default(false)
});

class ExtractionValidator {
  /**
   * Validate and sanitize raw JSON output from OCR or Gemini
   * @param {any} rawData
   * @returns {object} validated data conforming to PrescriptionExtractionSchema
   */
  validate(rawData) {
    if (!rawData || typeof rawData !== "object") {
      return PrescriptionExtractionSchema.parse({ medicines: [], hasUncertainFields: false });
    }

    try {
      const parsed = PrescriptionExtractionSchema.parse(rawData);

      // Clinical safety pass: check for potential hallucinations or contradictory doses
      parsed.medicines = parsed.medicines.map((med) => {
        const uncertaintyReasons = Array.isArray(med.uncertaintyReasons) ? [...med.uncertaintyReasons] : [];

        // Normalize sourceText and recognizedFragment
        if (!med.recognizedFragment && med.sourceText) {
          med.recognizedFragment = med.sourceText;
        }

        // Rule A: Illegible line detection (Zero Hallucination Gate)
        const isScribble =
          med.recognitionStatus === "ILLEGIBLE" ||
          ((!med.medicineName || med.medicineName.trim() === "" || /^\?+$/.test(med.medicineName)) &&
            (!med.recognizedFragment || /^[~?.!_\-\s*#^]+$/.test(med.recognizedFragment.trim())));

        if (isScribble) {
          med.medicineName = null;
          med.recognizedFragment = null;
          med.possibleMatches = []; // Refuse to fabricate candidates
          med.recognitionStatus = "ILLEGIBLE";
          med.visualState = "RED";
          uncertaintyReasons.push("Handwriting for this medicine line is unreadable scribble. Zero hallucination enforced.");
        }

        // Rule B: Partial handwriting observation (e.g. "Met...ol", "Ce~f~~ime")
        const hasFragmentWildcard =
          med.recognitionStatus !== "ILLEGIBLE" &&
          med.recognizedFragment &&
          (med.recognizedFragment.includes("...") || med.recognizedFragment.includes("~") || med.recognizedFragment.includes(".."));
        if (hasFragmentWildcard) {
          // Keep medicineName null until verified by pharmacist
          med.medicineName = null;
          med.recognitionStatus = "UNCERTAIN";
          med.visualState = "AMBER";
          uncertaintyReasons.push(`Partial handwriting fragment: "${med.recognizedFragment}". Unverified candidates generated for clinical review.`);
        }

        // Rule C: Missing strength check
        if (!med.strength && med.recognitionStatus !== "ILLEGIBLE") {
          med.missingStrengthWarning = true;
          uncertaintyReasons.push("Dosage strength not visibly specified on prescription");
          if (med.recognitionStatus === "RECOGNIZED_UNVERIFIED") {
            med.recognitionStatus = "UNCERTAIN";
          }
          if (med.visualState === "GREEN") {
            med.visualState = "AMBER";
          }
        }

        // Rule D: Check for suspicious high dosage orders
        if (med.strength) {
          const strengthNum = parseFloat(med.strength);
          if (strengthNum > 5000) {
            uncertaintyReasons.push("Unusually high dosage strength detected — requires pharmacist verification");
            med.recognitionStatus = "CLARIFICATION_REQUIRED";
            med.visualState = "RED";
          }
        }

        // Rule E: Visual state assignment
        if (med.recognitionStatus === "ILLEGIBLE" || med.recognitionStatus === "CLARIFICATION_REQUIRED") {
          med.visualState = "RED";
        } else if (med.recognitionStatus === "UNCERTAIN" || med.missingStrengthWarning || (med.lasaAlert && med.lasaAlert.isHighRisk)) {
          med.visualState = "AMBER";
        } else if (med.recognitionStatus === "RECOGNIZED_UNVERIFIED" && med.medicineName) {
          med.visualState = "GREEN";
        } else {
          med.visualState = "AMBER";
        }

        // Mandatory safety rule: All prescription medications require pharmacist review
        med.requiresPharmacistReview = true;
        med.uncertaintyReasons = uncertaintyReasons;
        return med;
      });

      parsed.hasUncertainFields = parsed.medicines.some(
        (m) =>
          m.visualState === "AMBER" ||
          m.visualState === "RED" ||
          m.recognitionStatus === "UNCERTAIN" ||
          m.recognitionStatus === "ILLEGIBLE" ||
          m.recognitionStatus === "CLARIFICATION_REQUIRED"
      );

      return parsed;
    } catch (err) {
      console.warn("Zod schema validation fallback:", err.message);
      // Attempt safe partial recovery
      const recoveredMeds = Array.isArray(rawData?.medicines)
        ? rawData.medicines
            .map((m) => {
              try {
                return MedicineExtractionSchema.parse(m);
              } catch {
                return null;
              }
            })
            .filter(Boolean)
        : [];

      return PrescriptionExtractionSchema.parse({
        medicines: recoveredMeds,
        hasUncertainFields: true
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
              recognizedFragment: {
                type: "STRING",
                description: "Exact visible character fragments, using ellipses '...' for obscured/unclear letters (e.g. 'Met...ol', 'Aug...tin', 'Pan...40'), or null if totally illegible"
              },
              medicineName: {
                type: "STRING",
                description: "Recognized brand or generic name IF legible with certainty. MUST BE NULL if handwriting is partial, ambiguous, or illegible"
              },
              strength: {
                type: "STRING",
                description: "Strength with unit, e.g. 500mg, 10mg, 5ml, or null if missing or illegible"
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
                description: "Confidence from 0.0 to 1.0 based strictly on handwriting stroke clarity"
              },
              recognitionStatus: {
                type: "STRING",
                enum: ["RECOGNIZED_UNVERIFIED", "UNCERTAIN", "ILLEGIBLE"],
                description: "RECOGNIZED_UNVERIFIED if clear; UNCERTAIN if handwriting is partial or ambiguous; ILLEGIBLE if unreadable scribble"
              },
              possibleMatches: {
                type: "ARRAY",
                description: "Up to 3 plausible medicine candidate suggestions derived strictly from visible character evidence",
                items: {
                  type: "OBJECT",
                  properties: {
                    medicineName: { type: "STRING", description: "Plausible medicine candidate" },
                    matchType: { type: "STRING", description: "PARTIAL_HANDWRITING, CATALOG_FUZZY, or ABBREVIATION" },
                    evidence: { type: "STRING", description: "Specific visible strokes or characters that support this candidate" },
                    verified: { type: "BOOLEAN", description: "Must always be false" }
                  },
                  required: ["medicineName", "evidence"]
                }
              },
              uncertaintyReasons: {
                type: "ARRAY",
                description: "Specific reasons for ambiguity, e.g. missing strength, occluded letters, cursive overlap",
                items: { type: "STRING" }
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
  PrescriptionExtractionSchema,
  PossibleMatchSchema
};
