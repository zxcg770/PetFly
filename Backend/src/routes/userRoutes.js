const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const {
    getProfile,
    getPublicProfile,
    updateProfile,
    uploadProfilePhoto,
} = require("../controllers/userController");

// verifyToken checks if the user is logged in before allowing access
const { verifyToken } = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
    destination: path.join(__dirname, "../../uploads"),
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only image files are allowed"));
        }
        cb(null, true);
    },
});



// GET /api/users/profile
// Protected route: user must be logged in
router.get("/profile", verifyToken, getProfile);
router.get("/me/profile", verifyToken, getProfile);

// PUT /api/users/profile
// Protected route: user must be logged in

router.put("/profile", verifyToken, updateProfile);
router.put("/me/profile", verifyToken, updateProfile);
router.post("/profile/photo", verifyToken, upload.single("profilePhoto"), uploadProfilePhoto);
router.post("/me/profile/photo", verifyToken, upload.single("profilePhoto"), uploadProfilePhoto);
router.get("/:userId/profile", getPublicProfile);

module.exports = router;
