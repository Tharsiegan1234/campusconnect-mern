const mongoose = require('mongoose');

const sportSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        sportType: { type: String, default: 'General' },
        description: { type: String, default: '' },
        coach: { type: String, default: '' },
        maxMembers: { type: Number, min: 1 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        formerMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        waitlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        isActive: { type: Boolean, default: true },
        nextSession: {
            date: { type: Date },
            location: { type: String, default: '' },
            description: { type: String, default: '' },
            rsvps: [{
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                status: { type: String, enum: ['going', 'not_going'], default: 'going' }
            }]
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Sport', sportSchema);
