const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: [true, 'Email is required.'],
    lowercase: true,
    trim: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address.']
  },
  password: {
    type: String,
    required: [true, 'Password is required.'],
    minlength: [6, 'Password must be at least 6 characters long.']
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

