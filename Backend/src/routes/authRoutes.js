const express = require("express");
const router = express.Router();

const { register, login, getSecurityQuestion, verifySecurityAnswer, resetPassword } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password/question", getSecurityQuestion);
router.post("/forgot-password/verify", verifySecurityAnswer);
router.post("/reset-password", resetPassword);

module.exports = router;