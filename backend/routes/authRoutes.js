const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Attendee = require('../models/Attendee');

/**
 * POST /api/v1/auth/login
 * Public – returns a signed JWT on valid credentials.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find attendee by email
    const attendee = await Attendee.findOne({ email: email.toLowerCase().trim() });
    if (!attendee) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, attendee.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: attendee._id, email: attendee.email, role: attendee.role, name: attendee.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      attendee: {
        id: attendee._id,
        name: attendee.name,
        email: attendee.email,
        role: attendee.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
