const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Create a Skill
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, category, tags, level, timeRequired } = req.body;

        // Check if user already teaches this skill? (Optional)

        const newSkill = new Skill({
            title,
            description,
            category,
            tags,
            level,
            timeRequired,
            teacher: req.user.id
        });

        const skill = await newSkill.save();

        // Add to user's skillsToTeach
        await User.findByIdAndUpdate(req.user.id, { $addToSet: { skillsToTeach: title } });

        res.json(skill);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get all recorded lessons across all skills
router.get('/lessons/all', async (req, res) => {
    try {
        const skills = await Skill.find({ 'recordedLessons.0': { $exists: true } })
            .populate('teacher', 'name profilePhoto')
            .select('title category teacher rating recordedLessons');

        // Flatten the results into a single list of lessons
        const allLessons = [];
        skills.forEach(skill => {
            skill.recordedLessons.forEach(lesson => {
                allLessons.push({
                    ...lesson.toObject(),
                    skillTitle: skill.title,
                    category: skill.category,
                    teacher: skill.teacher,
                    skillRating: skill.rating,
                    skillId: skill._id
                });
            });
        });

        res.json(allLessons);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get Recommended Skills for User (based on skillsToLearn)
router.get('/recommendations', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.skillsToLearn || user.skillsToLearn.length === 0) {
            return res.json([]);
        }

        // Find skills where title matches any of the user's skillsToLearn
        const recommendations = await Skill.find({
            title: { $in: user.skillsToLearn }
        }).populate('teacher', 'name profilePhoto').limit(6);

        res.json(recommendations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get All Skills (Explore)
router.get('/', async (req, res) => {
    try {
        const skills = await Skill.find().populate('teacher', 'name profilePhoto');
        res.json(skills);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get Skill by ID
router.get('/:id', async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id).populate('teacher', 'name bio profilePhoto socialLinks');
        if (!skill) return res.status(404).json({ msg: 'Skill not found' });
        res.json(skill);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Skill not found' });
        res.status(500).send('Server Error');
    }
});

// Add Recorded Lesson to Skill
router.post('/:id/lessons', auth, async (req, res) => {
    try {
        const { title, videoUrl, duration, thumbnail } = req.body;
        const skill = await Skill.findById(req.params.id);

        if (!skill) return res.status(404).json({ msg: 'Skill not found' });

        if (skill.teacher.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized to add lessons to this skill' });
        }

        skill.recordedLessons.push({ title, videoUrl, duration, thumbnail });
        await skill.save();

        res.json(skill.recordedLessons);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update Recorded Lesson
router.put('/:id/lessons/:lessonId', auth, async (req, res) => {
    try {
        const { title, videoUrl, duration, thumbnail } = req.body;
        const skill = await Skill.findById(req.params.id);

        if (!skill) return res.status(404).json({ msg: 'Skill not found' });

        if (skill.teacher.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized to update lessons in this skill' });
        }

        const lesson = skill.recordedLessons.id(req.params.lessonId);
        if (!lesson) return res.status(404).json({ msg: 'Lesson not found' });

        if (title) lesson.title = title;
        if (videoUrl) lesson.videoUrl = videoUrl;
        if (duration) lesson.duration = duration;
        if (thumbnail) lesson.thumbnail = thumbnail;

        await skill.save();
        res.json(skill.recordedLessons);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete Recorded Lesson
router.delete('/:id/lessons/:lessonId', auth, async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id);

        if (!skill) return res.status(404).json({ msg: 'Skill not found' });

        if (skill.teacher.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized to delete lessons from this skill' });
        }

        skill.recordedLessons.pull({ _id: req.params.lessonId });
        await skill.save();

        res.json(skill.recordedLessons);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// AI Attribute Generator (Mock for now, or could use an API)
router.post('/generate-description', auth, async (req, res) => {
    try {
        const { title } = req.body;
        // Mock AI Generation logic
        // In production, call OpenAI/Gemini API here
        const explanation = `Comprehensive guide to mastering ${title}. Covers basics to advanced topics.`;
        const generatedTags = [title, 'Education', 'Tutorial', 'Beginner-Friendly'];
        const estimatedTime = "4 weeks";

        res.json({
            description: explanation,
            tags: generatedTags,
            timeRequired: estimatedTime,
            level: "Beginner"
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Simple Rule-Based AI Matching
router.get('/match/best', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const learningInterests = user.skillsToLearn || [];

        // Find skills that match user's interests
        // Regular expression for case-insensitive partial match
        const matches = await Skill.find({
            $or: [
                { title: { $in: learningInterests } },
                { tags: { $in: learningInterests } },
                { category: { $in: learningInterests } }
            ]
        }).populate('teacher', 'name profilePhoto');

        res.json(matches);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Add Resource to Skill
router.post('/:id/resources', auth, async (req, res) => {
    try {
        const { name, url, type } = req.body;
        const skill = await Skill.findById(req.params.id);

        if (!skill) return res.status(404).json({ msg: 'Skill not found' });

        // Check if user is the teacher
        if (skill.teacher.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized to add resources to this skill' });
        }

        skill.resources.push({ name, url, type });
        await skill.save();

        res.json(skill.resources);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Update Skill Schedule (Teacher Only)
router.put('/:id/schedule', auth, async (req, res) => {
    try {
        const { date, time } = req.body;
        const skill = await Skill.findById(req.params.id);

        if (!skill) return res.status(404).json({ msg: 'Skill not found' });

        if (skill.teacher.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized to update this skill schedule' });
        }

        skill.nextSessionDate = date;
        skill.nextSessionTime = time;
        await skill.save();

        // --- Notification Logic ---
        const io = req.app.get('io');

        // Find all students who booked this skill
        const bookings = await Booking.find({ skill: req.params.id, status: { $in: ['pending', 'accepted', 'confirmed'] } });

        const notificationPromises = [];
        const msg = `Class Scheduled! Join "${skill.title}" on ${new Date(date).toLocaleDateString()} at ${time}.`;

        // Notify Students
        bookings.forEach(booking => {
            const studentNotif = new Notification({
                recipient: booking.student,
                sender: req.user.id,
                message: msg,
                type: 'session_reminder',
                link: `/skill/${skill._id}`
            });
            notificationPromises.push(studentNotif.save());
            if (io) io.to(booking.student.toString()).emit('new_notification', studentNotif);
        });

        // Notify Teacher
        const teacherNotif = new Notification({
            recipient: req.user.id,
            message: `You scheduled a session for "${skill.title}" on ${new Date(date).toLocaleDateString()} at ${time}.`,
            type: 'session_reminder',
            link: `/skill/${skill._id}`
        });
        notificationPromises.push(teacherNotif.save());
        if (io) io.to(req.user.id).emit('new_notification', teacherNotif);

        await Promise.all(notificationPromises);

        res.json(skill);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get Skills Owned by Current User
router.get('/mine/all', auth, async (req, res) => {
    try {
        const skills = await Skill.find({ teacher: req.user.id });
        res.json(skills);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete a Skill
router.delete('/:id', auth, async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id);
        if (!skill) return res.status(404).json({ msg: 'Skill not found' });

        // Check ownership
        if (skill.teacher.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized to delete this skill' });
        }

        await Skill.findByIdAndDelete(req.params.id);

        // Also remove from user's skillsToTeach (by title, though ID would be better)
        await User.findByIdAndUpdate(req.user.id, { $pull: { skillsToTeach: skill.title } });

        res.json({ msg: 'Skill removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
