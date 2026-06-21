const express = require('express');
const Session = require('../models/Session');
const auth = require('../middleware/auth');
const router = express.Router();

// GET /api/sessions/my-sessions
router.get('/my-sessions', auth, async (req, res) => {
  try {
    const query = req.user.role === 'trainer' ? { trainerId: req.user.id } : { userId: req.user.id };
    const sessions = await Session.find(query);
    const mappedSessions = sessions.map(s => ({ ...s, _id: s.id }));
    res.json({ success: true, sessions: mappedSessions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/sessions/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, session: { ...session, _id: session.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/sessions
router.post('/', auth, async (req, res) => {
  try {
    const sessionData = { ...req.body, userId: req.user.id };
    const session = await Session.create(sessionData);
    res.status(201).json({ success: true, session: { ...session, _id: session.id } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/sessions/stats/overview
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const query = req.user.role === 'trainer' ? { trainerId: req.user.id } : { userId: req.user.id };
    // This uses the existing find method which returns all sessions for the user
    // Note: If session count gets huge, we should optimize this to use database aggregation
    const sessions = await Session.find(query);

    const stats = {
      scheduled: sessions.filter(s => s.status === 'scheduled').length,
      completed: sessions.filter(s => s.status === 'completed').length,
      revenue: sessions.filter(s => s.status === 'completed').reduce((sum, s) => sum + (Number(s.price) || 0), 0)
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;