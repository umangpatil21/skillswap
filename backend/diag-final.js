const mongoose = require('mongoose');
const User = require('./models/User');
const Skill = require('./models/Skill');
const Booking = require('./models/Booking');
const dotenv = require('dotenv');

dotenv.config();

const checkDb = async () => {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const users = await User.find({});
        console.log(`\n--- [USERS] Total: ${users.length} ---`);
        users.forEach(u => console.log(`- ${u.name} (${u.email}) ID: ${u._id}`));

        const skills = await Skill.find({}).populate('teacher', 'name email');
        console.log(`\n--- [SKILLS] Total: ${skills.length} ---`);
        skills.forEach(s => console.log(`- ${s.title} | Teacher: ${s.teacher?.name} (${s.teacher?._id})`));

        const bookings = await Booking.find({}).populate('student teacher skill');
        console.log(`\n--- [BOOKINGS] Total: ${bookings.length} ---`);
        bookings.forEach(b => console.log(`- Skill: ${b.skill?.title} | Status: ${b.status} | Student: ${b.student?.name} | Teacher: ${b.teacher?.name}`));

        process.exit(0);
    } catch (err) {
        console.error("❌ Diagnostic failed:", err);
        process.exit(1);
    }
};

checkDb();
