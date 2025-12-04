const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    thumbnailUrl: { type: String },
    isPremium: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;

