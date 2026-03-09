const mongoose = require('mongoose');
const User = require('./src/models/User'); // Adjust path
require('dotenv').config();

const deleteUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        const email = 'sammarimuthu7@gmail.com';
        const result = await User.deleteOne({ email });

        if (result.deletedCount > 0) {
            console.log(`User ${email} deleted successfully.`);
        } else {
            console.log(`User ${email} not found.`);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

deleteUser();
