const mongoose = require('mongoose');

const inviteSchema = mongoose.Schema(
    {
        inviteToken: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
        },
        role: {
            type: String,
            enum: ['admin', 'team_leader', 'member'],
            default: 'member',
        },
        workspaceId: {
            type: String,
            required: true,
            default: 'default',
        },
        expiryTime: {
            type: Date,
            required: true,
        },
        used: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Invite', inviteSchema);
