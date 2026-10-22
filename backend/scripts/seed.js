/**
 * Seed Script – EventHub
 * Run: npm run seed (from /backend)
 *
 * Demo Accounts (documented here ONLY – never in frontend or committed .env):
 * ┌─────────────────────────────┬─────────────────────┬───────────┬───────────┐
 * │ Name                        │ Email               │ Password  │ Role      │
 * ├─────────────────────────────┼─────────────────────┼───────────┼───────────┤
 * │ Alice Attendee              │ alice@demo.com      │ Alice@123 │ attendee  │
 * │ Bob Organizer               │ bob@demo.com        │ Bob@1234  │ organizer │
 * │ Admin User                  │ admin@demo.com      │ Admin@123 │ admin     │
 * └─────────────────────────────┴─────────────────────┴───────────┴───────────┘
 *
 * Uses safe upserts – safe to run multiple times without duplicates.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Attendee = require('../models/Attendee');
const Event = require('../models/Event');

const SALT_ROUNDS = 10;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

const demoUsers = [
  { name: 'Alice Attendee', email: 'alice@demo.com', password: 'Alice@123', phone: '9876543210', role: 'attendee' },
  { name: 'Bob Organizer', email: 'bob@demo.com', password: 'Bob@1234', phone: '9876543211', role: 'organizer' },
  { name: 'Admin User', email: 'admin@demo.com', password: 'Admin@123', phone: '9876543212', role: 'admin' },
];

const sampleEvents = [
  {
    title: 'TechFest 2025',
    category: 'Technology',
    date: new Date('2025-02-15T10:00:00'),
    venue: 'CHARUSAT Campus, Anand',
    description: 'Annual technology festival with hackathons, workshops, and keynotes.',
    ticketsAvailable: 300,
    price: 199,
  },
  {
    title: 'Classical Music Evening',
    category: 'Music',
    date: new Date('2025-03-05T18:30:00'),
    venue: 'Tagore Hall, Ahmedabad',
    description: 'A soulful evening featuring renowned classical musicians.',
    ticketsAvailable: 150,
    price: 499,
  },
  {
    title: 'Startup Summit Gujarat',
    category: 'Business',
    date: new Date('2025-03-20T09:00:00'),
    venue: 'Science City Auditorium, Ahmedabad',
    description: 'Connect with founders, investors, and ecosystem builders.',
    ticketsAvailable: 200,
    price: 299,
  },
  {
    title: 'Art & Culture Expo',
    category: 'Culture',
    date: new Date('2025-04-10T11:00:00'),
    venue: 'Kankaria Lake Front, Ahmedabad',
    description: 'Celebrate Gujarati art, craft, food, and traditions.',
    ticketsAvailable: 500,
    price: 0,
  },
  {
    title: 'Web Dev Workshop',
    category: 'Education',
    date: new Date('2025-04-25T10:00:00'),
    venue: 'CHARUSAT IT Department, Anand',
    description: 'Hands-on full-stack web development bootcamp for college students.',
    ticketsAvailable: 60,
    price: 149,
  },
  {
    title: 'Comedy Night Live',
    category: 'Entertainment',
    date: new Date('2025-05-03T19:00:00'),
    venue: 'The Comedy Store, Surat',
    description: 'Stand-up comedy night featuring top local and national comedians.',
    ticketsAvailable: 0,
    price: 350,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for seeding.');

    // Upsert attendees
    for (const u of demoUsers) {
      const passwordHash = await hashPassword(u.password);
      await Attendee.findOneAndUpdate(
        { email: u.email },
        { name: u.name, email: u.email, phone: u.phone, passwordHash, role: u.role },
        { upsert: true, new: true, runValidators: true }
      );
      console.log(`   👤 Upserted attendee: ${u.email} (${u.role})`);
    }

    // Upsert events by title
    for (const e of sampleEvents) {
      await Event.findOneAndUpdate(
        { title: e.title },
        e,
        { upsert: true, new: true, runValidators: true }
      );
      console.log(`   🎟️  Upserted event: ${e.title}`);
    }

    console.log('\n✅ Seed complete!');
    console.log('\n📋 Demo Credentials:');
    console.log('   alice@demo.com   / Alice@123  (attendee)');
    console.log('   bob@demo.com     / Bob@1234   (organizer)');
    console.log('   admin@demo.com   / Admin@123  (admin)');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB.');
  }
}

seed();
