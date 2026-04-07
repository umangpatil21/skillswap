const express = require('express');
const router = express.Router();
const RecordedVideo = require('../models/RecordedVideo');
const auth = require('../middleware/auth');
const multer = require('multer');

// Configure Multer for video storage (mocking storage here just to 'uploads' folder)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Upload a Recorded Video
router.post('/upload', [auth, upload.single('video')], async (req, res) => {
    try {
        const { title, description } = req.body;
        // In a real app, 'req.file.path' would be uploaded to S3/Cloudinary
        // and that URL would be saved. 
        const videoUrl = req.file ? req.file.path : 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4';

        const newVideo = new RecordedVideo({
            title,
            description,
            teacher: req.user.id,
            videoUrl
        });

        await newVideo.save();
        res.json(newVideo);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get All Recorded Videos
router.get('/', async (req, res) => {
    try {
        const videos = await RecordedVideo.find().populate('teacher', 'name profilePhoto');
        res.json(videos);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
