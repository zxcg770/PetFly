const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const VALID_QUESTIONS = [
  "What was your childhood nickname?",
  "What city were you born in?",
  "What is your mother's name?",
  "What was the name of your first school?",
];

// Handle new user registration
// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, securityQuestion, securityAnswer } = req.body;
    // password validation
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password || "")) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include a letter and a number",
      });
    }

    if (!securityQuestion || !VALID_QUESTIONS.includes(securityQuestion)) {
      return res.status(400).json({ message: "Please select a valid security question" });
    }
    if (!securityAnswer || securityAnswer.trim().length < 2) {
      return res.status(400).json({ message: "Security answer must be at least 2 characters" });
    }

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const securityAnswerHash = await bcrypt.hash(securityAnswer.trim().toLowerCase(), 10);
    const user = await User.create({ firstName, lastName, email, password, securityQuestion, securityAnswerHash });

    // Generate JWT token for the new user
    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// user login
// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { _id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Return the security question for a given email (so user knows what to answer)
// POST /api/auth/forgot-password/question
const getSecurityQuestion = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.securityQuestion) {
      return res.status(404).json({ message: "No account found with that email" });
    }
    res.json({ securityQuestion: user.securityQuestion });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Verify only the security answer (no password change)
// POST /api/auth/forgot-password/verify
const verifySecurityAnswer = async (req, res) => {
  try {
    const { email, securityAnswer } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.securityAnswerHash) {
      return res.status(404).json({ message: "No account found with that email" });
    }
    const isMatch = await bcrypt.compare(securityAnswer.trim().toLowerCase(), user.securityAnswerHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect answer" });
    }
    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Verify security answer and reset password
// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, securityAnswer, newPassword } = req.body;

    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword || "")) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include a letter and a number",
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.securityAnswerHash) {
      return res.status(404).json({ message: "No account found with that email" });
    }

    const isMatch = await bcrypt.compare(securityAnswer.trim().toLowerCase(), user.securityAnswerHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect answer to security question" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getSecurityQuestion, verifySecurityAnswer, resetPassword };