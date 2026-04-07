const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/skillswap';
const ATLAS_URI = 'mongodb+srv://deadg2365_db_user:XMfY9GzQi7ORrBMR@cluster0.orkpliy.mongodb.net/skillswap?retryWrites=true&w=majority';

async function sync() {
    console.log('🚀 SkillSwap - Emergency Data Sync');
    console.log('---------------------------------');
    
    try {
        console.log('🔄 Attempting connections...');
        
        // Connect to LOCAL
        const localConn = await mongoose.createConnection(LOCAL_URI, {
            serverSelectionTimeoutMS: 5000
        }).asPromise();
        console.log('✅ Connected to LOCAL MongoDB (Source)');
        
        // Connect to ATLAS
        const atlasConn = await mongoose.createConnection(ATLAS_URI, {
            serverSelectionTimeoutMS: 5000
        }).asPromise();
        console.log('✅ Connected to ATLAS MongoDB (Destination)');

        const collections = ['users', 'skills', 'bookings', 'chats', 'notifications', 'certificates', 'recordedlessons'];

        for (const colName of collections) {
            console.log(`\n📦 Processing: ${colName}`);
            
            const localData = await localConn.db.collection(colName).find({}).toArray();
            console.log(`   - Found ${localData.length} records locally.`);

            if (localData.length > 0) {
                console.log(`   - Deleting old data in Atlas ${colName}...`);
                await atlasConn.db.collection(colName).deleteMany({});
                
                console.log(`   - Pushing ${localData.length} records to Atlas...`);
                await atlasConn.db.collection(colName).insertMany(localData);
                console.log(`   - ✨ Done!`);
            } else {
                console.log(`   - Skipping (no data found).`);
            }
        }

        console.log('\n---------------------------------');
        console.log('🎯 SYNC COMPLETE - Your data is now LIVE!');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ ERROR DURING SYNC:');
        if (err.message.includes('ECONNREFUSED')) {
            console.error('   👉 Your LOCAL MongoDB is not running!');
            console.error('   👉 ACTION: Please start MongoDB on your computer first.');
        } else if (err.message.includes('whitelisted')) {
            console.error('   👉 Action Needed: Please whitelist your IP in MongoDB Atlas!');
        } else {
            console.error('   ' + err.message);
        }
        process.exit(1);
    }
}

sync();
