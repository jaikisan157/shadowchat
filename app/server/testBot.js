// Quick test of the Groq API
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '.env') });

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const apiKey = process.env.GROQ_API_KEY;

console.log('Testing Groq API...');
console.log('API Key:', apiKey ? 'SET (' + apiKey.substring(0, 8) + '...)' : 'NOT SET');

try {
    const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: 'You are a casual teenager on an anonymous chat app. Keep responses to 1 sentence max.' },
                { role: 'user', content: 'hey whats up' },
            ],
            max_tokens: 50,
            temperature: 0.9,
        }),
    });

    if (!res.ok) {
        console.error('❌ Error:', res.status, await res.text());
    } else {
        const data = await res.json();
        console.log('✅ Response:', data.choices[0].message.content);
    }
} catch (err) {
    console.error('❌ Error:', err.message);
}
