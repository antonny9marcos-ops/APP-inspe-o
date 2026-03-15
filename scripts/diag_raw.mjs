import fs from 'fs';
import path from 'path';

// Manual env loading
const envPath = '.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
let API_KEY = '';
for (const line of lines) {
    if (line.startsWith('VITE_GEMINI_API_KEY=')) {
        API_KEY = line.split('=')[1].trim().trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    }
}
console.log(`Extracted API_KEY length: ${API_KEY.length}`);
console.log(`Extracted API_KEY starts with: ${API_KEY.substring(0, 5)}...`);

async function checkModel(version, model) {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${API_KEY}`;
    console.log(`Checking: ${url.replace(API_KEY, '[HIDDEN]')}`);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'Respond with OK only.' }] }] })
        });
        const data = await res.json();
        if (res.ok) {
            console.log(`[PASS] ${version}/${model}: ${data.candidates[0].content.parts[0].text}`);
            return true;
        } else {
            console.log(`[FAIL] ${version}/${model}: ${res.status} - ${data.error?.message || JSON.stringify(data)}`);
            return false;
        }
    } catch (e) {
        console.log(`[ERROR] ${version}/${model}: ${e.message}`);
        return false;
    }
}

async function run() {
    if (!API_KEY) {
        console.log("API_KEY not found in .env.local");
        return;
    }

    const versions = ['v1', 'v1beta'];
    const models = [
        'gemini-1.5-flash', 
        'gemini-1.5-flash-latest', 
        'gemini-1.5-pro', 
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'gemini-pro', 
        'gemini-1.0-pro'
    ];

    for (const v of versions) {
        for (const m of models) {
            await checkModel(v, m);
        }
    }
}

run();
