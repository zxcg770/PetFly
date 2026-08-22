const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const router = express.Router();
const { createPet, getMyPets, getPetById, updatePet, deletePet } = require('../controllers/petController');
const { verifyToken } = require('../middleware/authMiddleware');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', verifyToken, upload.array('photos', 5), async (req, res, next) => {
  try {
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'petfly' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          stream.end(file.buffer);
        });
      });
      req.cloudinaryUrls = await Promise.all(uploadPromises);
    }
    next();
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ error: 'File upload failed', details: err.message });
  }
}, createPet);

router.get('/me', verifyToken, getMyPets);
router.get('/:id', getPetById);
router.put('/:id', verifyToken, updatePet);
router.delete('/:id', verifyToken, deletePet);

module.exports = router;
