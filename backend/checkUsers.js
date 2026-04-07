const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkUsers = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({}, 'name email password role');
        console.log(`Found ${users.length} users.`);

        if (users.length === 0) {
            console.log('No users found in the database. You might need to register first.');
        } else {
            console.log('\n--- Registered Users ---');
            users.forEach(user => {
                console.log(`Name: ${user.name}`);
                console.log(`Email: ${user.email}`);
                console.log(`Password (Hashed): ${user.password}`);
                console.log(`Role: ${user.role}`);
                console.log('------------------------');
            });
        }

        mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

checkUsers();
