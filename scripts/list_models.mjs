import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || '');

async function listModels() {
    try {
        // The listModels method is not directly on genAI in some SDK versions, 
        // but we can try to fetch from the endpoint manually or check the error.
        console.log("Testing with gemini-1.5-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("test");
        console.log("Success with gemini-1.5-flash");
    } catch (e) {
        console.error("Error with gemini-1.5-flash:", e.message);
        
        console.log("Testing with gemini-pro...");
        try {
            const modelPro = genAI.getGenerativeModel({ model: "gemini-pro" });
            const resultPro = await modelPro.generateContent("test");
            console.log("Success with gemini-pro");
        } catch (e2) {
            console.error("Error with gemini-pro:", e2.message);
        }
    }
}

listModels();
