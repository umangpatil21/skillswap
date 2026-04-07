const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const User = require('./models/User');
const Skill = require('./models/Skill');
require('dotenv').config();

// Script to create a test confirmed booking

async function createTestBooking() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get the first user as student
        const student = await User.findOne();
        if (!student) {
            console.log('❌ No users found. Please create a user first.');
            process.exit(1);
        }

        // Get another user as teacher (or use the same if only one exists)
        const teacher = await User.findOne({ _id: { $ne: student._id } }) || student;

        // Get the first skill
        const skill = await Skill.findOne();
        if (!skill) {
            console.log('❌ No skills found. Please create a skill first.');
            process.exit(1);
        }

        // Create a confirmed booking
        const testBooking = new Booking({
            student: student._id,
            teacher: teacher._id,
            skill: skill._id,
            date: new Date(),
            time: '10:00 AM',
            status: 'confirmed',
            meetingLink: 'http://localhost:5173/video'
        });

        await testBooking.save();

        console.log('✅ Test booking created successfully!');
        console.log('📋 Booking Details:');
        console.log(`   Student: ${student.name}`);
        console.log(`   Teacher: ${teacher.name}`);
        console.log(`   Skill: ${skill.title}`);
        console.log(`   Status: confirmed`);
        console.log(`   Date: ${testBooking.date}`);
        console.log(`   Time: ${testBooking.time}`);
        console.log('\n🎉 You should now see the "Join Live Class" button on your Dashboard!');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

createTestBooking();
