require('dotenv').config();

async function listModels() {
    const key = process.env.OPENROUTER_API_KEY;
    try {
        const response = await fetch("https://openrouter.ai/api/v1/models", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${key}`
            }
        });

        const data = await response.json();
        if (data.data) {
            console.log('Available Models (first 10):');
            data.data.slice(0, 10).forEach(m => console.log(`- ${m.id} (${m.name})`));
        } else {
            console.log('❌ Error listing models:', data);
        }
    } catch (err) {
        console.error('❌ Listing failed:', err.message);
    }
}

listModels();
