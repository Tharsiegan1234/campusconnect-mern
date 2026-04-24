// models/Workshops/WorkshopRequest.js
const mongoose = require('mongoose');

const workshopRequestSchema = new mongoose.Schema({
  topic: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['Technical', 'Soft Skills', 'Career Development', 'Research', 'Other'], default: 'Technical' },
  faculty: { type: String, enum: ['Computing', 'Engineering', 'Humanities and Sciences', 'Business', 'Architecture', 'Other'], required: true },
  academicYear: { type: String, enum: ['Year 1 Sem 1', 'Year 1 Sem 2', 'Year 2 Sem 1', 'Year 2 Sem 2', 'Year 3 Sem 1', 'Year 3 Sem 2', 'Year 4 Sem 1', 'Year 4 Sem 2'], required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestedByName: String,
  requestedByEmail: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedToName: String,
  assignedToEmail: String,
  responseMessage: String,
  respondedAt: Date,
  scheduledWorkshop: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop' },
  votes: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, votedAt: { type: Date, default: Date.now } }],
  voteCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('WorkshopRequest', workshopRequestSchema);