const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testScan() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        console.log("Model initialized: gemini-1.5-flash");

        const prompt = "Identify this text.";
        // Minimal valid base64 image (1x1 pixel white dot)
        // const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAwAB/AL+f4qAAAAABJRU5ErkJggg==";
        // The controller expects the data part.
        const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAwAB/AL+f4qAAAAABJRU5ErkJggg==";

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "image/png" // Using png for this test
                }
            }
        ]);

        console.log("Response:", result.response.text());
    } catch (error) {
        console.error("Error:", error.message);
    }
}

testScan();
