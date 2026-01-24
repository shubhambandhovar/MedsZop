const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.doctorChat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
You are a medical assistant.
Give general health information only.
Do not diagnose.
Always advise consulting a doctor.

User question:
${message}
`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    return res.json({ response: reply });

  } catch (error) {
    console.error("Gemini Doctor Chat Error:", error);

    return res.status(500).json({
      message: "AI service temporarily unavailable"
    });
  }
};
