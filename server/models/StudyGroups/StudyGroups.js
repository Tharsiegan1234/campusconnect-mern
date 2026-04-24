// models/StudyGroups/StudyGroups.js
const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['open', 'private'],
    required: true,
    default: 'open'
  },
  faculty: {
    type: String,
    required: true,
    enum: ['Computing', 'Engineering', 'Humanities and Sciences', 'Business', 'Architecture', 'Other'],
    default: 'Computing'
  },
  academicYear: {
    type: String,
    enum: ['Year 1', 'Year 2', 'Year 3', 'Year 4'],
    required: true,
    default: 'Year 1'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  participantLimit: {
    type: Number,
    default: null
  },
  studyMaterials: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    fileUrl: {
      type: String,
      required: true
    },
    fileName: String,
    fileType: String,
    fileSize: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  studySessions: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    date: {
      type: Date,
      required: true
    },
    duration: Number,
    location: String,
    resources: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [{
    text: {
      type: String,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    userAvatar: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
studyGroupSchema.index({ faculty: 1, type: 1, academicYear: 1 });
studyGroupSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('StudyGroup', studyGroupSchema);