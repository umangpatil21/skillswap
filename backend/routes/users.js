const express = require('express');
const User = require('../models/User');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure Multer for profile photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update Profile
router.put('/profile', auth, async (req, res) => {
    try {
        const {
            name, age, bio, socialLinks, skillsToTeach, skillsToLearn,
            headline, location, occupation, education, languages, gender
        } = req.body;

        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.name = name || user.name;
        user.age = age || user.age;
        user.bio = bio || user.bio;
        user.socialLinks = socialLinks || user.socialLinks;
        user.skillsToTeach = skillsToTeach || user.skillsToTeach;
        user.skillsToLearn = skillsToLearn || user.skillsToLearn;

        // New professional fields
        user.headline = headline !== undefined ? headline : user.headline;
        user.location = location !== undefined ? location : user.location;
        user.occupation = occupation !== undefined ? occupation : user.occupation;
        user.education = education !== undefined ? education : user.education;
        user.languages = languages !== undefined ? languages : user.languages;
        user.gender = gender !== undefined ? gender : user.gender;

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Upload Profile Photo
router.post('/upload-photo', auth, upload.single('profilePhoto'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Update user profile photo
        user.profilePhoto = req.file.filename;
        await user.save();

        res.json({ profilePhoto: req.file.filename, msg: 'Profile photo updated successfully' });
    } catch (err) {
        console.error("Upload error:", err.message);
        res.status(500).send('Server Error');
    }
});

// Get User by ID (Public)
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'User not found' });
        res.status(500).send('Server Error');
    }
});

module.exports = router;
