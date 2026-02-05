const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const supabase = require('../config/supabase'); // Import Supabase client
const auth = require('../middleware/auth');

const router = express.Router();

// Multer Disk Storage for Temporary Holding (Optional: can upload buffer directly to Supabase)
// But using memory storage is better for direct upload
const storage = multer.memoryStorage();

// File filter (images only)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// @route   POST /api/upload
// @desc    Upload profile picture
// @access  Private
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an image' });
        }

        // Generate unique filename
        const fileExt = path.extname(req.file.originalname);
        const fileName = `${req.user.id}-${Date.now()}${fileExt}`;
        const filePath = `avatars/${fileName}`;

        console.log(`📤 Uploading file: ${fileName} to Supabase bucket 'avatars'`);

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (error) {
            console.error('Supabase Storage Error:', error);
            // Fallback: If 'avatars' bucket does not exist, try to default or warn user
            if (error.message.includes('Bucket not found')) {
                return res.status(500).json({
                    success: false,
                    message: 'Storage bucket "avatars" not found. Please create it in Supabase dashboard and make it public.'
                });
            }
            throw error;
        }

        // Get Public URL
        const { data: publicURLData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // If successful, return the URL
        console.log('✅ Upload successful. URL:', publicURLData.publicUrl);

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            imageUrl: publicURLData.publicUrl
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
});

module.exports = router;
