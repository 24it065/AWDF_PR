/**
 * api.js – Centralised API service layer
 * Uses configurable VITE_API_BASE_URL from .env
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * Generic fetch wrapper with auth header injection.
 */
async function request(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

// ─── Events ───────────────────────────────────────────────────────────────────
export const getEvents = (token) => request('/events', {}, token);

export const getEvent = (id, token) => request(`/events/${id}`, {}, token);

export const createEvent = (eventData, token) =>
  request('/events', { method: 'POST', body: JSON.stringify(eventData) }, token);

export const updateEvent = (id, eventData, token) =>
  request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(eventData) }, token);

export const deleteEvent = (id, token) =>
  request(`/events/${id}`, { method: 'DELETE' }, token);

// ─── Tickets ──────────────────────────────────────────────────────────────────
export const bookTicket = (eventId, quantity, token) =>
  request('/tickets', { method: 'POST', body: JSON.stringify({ eventId, quantity }) }, token);

export const getMyTickets = (token) => request('/tickets/my', {}, token);

export const updateTicketStatus = (ticketId, status, token) =>
  request(`/tickets/${ticketId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token);
