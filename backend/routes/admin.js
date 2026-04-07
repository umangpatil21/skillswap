const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Skill = require('../models/Skill');
const Chat = require('../models/Chat');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const adminAuth = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }
        next();
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

// Get Dashboard Analytics
router.get('/analytics', [auth, adminAuth], async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalSkills = await Skill.countDocuments();
        const totalChats = await Chat.countDocuments();
        const totalBookings = await Booking.countDocuments();

        // Most Popular Skills (by rating or booking count - simple mock here)
        // Group by category
        const skillsByCategory = await Skill.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        res.json({
            totalUsers,
            totalSkills,
            totalChats,
            totalBookings,
            skillsByCategory
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get all users (Admin only)
router.get('/users', [auth, adminAuth], async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete a user (Admin only)
router.delete('/users/:id', [auth, adminAuth], async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
