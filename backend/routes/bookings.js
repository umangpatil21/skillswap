const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');

// Create Booking
router.post('/', auth, async (req, res) => {
    try {
        const { teacherId, skillId, date, time } = req.body;

        const newBooking = new Booking({
            student: req.user.id,
            teacher: teacherId,
            skill: skillId,
            date,
            time // You might want to combine date/time in real app
        });

        const booking = await newBooking.save();
        res.json(booking);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get My Bookings (as student or teacher)
router.get('/', auth, async (req, res) => {
    try {
        const bookings = await Booking.find({
            $or: [{ student: req.user.id }, { teacher: req.user.id }]
        })
            .populate('student', 'name')
            .populate('teacher', 'name')
            .populate('skill', 'title')
            .sort({ date: -1 });

        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update Booking Status (Accept/Reject)
router.put('/:id', auth, async (req, res) => {
    try {
        const { status, meetingLink } = req.body;
        let booking = await Booking.findById(req.params.id).populate('student skill');

        if (!booking) return res.status(404).json({ msg: 'Booking not found' });

        // Only teacher can accept/reject? Or maybe student can cancel?
        // For simplicity, just updating
        if (status) booking.status = status;
        if (meetingLink) booking.meetingLink = meetingLink;
        if (req.body.attended !== undefined) booking.attended = req.body.attended;

        await booking.save();

        // Auto-generate certificate when booking is marked as completed
        if (status === 'completed' && booking.student && booking.skill) {
            try {
                const axios = require('axios');
                await axios.post(
                    'https://skillswap-ejm8.onrender.com/api/certificate/generate',
                    {
                        userId: booking.student._id,
                        skillId: booking.skill._id
                    },
                    {
                        headers: { 'x-auth-token': req.header('x-auth-token') }
                    }
                );
                console.log(`✅ Certificate auto-generated for user ${booking.student._id} - skill ${booking.skill._id}`);
            } catch (certErr) {
                console.error('❌ Error auto-generating certificate:', certErr.message);
                // Don't fail the booking update if certificate generation fails
            }
        }

        res.json(booking);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
