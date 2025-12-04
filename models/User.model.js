const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
module.exports = User;

