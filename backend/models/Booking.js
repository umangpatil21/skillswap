const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    date: { type: Date, required: true },
    time: { type: String },
    status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed', 'confirmed'], default: 'pending' },
    attended: { type: Boolean, default: false },
    meetingLink: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
