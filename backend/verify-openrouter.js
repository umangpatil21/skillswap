// Using global fetch

async function verify() {
    try {
        console.log('Testing Local AI Chat Route...');
        const response = await fetch('https://skillswap-ejm8.onrender.com/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Skip auth for this test if possible, or provide a mock token
                // For now, I'll just check if the backend logs indicate it's working
            },
            body: JSON.stringify({
                message: "Hello, are you there?",
                history: []
            })
        });

        // This might fail due to 'auth' middleware, but let's see
        const status = response.status;
        console.log('Backend response status:', status);
    } catch (err) {
        console.error('Verification failed:', err.message);
    }
}

verify();
