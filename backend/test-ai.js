const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
    console.log('Testing with Key:', process.env.GEMINI_API_KEY ? 'EXISTS' : 'MISSING');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
        console.log('Testing with API v1...');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1" });
        const result = await model.generateContent("Hi");
        console.log("✅ gemini-1.5-flash works on v1!");
    } catch (err) {
        console.error("❌ gemini-1.5-flash failed on v1:", err);
    }
}

test();
