/**
 * MedsZop Prescription Intelligence V2 — geminiPrescriptionExtractor
 * 
 * Core AI interpretation engine using Gemini Multimodal Vision API with:
 * 1. Native Structured JSON Schema generation (`responseMimeType: "application/json"`, `responseSchema`).
 * 2. Zero-hallucination clinical prompt boundaries.
 * 3. Partial handwriting recognition separating observations from suggestions.
 * 4. Preserved visible character fragments (e.g. "Met...ol") with up to 3 evidence-backed candidate readings.
 * 5. High-resolution buffer and PDF support.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { extractionValidator } = require("./extractionValidator");

class GeminiPrescriptionExtractor {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  /**
   * System prompt enforcing medical document transcription fidelity
   */
  getSystemInstruction() {
    return `
You are a senior clinical pharmacist and medical document transcription specialist analyzing handwritten doctor prescriptions from India.

CRITICAL CLINICAL TRANSCRIPTION & SAFETY DIRECTIVES:
1. INSPECT THE ENTIRE PRESCRIPTION:
   - Identify each individual prescribed medicine line.
   - Re-examine difficult, slanted, or messy handwritten cursive regions carefully.
   - Preserve the exact verbatim visible handwritten strokes in "sourceText".

2. PARTIAL HANDWRITING RECOGNITION (SEPARATION OF OBSERVATIONS FROM SUGGESTIONS):
   - When a handwritten line is only partially readable or letters are obscured by cursive ink, extract whatever character fragments you can genuinely see into "recognizedFragment", using ellipses "..." or "~" for missing/unclear letters (e.g., "Met...ol", "Aug...tin", "Ce~f~~ime", "Pan...40").
   - In such cases, you MUST KEEP "medicineName" as null. Do not turn a partially readable name into a confidently identified medicine.
   - If visible evidence suggests plausible candidate medications, provide up to 3 candidate readings in "possibleMatches" with an explicit "evidence" description (e.g. "Visible prefix 'Met' and suffix 'ol'").
   - Set "recognitionStatus" to "UNCERTAIN".

3. ZERO-HALLUCINATION ILLEGIBLE GATE:
   - If a handwritten line is an unreadable scribble, wavy line, or doctor signature with no identifiable character fragments, you MUST mark "recognitionStatus" as "ILLEGIBLE", "medicineName" as null, "recognizedFragment" as null, and "possibleMatches" as [] (empty array).
   - NEVER fabricate or invent medication candidates out of thin air when there is no visible character evidence.

4. MEDICAL CONTEXT DOES NOT EQUAL PROOF:
   - Avoid using the patient's diagnosis or therapeutic plausibility as "proof" of a medicine name. Candidates must be supported by actual visible pen strokes.
   - Missing strengths, dosages, and instructions MUST remain null. Never guess or invent dosages (e.g. do not assume 500mg or 650mg if not visibly written).

5. INDIAN PHARMACOPEIA & SIG ABBREVIATIONS:
   - Recognize common clinical shorthand: "OD" (once daily), "BD"/"BID" (twice daily), "TDS"/"TID" (thrice daily), "HS" (bedtime), "SOS" (as needed), "AC" (before food), "PC" (after food), "1-0-1", "1-0-0", "0-0-1", "1-1-1".
   - Be vigilant regarding Look-Alike / Sound-Alike (LASA) pairs (e.g. Metformin vs Metoprolol, Amlodipine vs Amitriptyline, Cefixime vs Cefuroxime).

6. Output ONLY valid JSON adhering strictly to the requested schema.
`;
  }

  /**
   * Extract medicines and clinical information from preprocessed image or PDF buffer
   * @param {Buffer} buffer - Preprocessed image or PDF buffer
   * @param {object} options
   * @param {string} options.mimeType - e.g. "image/jpeg", "application/pdf"
   * @param {object} options.quality - Quality metrics from preprocessor
   * @returns {Promise<object>} validated prescription extraction object
   */
  async extract(buffer, options = {}) {
    const mimeType = options.mimeType || "image/jpeg";
    const base64Data = buffer.toString("base64");

    if (!this.genAI) {
      this.apiKey = process.env.GEMINI_API_KEY;
      if (!this.apiKey) {
        throw new Error("GEMINI_API_KEY is not configured in environment variables");
      }
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }

    try {
      // 1. Initialize model with structured JSON response config & schema
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: this.getSystemInstruction(),
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: extractionValidator.getGeminiResponseSchema(),
          temperature: 0.1 // Low temperature for high deterministic fidelity
        }
      });

      // 2. Multimodal prompt directing evidence-grounded extraction
      const prompt = `Carefully inspect and transcribe this handwritten prescription document.
For each prescribed medicine line:
- Extract the verbatim visible text into "sourceText".
- If any letters are unclear, occluded, or messy, extract the legible character fragments into "recognizedFragment" (e.g., "Met...ol", "Aug...tin") and list up to 3 plausible candidates in "possibleMatches" with the visible evidence.
- Set "medicineName" to null if only a partial fragment is readable.
- If completely illegible, set "recognitionStatus" to "ILLEGIBLE", "medicineName" to null, and "possibleMatches" to [].
- Transcribe visible strength, frequency, and instructions, leaving any missing or illegible field as null.`;

      const contents = [
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType
          }
        }
      ];

      // 3. Execute inference
      const response = await model.generateContent(contents);
      const textOutput = response.response.text();

      // 4. Parse JSON safely
      let rawJson;
      try {
        rawJson = JSON.parse(textOutput);
      } catch (parseErr) {
        const cleaned = textOutput.replace(/```(?:json)?/g, "").trim();
        rawJson = JSON.parse(cleaned);
      }

      // 5. Strict schema validation & clinical safety sanitization
      const validatedData = extractionValidator.validate(rawJson);

      return {
        success: true,
        data: validatedData,
        quality: options.quality || null
      };

    } catch (error) {
      console.error("Gemini prescription extraction failed:", error.message);
      throw error;
    }
  }
}

module.exports = new GeminiPrescriptionExtractor();
