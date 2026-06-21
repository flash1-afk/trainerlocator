const express = require('express');
const { body, validationResult } = require('express-validator');
const Trainer = require('../models/Trainer');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/trainers
router.get('/', async (req, res) => {
  try {
    const { specialization, location, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (specialization) filter.specialization = specialization;
    if (location) filter['location.city'] = location;

    const trainers = await Trainer.find(filter);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const rawPaginatedTrainers = trainers.slice(startIndex, endIndex);

    const paginatedTrainers = rawPaginatedTrainers.map(t => ({
      ...t,
      _id: t.id,
      name: t.userId?.name || 'Unknown Trainer',
      email: t.userId?.email || '',
      profileImage: t.userId?.profileImage || null,
      userId: t.userId ? { ...t.userId, _id: t.userId.id } : null
    }));

    res.json({
      success: true,
      trainers: paginatedTrainers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(trainers.length / limit),
        totalTrainers: trainers.length,
        hasNext: endIndex < trainers.length,
        hasPrev: startIndex > 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/trainers/:id
router.get('/:id', async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });
    const responseTrainer = { ...trainer, _id: trainer.id, userId: trainer.userId ? { ...trainer.userId, _id: trainer.userId.id } : null };
    res.json({ success: true, trainer: responseTrainer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/trainers/user/:userId
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const trainer = await Trainer.findByUserId(req.params.userId);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer profile not found' });
    const responseTrainer = { ...trainer, _id: trainer.id, userId: trainer.userId ? { ...trainer.userId, _id: trainer.userId.id } : null };
    res.json({ success: true, trainer: responseTrainer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/trainers
router.post('/', auth, [body('specialization').not().isEmpty()], async (req, res) => {
  try {
    if (req.user.role !== 'trainer') return res.status(403).json({ success: false, message: 'Only trainers can create profiles' });
    const existingProfile = await Trainer.findByUserId(req.user.id);
    if (existingProfile) return res.status(400).json({ success: false, message: 'Profile exists' });

    const trainer = await Trainer.create({ userId: req.user.id, ...req.body });
    res.status(201).json({ success: true, message: 'Created', trainer: { ...trainer, _id: trainer.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/trainers/:id
// @desc    Update trainer profile (services, availability, fees, location)
router.put('/:id', auth, async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer profile not found' });

    const ownerId = trainer.userId.id || trainer.userId;
    if (ownerId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    // Allow updates to specific fields
    const { specialization, services, availability, location, bio, certifications } = req.body;
    const updateData = {};
    if (specialization) updateData.specialization = specialization;
    if (services) updateData.services = services; // Pricing/Fees inside services
    if (availability) updateData.availability = availability; // Session times
    if (location) updateData.location = location;
    if (bio) updateData.bio = bio; // Note: Bio might be in Users table depending on implementation, but Trainer table has bio too in our flow
    if (certifications) updateData.certifications = certifications;

    const updatedTrainer = await Trainer.update(req.params.id, updateData);
    res.json({
      success: true,
      message: 'Trainer profile updated successfully',
      trainer: { ...updatedTrainer, _id: updatedTrainer.id }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;