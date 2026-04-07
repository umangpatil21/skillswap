const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    age: { type: Number },
    bio: { type: String },
    headline: { type: String },
    location: { type: String },
    occupation: { type: String },
    education: [{
        school: String,
        degree: String,
        year: String
    }],
    languages: [{ type: String }],
    gender: { type: String },
    profilePhoto: { type: String, default: 'default.jpg' },
    socialLinks: {
        linkedin: String,
        twitter: String,
        github: String,
        website: String
    },
    skillsToTeach: [{ type: String }],
    skillsToLearn: [{ type: String }],
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
