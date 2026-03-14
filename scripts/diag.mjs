import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

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
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];

    for (const v of versions) {
        for (const m of models) {
            const success = await checkModel(v, m);
            if (success) {
                console.log(`\n>>> FOUND WORKING COMBINATION: ${v}/${m} <<<\n`);
            }
        }
    }
}

run();
