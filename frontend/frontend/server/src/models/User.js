const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
        },
        role: {
            type: String,
            enum: ['admin', 'user'],
            default: 'user',
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Optimize for common queries
userSchema.index({ role: 1 });
userSchema.index({ createdAt: 1 });

module.exports = mongoose.model('User', userSchema);
