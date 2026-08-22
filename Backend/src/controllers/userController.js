const User = require("../models/User");

// Get user profile
// GET /api/users/profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    }catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get public user profile
// GET /api/users/:userId/profile
const getPublicProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select(
            "firstName lastName location about profilePhoto avgRating createdAt isVerified profileCompleted"
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update user profile
// PUT /api/users/profile
// Only names and email can be updated?
const updateProfile = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            location,
            about,
            profilePhoto,
            profileCompleted,
        } = req.body;

        // Only include fields that were actually sent to avoid overwriting existing values with undefined
        const updates = Object.fromEntries(
            Object.entries({
                firstName,
                lastName,
                email,
                location,
                about,
                profilePhoto,
                profileCompleted,
            })
                  .filter(([, v]) => v !== undefined)
        );

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true }
        ).select("-password"); 

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }

};

const uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Profile photo is required" });
        }

        const profilePhoto = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profilePhoto },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getProfile, getPublicProfile, updateProfile, uploadProfilePhoto };

