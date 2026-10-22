const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    ticketsAvailable: {
      type: Number,
      min: [0, 'Tickets available cannot be negative'],
      default: 100,
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendee',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', EventSchema);
