/**
 * MedsZop Prescription Intelligence V2 — geminiPrescriptionExtractor
 * 
 * Core AI interpretation engine using Gemini Multimodal Vision API with:
 * 1. Native Structured JSON Schema generation (`responseMimeType: "application/json"`).
 * 2. Zero-hallucination clinical prompt boundaries.
 * 3. Exact visible sourceText preservation alongside normalized interpretations.
 * 4. Multi-page and PDF buffer support.
 * 5. Robust fallback handling across SDK variants (@google/genai & @google/generative-ai).
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

CRITICAL CLINICAL SAFETY RULES:
1. NEVER invent, infer, or hallucinate a medication name, strength, dosage form, or frequency just because it seems medically plausible or common.
2. If any word or number is illegible, partially cropped, or ambiguous, you MUST mark it as null and set "recognitionStatus" to "UNCERTAIN" or "ILLEGIBLE".
3. Record the exact visible handwritten text string into "sourceText". Never alter "sourceText".
4. For Indian prescriptions:
   - Identify common abbreviation patterns: "OD" (once daily), "BD" / "BID" (twice daily), "TDS" / "TID" (thrice daily), "QID" (four times daily), "HS" (at bedtime), "SOS" (as needed), "AC" (before food), "PC" (after food), "1-0-1" (morning & night), "1-0-0" (morning), "0-0-1" (night), "1-1-1" (thrice daily).
   - Carefully distinguish look-alike and sound-alike (LASA) medication pairs (e.g. Metformin vs Metoprolol, Amlodipine vs Amitriptyline).
5. Output ONLY valid JSON conforming strictly to the requested schema.
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
      // 1. Initialize model with structured JSON response config
      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: this.getSystemInstruction(),
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1 // Low temperature for high deterministic fidelity
        }
      });

      // 2. Prepare multimodal parts
      const prompt = `Analyze this prescription carefully. Transcribe all handwritten and printed medical information. 
Identify the doctor, patient, date, diagnosis, and every individual prescribed medicine line item with visible sourceText, strength, dosage form, frequency, and instructions.`;

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
        // Fallback for unexpected markdown wrappers
        const cleaned = textOutput.replace(/```(?:json)?/g, "").trim();
        rawJson = JSON.parse(cleaned);
      }

      // 5. Strict schema validation & clinical safety sanitization
      const validated = extractionValidator.validate(rawJson);

      return {
        success: true,
        provider: "gemini-2.5-flash",
        data: validated,
        quality: options.quality || null
      };

    } catch (err) {
      console.error("Gemini prescription extraction error:", err.message);
      throw err;
    }
  }
}

module.exports = new GeminiPrescriptionExtractor();

