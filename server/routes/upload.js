const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const supabase = require('../config/supabase'); // Import Supabase client
const auth = require('../middleware/auth');
const Tesseract = require('tesseract.js'); // [NEW] Added for OCR extraction
const Trainer = require('../models/Trainer'); // [NEW] Added to update trainer verification
const User = require('../models/User'); // [NEW] Added to fetch user name for verification matching

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
        fileSize: 100 * 1024 * 1024 // 100MB limit
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

// @route   POST /api/upload/certificate
// @desc    Upload and verify trainer certificate via OCR
// @access  Private
router.post('/certificate', auth, upload.single('certificate'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a certificate image' });
        }

        // [EXPLANATION] First, we get the exact user from the database to know their name.
        // We will need their exact name to see if it appears on the dummy certificate.
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // [EXPLANATION] We generate a unique filename starting with 'cert-' 
        const fileExt = path.extname(req.file.originalname);
        const fileName = `cert-${req.user.id}-${Date.now()}${fileExt}`;
        const filePath = `certificates/${fileName}`;

        console.log(`📤 Uploading certificate: ${fileName} to Supabase bucket`);

        // [EXPLANATION] We upload the file to Supabase. We reuse the 'avatars' bucket, 
        // but store it cleanly inside a 'certificates/' folder path.
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true
            });

        if (error) {
            console.error('Supabase Storage Error:', error);
            throw error;
        }

        // [EXPLANATION] Get the public URL for the uploaded file so we can save it in the DB.
        const { data: publicURLData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
            
        const certificateUrl = publicURLData.publicUrl;

        // [EXPLANATION] Initialize the Tesseract OCR AI. It reads the image buffer directly from memory.
        console.log('🔍 Starting OCR extraction on uploaded certificate...');
        const worker = await Tesseract.createWorker('eng');
        const { data: { text } } = await worker.recognize(req.file.buffer);
        await worker.terminate();
        
        console.log('📄 Extracted Text:', text);

        // [EXPLANATION] Start the matching algorithm! 
        // We convert everything to lowercase to make it easier to match.
        const extractedText = text.toLowerCase();
        
        // Split the user's name (e.g. "John Doe") into parts ["john", "doe"]
        const nameParts = user.name.toLowerCase().split(' ');
        
        // [EXPLANATION] Check if any part of the user's name (that is longer than 2 letters) exists in the text.
        // Or if their full exact name exists in the text.
        const hasName = extractedText.includes(user.name.toLowerCase()) || 
                       nameParts.some(part => part.length > 2 && extractedText.includes(part));
                       
        // [EXPLANATION] Check if the certificate contains verification keywords.
        const hasKeyword = extractedText.includes('certificate') || 
                          extractedText.includes('certified') || 
                          extractedText.includes('trainer') || 
                          extractedText.includes('completion');
        
        // [EXPLANATION] They are only verified if BOTH their name AND a keyword are found!
        const isVerified = hasName && hasKeyword;
        
        console.log(`✅ Verification Result - Has Name: ${hasName}, Has Keyword: ${hasKeyword} -> Verified: ${isVerified}`);

        // [EXPLANATION] Now we update the Trainer profile in your database.
        const trainer = await Trainer.findByUserId(req.user.id);
        if (trainer) {
            // [EXPLANATION] We save the certificate URL, and flip isVerified to true (if it passed).
            await Trainer.update(trainer.id, { 
                certificateUrl: certificateUrl,
                isVerified: isVerified
            });
        }

        // [EXPLANATION] Return success back to the frontend UI!
        res.json({
            success: true,
            message: isVerified ? 'Certificate verified successfully! You are now an approved trainer.' : 'Certificate uploaded but could not be auto-verified. Please ensure your name is clearly visible.',
            isVerified: isVerified,
            certificateUrl: certificateUrl
        });

    } catch (error) {
        console.error('Certificate Upload/OCR Error:', error);
        res.status(500).json({ success: false, message: 'Server error during certificate processing' });
    }
});

module.exports = router;
