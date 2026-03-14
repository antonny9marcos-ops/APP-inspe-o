import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

async function check(version, model) {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${API_KEY}`;
    console.log(`Checking ${version}/${model}...`);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] })
        });
        const data = await res.json();
        if (res.ok) {
            console.log(`[Success] ${version}/${model}`);
        } else {
            console.error(`[Fail] ${version}/${model}: ${res.status} ${JSON.stringify(data)}`);
        }
    } catch (e) {
        console.error(`[Error] ${version}/${model}: ${e.message}`);
    }
}

async function run() {
    await check('v1', 'gemini-1.5-flash');
    await check('v1beta', 'gemini-1.5-flash');
    await check('v1', 'gemini-pro');
    await check('v1beta', 'gemini-pro');
}

run();
