const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({}, 'email name role');
        console.log("USERS:", JSON.stringify(users, null, 2));
    } catch (error) {
        console.error("ERROR:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}
listUsers();
