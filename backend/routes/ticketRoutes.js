const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const { authGuard } = require('../middleware/authGuard');

// All ticket routes require authentication
router.use(authGuard);

/**
 * GET /api/v1/tickets/my
 * Returns tickets belonging to the authenticated attendee.
 * Populates attendeeId and eventId fields.
 */
router.get('/my', async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ attendeeId: req.user.id })
      .populate('attendeeId', 'name email')
      .populate('eventId', 'title date venue category price')
      .sort({ bookingDate: -1 });

    res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/tickets
 * Creates a ticket booking for the authenticated attendee.
 * Uses atomic findOneAndUpdate with $gte guard — safe on standalone MongoDB.
 * Returns 201 on success, 400 if insufficient tickets.
 */
router.post('/', async (req, res, next) => {
  try {
    const { eventId, quantity } = req.body;

    // --- Validation ---
    if (!eventId || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'eventId and quantity are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format.' });
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer.' });
    }

    // --- Confirm event exists ---
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // --- Check inventory ---
    if (event.ticketsAvailable < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient tickets. Only ${event.ticketsAvailable} ticket(s) remaining.`,
      });
    }

    // --- Atomic inventory decrement (safe on standalone MongoDB) ---
    // Uses $gte guard to prevent race-condition overselling
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: eventId, ticketsAvailable: { $gte: qty } },
      { $inc: { ticketsAvailable: -qty } },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(400).json({
        success: false,
        message: 'Could not reserve tickets. They may have just sold out.',
      });
    }

    // --- Create ticket record ---
    const ticket = await Ticket.create({
      attendeeId: req.user.id,
      eventId,
      quantity: qty,
      status: 'booked',
    });

    // Populate for response
    await ticket.populate([
      { path: 'attendeeId', select: 'name email' },
      { path: 'eventId', select: 'title date venue' },
    ]);

    res.status(201).json({ success: true, message: 'Ticket booked successfully.', data: ticket });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/tickets/:id
 * Returns a single ticket owned by the authenticated attendee.
 */
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ticket ID.' });
    }
    const ticket = await Ticket.findById(req.params.id)
      .populate('attendeeId', 'name email')
      .populate('eventId', 'title date venue');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Ownership check — use token identity, not client-supplied ID
    if (ticket.attendeeId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Not your ticket.' });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/tickets/:id/status
 * Updates ticket status.
 * - Attendees can only cancel their own booked tickets.
 * - Organizers/admins can set any valid status.
 * - Cancelled tickets restore inventory safely.
 * - Used tickets cannot be changed.
 */
router.patch('/:id/status', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ticket ID.' });
    }

    const { status } = req.body;
    const allowedStatuses = ['booked', 'cancelled', 'used'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(', ')}.`,
      });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Ownership check
    const isOwner = ticket.attendeeId.toString() === req.user.id;
    const isPrivileged = ['organizer', 'admin'].includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Access denied. Not your ticket.' });
    }

    // Attendees can only cancel; privileged users can set any valid status
    if (!isPrivileged && status !== 'cancelled') {
      return res.status(403).json({ success: false, message: 'Attendees may only cancel tickets.' });
    }

    // Idempotency — already in that status
    if (ticket.status === status) {
      return res.status(200).json({ success: true, message: 'Status unchanged.', data: ticket });
    }

    // Cannot change a used ticket
    if (ticket.status === 'used') {
      return res.status(400).json({ success: false, message: 'Cannot change status of a used ticket.' });
    }

    const previousStatus = ticket.status;
    ticket.status = status;
    await ticket.save();

    // Restore inventory only when cancelling a BOOKED ticket (not already-cancelled)
    if (previousStatus === 'booked' && status === 'cancelled') {
      await Event.findByIdAndUpdate(ticket.eventId, { $inc: { ticketsAvailable: ticket.quantity } });
    }

    res.status(200).json({ success: true, message: `Ticket status updated to ${status}.`, data: ticket });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
