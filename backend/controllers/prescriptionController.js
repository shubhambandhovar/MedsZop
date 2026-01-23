const Tesseract = require("tesseract.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.scanPrescription = async (req, res) => {
  try {
    const { base64Image } = req.body;

    // 1️⃣ Validate input
    if (!base64Image || typeof base64Image !== "string") {
      return res.status(400).json({ message: "No image provided" });
    }

    // 2️⃣ Convert base64 → buffer
    const imageBuffer = Buffer.from(base64Image, "base64");

    if (!imageBuffer || imageBuffer.length === 0) {
      return res.status(400).json({ message: "Invalid image data" });
    }

    // 3️⃣ OCR with Tesseract (SAFE)
    const ocrResult = await Tesseract.recognize(imageBuffer, "eng");
    const extractedText = ocrResult?.data?.text || "";

    if (!extractedText.trim()) {
      return res.json({
        rawText: "",
        parsed: { medicines: [] }
      });
    }

    // 4️⃣ Gemini AI (USE STABLE MODEL)
    const model = genAI.getGenerativeModel({
      model: "gemini-pro"
    });

    const prompt = `
Extract medicines from the prescription text below.

Return ONLY valid JSON in this format:

{
  "medicines": [
    {
      "name": "",
      "dosage": "",
      "frequency": "",
      "duration": ""
    }
  ]
}

Prescription text:
${extractedText}
`;

    const result = await model.generateContent(prompt);
    const textOutput = result.response.text();

    // 5️⃣ SAFE JSON extraction
    let parsed = { medicines: [] };

    try {
      const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.error("❌ Gemini JSON parse failed");
    }

    // 6️⃣ Final response (matches frontend)
    return res.json({
      rawText: extractedText,
      parsed
    });

  } catch (error) {
    console.error("❌ Prescription scan error:", error);
    return res.status(500).json({
      message: "Prescription scanning failed",
      error: error.message
    });
  }
};
