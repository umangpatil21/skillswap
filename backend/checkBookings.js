const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const User = require('./models/User');
const Skill = require('./models/Skill');
require('dotenv').config();

async function checkBookings() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all users
        const users = await User.find().select('name email');
        console.log('👥 Users in database:');
        users.forEach((u, i) => {
            console.log(`   ${i + 1}. ${u.name} (${u.email}) - ID: ${u._id}`);
        });

        // Get all bookings
        const bookings = await Booking.find()
            .populate('student', 'name')
            .populate('teacher', 'name')
            .populate('skill', 'title');

        console.log('\n📅 All Bookings:');
        if (bookings.length === 0) {
            console.log('   No bookings found!');
        } else {
            bookings.forEach((b, i) => {
                console.log(`\n   ${i + 1}. Booking ID: ${b._id}`);
                console.log(`      Student: ${b.student?.name || 'Unknown'}`);
                console.log(`      Teacher: ${b.teacher?.name || 'Unknown'}`);
                console.log(`      Skill: ${b.skill?.title || 'Unknown'}`);
                console.log(`      Status: ${b.status}`);
                console.log(`      Date: ${b.date}`);
                console.log(`      Time: ${b.time}`);
            });
        }

        console.log('\n💡 To see the "Join Live Class" button:');
        console.log('   1. Make sure you\'re logged in as one of the users above');
        console.log('   2. Go to /dashboard');
        console.log('   3. Look for bookings with status "confirmed"');
        console.log('   4. Refresh the page if needed\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

checkBookings();
