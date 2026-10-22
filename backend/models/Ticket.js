const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema(
  {
    attendeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendee',
      required: [true, 'Attendee reference is required'],
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: ['booked', 'cancelled', 'used'],
        message: 'Status must be booked, cancelled, or used',
      },
      default: 'booked',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', TicketSchema);
