// models/Workshops/Workshops.js
const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Technical', 'Soft Skills', 'Career Development', 'Research', 'Other'],
    default: 'Technical'
  },
  workshopType: {
    type: String,
    enum: ['upcoming', 'ongoing', 'ended'],
    default: 'upcoming'
  },
  date: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    default: 50
  },
  academicYear: {
    type: String,
    enum: ['Year 1 Sem 1', 'Year 1 Sem 2', 'Year 2 Sem 1', 'Year 2 Sem 2', 'Year 3 Sem 1', 'Year 3 Sem 2', 'Year 4 Sem 1', 'Year 4 Sem 2'],
    default: 'Year 3 Sem 2'
  },
  faculty: {
    type: String,
    enum: ['Computing', 'Engineering', 'Humanities and Sciences', 'Business', 'Architecture', 'Other'],
    default: 'Computing'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdByEmail: String,
  registeredStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  waitlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  materials: [{
    title: { type: String, required: true },
    description: String,
    fileUrl: { type: String, required: true },
    fileName: String,
    fileType: String,
    fileSize: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  videos: [{
    title: { type: String, required: true },
    description: String,
    videoUrl: { type: String, required: true },
    platform: { type: String, enum: ['youtube', 'vimeo', 'other'], default: 'youtube' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Workshop', workshopSchema);