const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const supabase = require('../config/supabase');
const Tesseract = require('tesseract.js');

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed!'), false);
    }
});

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user (with strict OCR check for trainers)
// @access  Public
router.post('/register', upload.single('certificate'), [
  body('name', 'Name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  body('role', 'Role must be either user or trainer').isIn(['user', 'trainer'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    let certificateUrl = null;

    // STRICT TRAINER CHECK: If they claim to be a trainer, they MUST have a valid certificate NOW
    if (role === 'trainer') {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Trainers must upload a valid professional certificate during registration.'
        });
      }

      console.log('🔍 Starting Strict OCR extraction on registration certificate...');
      const worker = await Tesseract.createWorker('eng');
      const { data: { text } } = await worker.recognize(req.file.buffer);
      await worker.terminate();

      const cleanName = name.trim().toLowerCase();
      const extractedText = text.toLowerCase();
      
      console.log('--- OCR EXTRACTED TEXT ---');
      console.log(extractedText);
      console.log('--------------------------');
      
      // Filter out small words for matching purposes
      const nameParts = cleanName.split(/\s+/).filter(part => part.length > 2);
      
      // Normalized matching: remove all spaces and special characters
      const normalizedExtracted = extractedText.replace(/[^a-z0-9]/g, '');
      const normalizedName = cleanName.replace(/[^a-z0-9]/g, '');
      
      // Fallback for common OCR number/letter confusions (like 'o' vs '0', 'l' vs '1')
      const superNormalizedExtracted = normalizedExtracted.replace(/[o]/g, '0').replace(/[l]/g, '1');
      const superNormalizedName = normalizedName.replace(/[o]/g, '0').replace(/[l]/g, '1');
      
      // STRICT MATCHING: 
      // 1. Exact full string matches
      // 2. OR *every* significant part of their name is found
      // 3. OR the normalized string (no spaces/punctuation) matches
      // 4. OR the super normalized string (fixing o/0 and l/1) matches
      const hasName = extractedText.includes(cleanName) || 
                     (nameParts.length > 0 && nameParts.every(part => extractedText.includes(part))) ||
                     normalizedExtracted.includes(normalizedName) ||
                     superNormalizedExtracted.includes(superNormalizedName);
                     
      const hasKeyword = extractedText.includes('certificate') || 
                        extractedText.includes('certified') || 
                        extractedText.includes('trainer') || 
                        extractedText.includes('completion');

      if (!hasName || !hasKeyword) {
        return res.status(400).json({
          success: false,
          message: 'Registration failed: We could not verify your certificate. Make sure your name is clearly visible and it is a valid personal training certificate.'
        });
      }

      console.log('✅ Registration OCR Passed!');

      // Upload the certificate to Supabase
      const fileExt = path.extname(req.file.originalname);
      // We don't have a user ID yet, so we use email hash or timestamp
      const fileName = `cert-new-${Date.now()}${fileExt}`;
      const filePath = `certificates/${fileName}`;

      const { data, error } = await supabase.storage
          .from('avatars')
          .upload(filePath, req.file.buffer, {
              contentType: req.file.mimetype,
              upsert: true
          });

      if (error) throw error;

      const { data: publicURLData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
          
      certificateUrl = publicURLData.publicUrl;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = {
      name,
      email,
      password: hashedPassword,
      role
    };

    user = await User.create(newUser);

    // If they are a trainer, immediately create their Trainer profile as well!
    if (role === 'trainer') {
       await Trainer.create({
         userId: user.id,
         isVerified: true,
         certificateUrl: certificateUrl,
         specialization: 'Not Specified', // Default until they complete their profile
         availability: {
           monday: { available: false, start: '', end: '' },
           tuesday: { available: false, start: '', end: '' },
           wednesday: { available: false, start: '', end: '' },
           thursday: { available: false, start: '', end: '' },
           friday: { available: false, start: '', end: '' },
           saturday: { available: false, start: '', end: '' },
           sunday: { available: false, start: '', end: '' }
         },
         services: [],
         location: { city: '', state: '' },
         experience: { years: 0, description: '' }
       });
    }

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = {
      id: user.id,
      _id: user.id, // Compatibility
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + (error.message || 'Unknown error occurred')
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Password is required').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    console.log('Using JWT secret:', jwtSecret ? 'defined' : 'fallback');

    const token = jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const userResponse = {
      id: user.id,
      _id: user.id, // Compatibility
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

    console.log('Login successful for user:', email, 'Role:', user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    console.log('Auth check for user ID:', req.user.id);

    // Passwords are returned by default by findById, need to remove it manually
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('User not found for ID:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password
    delete user.password;
    user._id = user.id; // Compatibility
    console.log('User found:', user.email, 'Role:', user.role);

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name', 'Name is required').not().isEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, bio, phone, location } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prepare update object
    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (location !== undefined) updateData.location = location;

    // Always update updatedAt
    updateData.updatedAt = new Date();

    const updatedUser = await User.update(req.user.id, updateData);

    // Remove password from response
    const userResponse = {
      id: updatedUser.id,
      _id: updatedUser.id, // Compatibility
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      bio: updatedUser.bio,
      phone: updatedUser.phone,
      location: updatedUser.location,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

module.exports = router;