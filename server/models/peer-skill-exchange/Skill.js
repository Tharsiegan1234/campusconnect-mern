const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
    title: {
        type: String,
<<<<<<< HEAD
        required: true,
        trim: true,
=======
        required: true
>>>>>>> 9b0a3de (feat: complete peer skill exchange and admin dashboard, security: untrack .env)
    },
    type: {
        type: String,
        enum: ['offer', 'request'],
<<<<<<< HEAD
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
=======
        required: true
    },
    category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
>>>>>>> 9b0a3de (feat: complete peer skill exchange and admin dashboard, security: untrack .env)
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
<<<<<<< HEAD
        required: true,
    }
}, { timestamps: true });
=======
        required: true
    }
}, {
    timestamps: true
});
>>>>>>> 9b0a3de (feat: complete peer skill exchange and admin dashboard, security: untrack .env)

module.exports = mongoose.model('Skill', skillSchema);
