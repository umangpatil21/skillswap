const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Skill = require('./models/Skill');
const Certificate = require('./models/Certificate');
const Booking = require('./models/Booking');

dotenv.config();

const diagCerts = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        console.log('\n--- Certificates ---');
        const certs = await Certificate.find().populate('user', 'name email').populate('skill', 'title');
        console.log(`Total Certificates: ${certs.length}`);
        certs.forEach(c => {
            console.log(`- CertID: ${c.uniqueId} | User: ${c.user?.name} (${c.user?.email}) | Skill: ${c.skill?.title} | PDF: ${c.pdfUrl}`);
        });

        console.log('\n--- Bookings (Status: completed) ---');
        const completedBookings = await Booking.find({ status: 'completed' })
            .populate('student', 'name email')
            .populate('teacher', 'name email')
            .populate('skill', 'title');

        console.log(`Total Completed Bookings: ${completedBookings.length}`);
        completedBookings.forEach(b => {
            console.log(`- Skill: ${b.skill?.title} | Student: ${b.student?.name} | Teacher: ${b.teacher?.name} | Attended: ${b.attended}`);
        });

        mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

diagCerts();
