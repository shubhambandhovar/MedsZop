const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.parsePrescriptionWithGemini = async (req, res) => {
  try {
    const { text } = req.body;
    // Gemini prompt for extracting medicines
    const prompt = `Extract medicines from prescription text. Return JSON: { "medicines": [ {"name":"","dosage":"","frequency":"","duration":""} ] }\nText: ${text}`;
    const model = geminiClient.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ parsed: response.text() });
  } catch (error) {
    res.status(500).json({ error: 'Gemini parsing failed', details: error.message });
  }
};
