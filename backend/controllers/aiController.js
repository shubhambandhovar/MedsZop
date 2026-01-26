const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const genAI = new GoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

exports.doctorChat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }
    //
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(message);

    const reply = result.response.text();

    res.json({ response: reply });
  } catch (error) {
    console.error("Gemini Error:", error);

    res.status(500).json({
      message: "AI service temporarily unavailable",
    });
  }
};
