const express = require('express');
const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

const Booking = require('../models/Booking');

// Get all conversations list for current user
router.get('/', auth, async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        // 1. Get users from chat history
        const chatPartners = await Chat.aggregate([
            { $match: { $or: [{ sender: userId }, { receiver: userId }] } },
            { $group: { _id: { $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"] } } }
        ]);

        // 2. Get users from bookings
        const bookings = await Booking.find({
            $or: [{ student: userId }, { teacher: userId }]
        }).select('student teacher');

        const bookingPartners = bookings.map(b =>
            b.student.toString() === userId.toString() ? b.teacher : b.student
        );

        // Combine IDs
        const allPartnerIds = [
            ...chatPartners.map(p => p._id),
            ...bookingPartners
        ];

        // Unique IDs
        const uniqueIds = Array.from(new Set(allPartnerIds.map(id => id.toString()))).map(id => new mongoose.Types.ObjectId(id));

        // Get user details and unread status
        const conversations = await User.find({ _id: { $in: uniqueIds } }).select('name profilePhoto');

        // For each user, get the last message and unread count
        const result = await Promise.all(conversations.map(async (partner) => {
            const lastMsg = await Chat.findOne({
                $or: [
                    { sender: userId, receiver: partner._id },
                    { sender: partner._id, receiver: userId }
                ]
            }).sort({ timestamp: -1 });

            const unread = await Chat.countDocuments({
                sender: partner._id,
                receiver: userId,
                readStatus: false
            });

            return {
                _id: partner._id,
                user: partner,
                lastMessage: lastMsg ? lastMsg.message : "No messages yet",
                timestamp: lastMsg ? lastMsg.timestamp : null,
                unreadCount: unread
            };
        }));

        res.json(result.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get Chat History with a specific user
router.get('/:userId', auth, async (req, res) => {
    try {
        const messages = await Chat.find({
            $or: [
                { sender: req.user.id, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user.id }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Mark messages as read
router.put('/read/:userId', auth, async (req, res) => {
    try {
        await Chat.updateMany(
            { sender: req.params.userId, receiver: req.user.id, readStatus: false },
            { $set: { readStatus: true } }
        );
        res.json({ msg: 'Messages marked as read' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get total unread count for current user
router.get('/unread-count/total', auth, async (req, res) => {
    try {
        const count = await Chat.countDocuments({
            receiver: req.user.id,
            readStatus: false
        });
        res.json({ count });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// AI Chat Helper (Stub)
router.post('/ai-helper', auth, async (req, res) => {
    try {
        const { messageContext } = req.body;
        // Mock AI suggestion
        const suggestion = "Here's a suggested reply: 'That sounds great! When are you available for a session?'";
        res.json({ suggestion });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
