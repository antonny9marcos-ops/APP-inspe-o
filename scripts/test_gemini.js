import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');

async function test() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Respond with 'OK'");
        const response = await result.response;
        console.log("Response:", response.text());
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
