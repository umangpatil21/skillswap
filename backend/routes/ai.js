const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// @route   GET api/ai/match
// @desc    Get AI-powered skill matches for the logged-in user
// @access  Private
router.get('/match', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const allUsers = await User.find({ _id: { $ne: user.id } }).select('name email skillsToTeach skillsToLearn bio');

        const prompt = `
        User: ${user.name}
        Skills to Learn: ${user.skillsToLearn.join(', ')}
        Skills to Teach: ${user.skillsToTeach.join(', ')}
        Bio: ${user.bio}

        Others:
        ${allUsers.map(u => `ID: ${u._id}, Name: ${u.name}, Teaches: ${u.skillsToTeach.join(', ')}, Learns: ${u.skillsToLearn.join(', ')}`).join('\n')}

        Task: Find the top 3 people who can teach ${user.name} what they want to learn, OR who want to learn what ${user.name} can teach.
        Return ONLY a JSON array of their IDs and a brief reason why they are a match.
        Format: [{"id": "...", "reason": "..."}]
        `;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "liquid/lfm-2.5-1.2b-instruct:free",
                "messages": [
                    { "role": "user", "content": prompt }
                ]
            })
        });

        const data = await response.json();
        const text = data.choices[0].message.content;

        // Extract JSON from the response
        const jsonMatch = text.match(/\[.*\]/s);
        const matches = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

        res.json(matches);
    } catch (err) {
        console.error('❌ OpenRouter Error Details:', err);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/ai/chat
// @desc    Chat with SkillSwap AI assistant
// @access  Private
router.post('/chat', auth, async (req, res) => {
    try {
        const { message, history } = req.body;

        console.log('🤖 Calling OpenRouter with model: liquid/lfm-2.5-1.2b-instruct:free');

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "liquid/lfm-2.5-1.2b-instruct:free",
                "messages": [
                    { "role": "system", "content": "You are the SkillSwap Assistant. Your ONLY job is to help users navigate the SkillSwap platform and connect with other users for skill exchanges. When users mention wanting to learn a skill (like Python, Guitar, etc.), DO NOT provide external learning resources or websites. Instead, guide them to: 1) Use the 'Explore' page to find teachers on SkillSwap, 2) Use the 'AI Match' feature to find perfect learning partners, 3) Book sessions with teachers, 4) Check 'Recorded Lessons' for video tutorials from SkillSwap teachers. Always keep responses focused on SkillSwap features. Be concise and platform-focused." },
                    ...(history || []).map(h => ({
                        role: h.role === 'assistant' ? 'assistant' : 'user',
                        content: h.content
                    })),
                    { "role": "user", "content": message }
                ]
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('❌ OpenRouter API Error:', data.error);
            return res.status(500).json({ error: data.error.message });
        }

        const reply = data.choices[0].message.content;
        res.json({ content: reply });
    } catch (err) {
        console.error('❌ Gemini Error Detail:', err);
        res.status(500).json({
            error: 'AI Assistant failed',
            details: err.message
        });
    }
});

module.exports = router;
