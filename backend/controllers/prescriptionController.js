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

    // 2️⃣ Prepare Gemini Vision
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    // Remove data:image/jpeg;base64, prefix if exists
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `
    You are an expert medical pharmacist. Analyze this prescription image (which might be handwritten) and extract all medicines listed.
    
    Return ONLY valid JSON in this format:
    {
      "medicines": [
        {
          "name": "Full name of the medicine",
          "dosage": "e.g., 500mg",
          "frequency": "e.g., twice a day",
          "duration": "e.g., 5 days"
        }
      ]
    }
    
    If it's handwritten, look closely at the medication names. If no medicines are found, return an empty list.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      }
    ]);

    const textOutput = result.response.text();
    console.log("Gemini Raw Output:", textOutput);

    // 3️⃣ SAFE JSON extraction
    let parsed = { medicines: [] };
    try {
      const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0].trim());
      }
    } catch (err) {
      console.error("❌ Gemini Vision JSON parse failed", textOutput);
    }

    // 4️⃣ Response
    return res.json({
      rawText: "Extracted via Gemini Vision",
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
