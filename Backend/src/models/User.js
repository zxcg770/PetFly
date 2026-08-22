const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    location: { type: String, trim: true, default: '' },
    about: { type: String, trim: true, maxlength: 1000, default: '' },
    profilePhoto: { type: String, trim: true, default: '' },
    profileCompleted: { type: Boolean, default: false },
    avgRating: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    passportNumber: { type: String },
    passportPhoto: { type: String },
    expirationDate: { type: Date },
    isVerified: { type: Boolean, default: false },
    securityQuestion: { type: String, default: '' },
    securityAnswerHash: { type: String, default: '' },
});

// Hash the password before saving the user
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    } 
    this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('User', userSchema);
