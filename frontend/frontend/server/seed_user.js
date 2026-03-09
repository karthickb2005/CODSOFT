const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config();

const seedUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const email = 'sammarimuthu7@gmail.com';
        const password = 'password123'; // Default password

        // check if user exists
        let user = await User.findOne({ email });

        if (user) {
            console.log('User already exists');
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = await User.create({
                name: 'Samraaj',
                email,
                password: hashedPassword,
                role: 'admin' // Assuming admin role
            });
            console.log('User created:', user.email);
        }
    } catch (error) {
        console.error('Error seeding:', error);
    } finally {
        await mongoose.disconnect();
    }
};

seedUser();
