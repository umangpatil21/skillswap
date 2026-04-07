require('dotenv').config();

async function testOpenRouter() {
    const key = process.env.OPENROUTER_API_KEY;
    console.log('Testing OpenRouter with key starting with:', key.substring(0, 7));

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "meta-llama/llama-3.1-8b-instruct:free",
                "messages": [
                    { "role": "user", "content": "Hello, respond with 'Success' if you work." }
                ]
            })
        });

        const data = await response.json();
        if (data.choices) {
            console.log('✅ OpenRouter Response:', data.choices[0].message.content);
        } else {
            console.log('❌ OpenRouter Error:', data);
        }
    } catch (err) {
        console.error('❌ Direct test failed:', err.message);
    }
}

testOpenRouter();
