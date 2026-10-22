const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const { authGuard, requireRole } = require('../middleware/authGuard');

/**
 * GET /api/v1/events
 * Public – returns all events.
 */
router.get('/', async (req, res, next) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/events/:id
 * Public – returns a single event.
 */
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID.' });
    }
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    res.status(200).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/events
 * Protected – organizer or admin only.
 */
router.post('/', authGuard, requireRole(['organizer', 'admin']), async (req, res, next) => {
  try {
    const { title, category, date, venue, description, ticketsAvailable, price } = req.body;
    if (!title || !date || !venue) {
      return res.status(400).json({ success: false, message: 'Title, date, and venue are required.' });
    }
    const event = await Event.create({
      title,
      category,
      date,
      venue,
      description,
      ticketsAvailable,
      price,
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, message: 'Event created.', data: event });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/events/:id
 * Protected – organizer or admin only.
 */
router.put('/:id', authGuard, requireRole(['organizer', 'admin']), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID.' });
    }
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    res.status(200).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/events/:id
 * Protected – organizer or admin only.
 */
router.delete('/:id', authGuard, requireRole(['organizer', 'admin']), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID.' });
    }
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    res.status(200).json({ success: true, message: 'Event deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
