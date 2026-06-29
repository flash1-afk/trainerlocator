const express = require('express');
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');
const router = express.Router();

router.get('/my-bookings', auth, async (req, res) => {
  try {
    const query = req.user.role === 'trainer' ? { trainerId: req.user.id } : { userId: req.user.id };
    const bookings = await Booking.find(query);
    const mappedBookings = bookings.map(b => ({ ...b, _id: b.id }));
    res.json({ success: true, bookings: mappedBookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

const Trainer = require('../models/Trainer');
const User = require('../models/User');
const Notification = require('../models/Notification');
const emailService = require('../utils/emailService');

router.post('/', auth, async (req, res) => {
  try {
    let { trainerId, trainerProfileId, ...otherData } = req.body;

    // Fallback: If trainerId (User ID) is missing but we have the Trainer Profile ID, lookup the User ID
    if (!trainerId && trainerProfileId) {
      console.log(`Resolving trainerId from profileId: ${trainerProfileId}`);
      try {
        const trainer = await Trainer.findById(trainerProfileId);
        if (trainer) {
          // generic handling because findById joins user. userId might be obj or id
          trainerId = trainer.userId.id || trainer.userId._id || trainer.userId;
          console.log(`Resolved trainerId to: ${trainerId}`);
        }
      } catch (err) {
        console.error('Error resolving trainer ID:', err);
      }
    }

    if (!trainerId) {
      return res.status(400).json({ success: false, message: 'Trainer ID is required' });
    }

    const bookingData = { ...otherData, trainerId, userId: req.user.id };
    const booking = await Booking.create(bookingData);

    // --- NOTIFICATIONS & EMAILS ---
    try {
      // Fetch details
      const student = await User.findById(req.user.id);
      const trainerUser = await User.findById(trainerId); // trainerId is the User ID effectively

      const sessionDate = bookingData.sessions && bookingData.sessions[0] ? new Date(bookingData.sessions[0].date).toDateString() : 'Upcoming Date';
      const sessionType = bookingData.sessions && bookingData.sessions[0] ? bookingData.sessions[0].type : 'Session';

      if (trainerUser) {
        // 1. Notify Trainer (DB)
        await Notification.create({
          recipient: trainerId,
          sender: req.user.id,
          type: 'booking_new',
          title: 'New Booking Request',
          message: `You have a new booking request from ${student ? student.name : 'a student'} for ${sessionType}.`,
          relatedId: booking.id,
          relatedModel: 'bookings'
        });

        // 2. Email Trainer
        if (trainerUser.email) {
          await emailService.sendBookingNotificationToTrainer(
            trainerUser.email,
            trainerUser.name,
            student ? student.name : 'Student',
            sessionType,
            sessionDate
          );
        }
      }



    } catch (notifError) {
      console.error('Notification/Email error:', notifError);
      // Don't fail the request, just log
    }

    res.status(201).json({ success: true, booking: { ...booking, _id: booking.id } });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // verify authorization
    const trainerUserId = booking.trainerId?.id || booking.trainerId?._id || booking.trainerId;
    if (trainerUserId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updatedBooking = await Booking.update(req.params.id, { status });

    // Send Notification to student
    try {
      const studentId = booking.userId?.id || booking.userId?._id || booking.userId;
      if (studentId) {
        await Notification.create({
          recipient: studentId,
          sender: req.user.id,
          type: 'booking_status',
          title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your booking for a ${booking.sessionType} session has been ${status} by the trainer.`,
          relatedId: booking.id,
          relatedModel: 'bookings'
        });
      }
    } catch (notifErr) {
      console.error('Notification error on booking status:', notifErr);
    }

    res.json({ success: true, booking: { ...updatedBooking, _id: updatedBooking.id } });
  } catch (error) {
    console.error('Booking status update error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;