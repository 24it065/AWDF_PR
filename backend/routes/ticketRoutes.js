const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const { authGuard, requireRole } = require('../middleware/authGuard');

// All ticket routes require authentication
router.use(authGuard);

/**
 * GET /api/v1/tickets/my
 * Returns tickets belonging to the authenticated attendee.
 * Populates attendee and event details.
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
 * Atomically decrements event inventory.
 * Returns 201 on success, 400 if insufficient tickets.
 */
router.post('/', async (req, res, next) => {
  // Start a session for safe inventory decrement
  const session = await mongoose.startSession();
  let transactionStarted = false;

  try {
    const { eventId, quantity } = req.body;

    // --- Validation ---
    if (!eventId || !quantity) {
      return res.status(400).json({ success: false, message: 'eventId and quantity are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID format.' });
    }
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive integer.' });
    }

    // Try transaction; fall back to non-transactional if unsupported (standalone MongoDB)
    try {
      session.startTransaction();
      transactionStarted = true;
    } catch {
      transactionStarted = false;
    }

    const sessionOpts = transactionStarted ? { session } : {};

    // --- Confirm event exists and has enough tickets ---
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      if (transactionStarted) await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    if (event.ticketsAvailable < qty) {
      if (transactionStarted) await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Insufficient tickets. Only ${event.ticketsAvailable} ticket(s) remaining.`,
      });
    }

    // --- Atomic inventory decrement ---
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: eventId, ticketsAvailable: { $gte: qty } },
      { $inc: { ticketsAvailable: -qty } },
      { new: true, ...sessionOpts }
    );

    if (!updatedEvent) {
      if (transactionStarted) await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Could not reserve tickets. They may have just sold out.',
      });
    }

    // --- Create ticket record ---
    const [ticket] = await Ticket.create(
      [
        {
          attendeeId: req.user.id,
          eventId,
          quantity: qty,
          status: 'booked',
        },
      ],
      sessionOpts
    );

    if (transactionStarted) await session.commitTransaction();
    session.endSession();

    // Populate for response
    await ticket.populate([
      { path: 'attendeeId', select: 'name email' },
      { path: 'eventId', select: 'title date venue' },
    ]);

    res.status(201).json({ success: true, message: 'Ticket booked successfully.', data: ticket });
  } catch (err) {
    if (transactionStarted) {
      try {
        await session.abortTransaction();
      } catch (_) {}
    }
    session.endSession();
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
 * - Attendees can cancel their own booked tickets.
 * - Organizers/admins can set any valid status.
 * - Cancelled tickets restore inventory; already-cancelled tickets are idempotent.
 * - Used tickets cannot be re-used or re-booked.
 */
router.patch('/:id/status', async (req, res, next) => {
  const dbSession = await mongoose.startSession();
  let txStarted = false;

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

    try {
      dbSession.startTransaction();
      txStarted = true;
    } catch {
      txStarted = false;
    }

    const ticket = await Ticket.findById(req.params.id).session(dbSession);
    if (!ticket) {
      if (txStarted) await dbSession.abortTransaction();
      dbSession.endSession();
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Ownership check
    const isOwner = ticket.attendeeId.toString() === req.user.id;
    const isPrivileged = ['organizer', 'admin'].includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      if (txStarted) await dbSession.abortTransaction();
      dbSession.endSession();
      return res.status(403).json({ success: false, message: 'Access denied. Not your ticket.' });
    }

    // Attendees can only cancel; privileged users can set any valid status
    if (!isPrivileged && status !== 'cancelled') {
      if (txStarted) await dbSession.abortTransaction();
      dbSession.endSession();
      return res.status(403).json({ success: false, message: 'Attendees may only cancel tickets.' });
    }

    // Prevent no-op or invalid transitions for idempotency
    if (ticket.status === status) {
      if (txStarted) await dbSession.abortTransaction();
      dbSession.endSession();
      return res.status(200).json({ success: true, message: 'Status unchanged.', data: ticket });
    }

    // Cannot revert a used ticket
    if (ticket.status === 'used') {
      if (txStarted) await dbSession.abortTransaction();
      dbSession.endSession();
      return res.status(400).json({ success: false, message: 'Cannot change status of a used ticket.' });
    }

    const previousStatus = ticket.status;
    ticket.status = status;
    await ticket.save({ session: dbSession });

    // Restore inventory only when cancelling a BOOKED ticket
    if (previousStatus === 'booked' && status === 'cancelled') {
      await Event.findByIdAndUpdate(
        ticket.eventId,
        { $inc: { ticketsAvailable: ticket.quantity } },
        { session: dbSession }
      );
    }

    if (txStarted) await dbSession.commitTransaction();
    dbSession.endSession();

    res.status(200).json({ success: true, message: `Ticket status updated to ${status}.`, data: ticket });
  } catch (err) {
    if (txStarted) {
      try {
        await dbSession.abortTransaction();
      } catch (_) {}
    }
    dbSession.endSession();
    next(err);
  }
});

module.exports = router;
