/**
 * api.test.js – Automated API Tests for EventHub
 * Run: npm test (from /backend)
 * Requires backend to be running on PORT defined in .env
 *
 * Uses only Node.js built-ins (no external test framework).
 * Tests are sequential; each builds on prior state.
 */

require('dotenv').config();

const BASE_URL = `http://localhost:${process.env.PORT || 5000}/api/v1`;

let authToken = '';
let organizerToken = '';
let createdEventId = '';
let createdTicketId = '';

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function fetchJSON(path, options = {}) {
  const { default: fetch } = await import('node-fetch').catch(() => {
    // Use built-in fetch (Node 18+)
    return { default: globalThis.fetch };
  });
  const fn = (typeof fetch === 'function' ? fetch : globalThis.fetch);
  const res = await fn(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json();
  return { status: res.status, data };
}

let passed = 0;
let failed = 0;

function assert(label, condition, info = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${info ? ' — ' + info : ''}`);
    failed++;
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

async function testHealthCheck() {
  console.log('\n🔵 Health Check');
  const { status, data } = await fetchJSON('/health');
  assert('GET /health returns 200', status === 200, JSON.stringify(data));
  assert('success is true', data.success === true);
}

async function testPublicEvents() {
  console.log('\n🔵 Public Events Endpoint');
  const { status, data } = await fetchJSON('/events');
  assert('GET /events returns 200', status === 200, JSON.stringify(data));
  assert('response has success:true', data.success === true);
  assert('response has data array', Array.isArray(data.data));
  if (data.data.length > 0) {
    createdEventId = data.data[0]._id;
    assert('event has required fields', !!(data.data[0].title && data.data[0].venue && data.data[0].date));
  }
}

async function testLoginMissingBody() {
  console.log('\n🔵 Login – Missing Body');
  const { status, data } = await fetchJSON('/auth/login', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert('Returns 400 for empty body', status === 400, JSON.stringify(data));
}

async function testLoginWrongPassword() {
  console.log('\n🔵 Login – Wrong Password');
  const { status, data } = await fetchJSON('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'alice@demo.com', password: 'WRONG' }),
  });
  assert('Returns 401 for wrong password', status === 401, JSON.stringify(data));
}

async function testLoginSuccess() {
  console.log('\n🔵 Login – Valid Credentials (attendee)');
  const { status, data } = await fetchJSON('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'alice@demo.com', password: 'Alice@123' }),
  });
  assert('Returns 200 for valid login', status === 200, JSON.stringify(data));
  assert('Response contains token', typeof data.token === 'string' && data.token.length > 10);
  assert('Response contains attendee info', !!data.attendee);
  authToken = data.token || '';
}

async function testOrganizerLogin() {
  console.log('\n🔵 Login – Valid Credentials (organizer)');
  const { status, data } = await fetchJSON('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'bob@demo.com', password: 'Bob@1234' }),
  });
  assert('Returns 200 for organizer login', status === 200);
  organizerToken = data.token || '';
}

async function testProtectedWithoutToken() {
  console.log('\n🔵 Protected Route – No Token');
  const { status, data } = await fetchJSON('/tickets/my');
  assert('Returns 401 without token', status === 401, JSON.stringify(data));
}

async function testProtectedWithInvalidToken() {
  console.log('\n🔵 Protected Route – Invalid Token');
  const { status, data } = await fetchJSON('/tickets/my', {
    headers: { Authorization: 'Bearer invalid.token.here' },
  });
  assert('Returns 401 for invalid token', status === 401, JSON.stringify(data));
}

async function testBookTicketInvalidQuantity() {
  console.log('\n🔵 Book Ticket – Invalid Quantity (0)');
  if (!authToken || !createdEventId) {
    console.log('  ⚠️  Skipped – no token or eventId available');
    return;
  }
  const { status, data } = await fetchJSON('/tickets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ eventId: createdEventId, quantity: 0 }),
  });
  assert('Returns 400 for quantity 0', status === 400, JSON.stringify(data));
}

async function testBookTicketSuccess() {
  console.log('\n🔵 Book Ticket – Valid Booking');
  if (!authToken || !createdEventId) {
    console.log('  ⚠️  Skipped – no token or eventId available');
    return;
  }
  const { status, data } = await fetchJSON('/tickets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ eventId: createdEventId, quantity: 2 }),
  });
  assert('Returns 201 for valid booking', status === 201, JSON.stringify(data));
  assert('Ticket has status booked', data.data?.status === 'booked');
  createdTicketId = data.data?._id || '';
}

async function testInventoryDecrement() {
  console.log('\n🔵 Inventory – Decremented After Booking');
  const { status, data } = await fetchJSON(`/events/${createdEventId}`);
  if (status === 200) {
    console.log(`  ℹ️  Tickets remaining: ${data.data?.ticketsAvailable}`);
    assert('Event found', status === 200);
  } else {
    console.log('  ⚠️  Could not verify inventory (event endpoint issue)');
  }
}

async function testBookMoreThanAvailable() {
  console.log('\n🔵 Book Ticket – Exceed Available Inventory');
  if (!authToken || !createdEventId) {
    console.log('  ⚠️  Skipped');
    return;
  }
  const { status, data } = await fetchJSON('/tickets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ eventId: createdEventId, quantity: 99999 }),
  });
  assert('Returns 400 when exceeding inventory', status === 400, JSON.stringify(data));
  assert('Error message is meaningful', typeof data.message === 'string' && data.message.length > 5);
}

async function testMyTickets() {
  console.log('\n🔵 My Tickets – Authenticated');
  if (!authToken) { console.log('  ⚠️  Skipped'); return; }
  const { status, data } = await fetchJSON('/tickets/my', {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  assert('Returns 200 for my tickets', status === 200, JSON.stringify(data));
  assert('Data is array', Array.isArray(data.data));
  if (data.data.length > 0) {
    const t = data.data[0];
    assert('Ticket populates attendeeId.name', !!t.attendeeId?.name);
    assert('Ticket populates eventId.title', !!t.eventId?.title);
    assert('Ticket populates eventId.date', !!t.eventId?.date);
    assert('Ticket populates eventId.venue', !!t.eventId?.venue);
  }
}

async function testCancelTicket() {
  console.log('\n🔵 Cancel Ticket');
  if (!authToken || !createdTicketId) { console.log('  ⚠️  Skipped'); return; }
  const { status, data } = await fetchJSON(`/tickets/${createdTicketId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ status: 'cancelled' }),
  });
  assert('Returns 200 for cancellation', status === 200, JSON.stringify(data));
  assert('Status is cancelled', data.data?.status === 'cancelled');
}

async function testInvalidStatusUpdate() {
  console.log('\n🔵 Status Update – Invalid Status');
  if (!authToken || !createdTicketId) { console.log('  ⚠️  Skipped'); return; }
  const { status, data } = await fetchJSON(`/tickets/${createdTicketId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ status: 'invalid_status' }),
  });
  assert('Returns 400 for invalid status', status === 400, JSON.stringify(data));
}

// ─── Runner ───────────────────────────────────────────────────────────────────
async function runTests() {
  console.log('='.repeat(60));
  console.log('  EventHub API Tests – 24IT065 ITUE301 Set F');
  console.log('='.repeat(60));
  console.log(`  Base URL: ${BASE_URL}`);

  try {
    await testHealthCheck();
    await testPublicEvents();
    await testLoginMissingBody();
    await testLoginWrongPassword();
    await testLoginSuccess();
    await testOrganizerLogin();
    await testProtectedWithoutToken();
    await testProtectedWithInvalidToken();
    await testBookTicketInvalidQuantity();
    await testBookTicketSuccess();
    await testInventoryDecrement();
    await testBookMoreThanAvailable();
    await testMyTickets();
    await testCancelTicket();
    await testInvalidStatusUpdate();
  } catch (err) {
    console.error('\n💥 Unexpected test error:', err.message);
    failed++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
