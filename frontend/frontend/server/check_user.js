const mongoose = require('mongoose');
const User = require('./src/models/User'); // Adjust path if needed
require('dotenv').config();

const checkUser = async () => {
    const emailToCheck = process.argv[2] || 'sammarimuthu7@gmail.com';
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        const user = await User.findOne({ email: emailToCheck });
        if (user) {
            console.log(`User found: ${user.email}, Role: ${user.role}`);
        } else {
            console.log(`User NOT found: ${emailToCheck}`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkUser();
