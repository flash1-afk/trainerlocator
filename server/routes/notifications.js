const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id });
        const mappedNotifications = notifications.map(n => ({ ...n, _id: n.id }));
        res.json({ success: true, notifications: mappedNotifications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.put('/mark-read', auth, async (req, res) => {
    try {
        await Notification.markAllAsRead(req.user.id);
        res.json({ success: true, message: 'All marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.put('/:id/read', auth, async (req, res) => {
    try {
        await Notification.update(req.params.id, { isRead: true });
        res.json({ success: true, message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
