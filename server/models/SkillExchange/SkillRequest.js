const mongoose = require('mongoose');

const skillRequestSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    skillsNeeded: [{
        type: String,
        trim: true
    }],
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    replies: [{
        expert: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        message: String,
        repliedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('SkillRequest', skillRequestSchema);
