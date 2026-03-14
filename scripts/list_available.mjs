import fs from 'fs';

const envPath = '.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
let API_KEY = '';
for (const line of lines) {
    if (line.startsWith('VITE_GEMINI_API_KEY=')) {
        API_KEY = line.split('=')[1].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    }
}

async function listModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    console.log(`Listing models: ${url.replace(API_KEY, '[HIDDEN]')}`);
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (res.ok) {
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log(`[FAIL] ${res.status} - ${JSON.stringify(data)}`);
        }
    } catch (e) {
        console.log(`[ERROR] ${e.message}`);
    }
}

listModels();
