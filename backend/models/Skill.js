const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    tags: [{ type: String }],
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
    timeRequired: { type: String }, // e.g., "5 hours", "2 weeks"
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        date: { type: Date, default: Date.now }
    }],
    rating: { type: Number, default: 0 },
    resources: [{
        name: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String } // e.g. "PDF", "Link", "Note"
    }],
    recordedLessons: [{
        title: { type: String, required: true },
        videoUrl: { type: String, required: true },
        duration: { type: String },
        thumbnail: { type: String }
    }],
    nextSessionDate: { type: String },
    nextSessionTime: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Skill', SkillSchema);
