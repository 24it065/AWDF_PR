import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../services/api';

const INITIAL_FORM = {
  title: '', category: 'Technology', date: '', venue: '',
  description: '', ticketsAvailable: 100, price: 0,
};

const CATEGORIES = ['Technology', 'Music', 'Business', 'Culture', 'Education', 'Entertainment', 'General'];

function OrganizerPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { token, attendee } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, [token]);

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getEvents(token);
      setEvents(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingEvent(null);
    setForm(INITIAL_FORM);
    setShowForm(true);
    setMessage({ type: '', text: '' });
  };

  const openEdit = (event) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      category: event.category || 'General',
      date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
      venue: event.venue,
      description: event.description || '',
      ticketsAvailable: event.ticketsAvailable,
      price: event.price || 0,
    });
    setShowForm(true);
    setMessage({ type: '', text: '' });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setMessage({ type: '', text: '' });
    try {
      if (editingEvent) {
        await updateEvent(editingEvent._id, form, token);
        setMessage({ type: 'success', text: 'Event updated successfully.' });
      } else {
        await createEvent(form, token);
        setMessage({ type: 'success', text: 'Event created successfully.' });
      }
      setShowForm(false);
      fetchEvents();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Operation failed.' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (eventId, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteEvent(eventId, token);
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
      setMessage({ type: 'success', text: `"${title}" deleted.` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Delete failed.' });
    }
  };

  return (
    <div className="organizer-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🗂️ Organizer Dashboard</h1>
          <p className="page-subtitle">Manage events · Welcome, {attendee?.name}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="create-event-btn">
          + Create Event
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} role="alert">
          {message.text}
        </div>
      )}

      {/* Event Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)} role="dialog" aria-modal="true">
          <div className="modal-content event-form" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowForm(false)} aria-label="Close">✕</button>
            <h2>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>

            <form onSubmit={handleFormSubmit} className="form-grid">
              <div className="form-group">
                <label htmlFor="ev-title" className="form-label">Title *</label>
                <input id="ev-title" name="title" value={form.title} onChange={handleFormChange}
                  className="form-input" required placeholder="Event title" />
              </div>
              <div className="form-group">
                <label htmlFor="ev-category" className="form-label">Category</label>
                <select id="ev-category" name="category" value={form.category} onChange={handleFormChange}
                  className="form-input">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="ev-date" className="form-label">Date & Time *</label>
                <input id="ev-date" name="date" type="datetime-local" value={form.date} onChange={handleFormChange}
                  className="form-input" required />
              </div>
              <div className="form-group">
                <label htmlFor="ev-venue" className="form-label">Venue *</label>
                <input id="ev-venue" name="venue" value={form.venue} onChange={handleFormChange}
                  className="form-input" required placeholder="Venue location" />
              </div>
              <div className="form-group form-group-full">
                <label htmlFor="ev-description" className="form-label">Description</label>
                <textarea id="ev-description" name="description" value={form.description}
                  onChange={handleFormChange} className="form-input form-textarea"
                  placeholder="Event description" rows={3} />
              </div>
              <div className="form-group">
                <label htmlFor="ev-tickets" className="form-label">Tickets Available</label>
                <input id="ev-tickets" name="ticketsAvailable" type="number" min="0"
                  value={form.ticketsAvailable} onChange={handleFormChange} className="form-input" />
              </div>
              <div className="form-group">
                <label htmlFor="ev-price" className="form-label">Price (₹)</label>
                <input id="ev-price" name="price" type="number" min="0"
                  value={form.price} onChange={handleFormChange} className="form-input" />
              </div>

              {message.text && (
                <div className={`alert alert-${message.type} form-group-full`} role="alert">
                  {message.text}
                </div>
              )}

              <div className="form-actions form-group-full">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading} id="submit-event-btn">
                  {formLoading ? 'Saving…' : editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events Table */}
      {loading && <div className="loading-state"><div className="spinner" /><p>Loading events…</p></div>}
      {!loading && error && <div className="error-state"><p>{error}</p></div>}
      {!loading && !error && events.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📅</span>
          <h3>No events yet</h3>
          <p>Create your first event to get started.</p>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="organizer-table-wrapper">
          <table className="organizer-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Tickets</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event._id} id={`event-row-${event._id}`}>
                  <td className="event-title-cell">{event.title}</td>
                  <td><span className="category-chip">{event.category}</span></td>
                  <td>{new Date(event.date).toLocaleDateString('en-IN')}</td>
                  <td>{event.venue}</td>
                  <td>
                    <span className={event.ticketsAvailable === 0 ? 'text-danger' : 'text-success'}>
                      {event.ticketsAvailable}
                    </span>
                  </td>
                  <td>{event.price === 0 ? <span className="free-badge">FREE</span> : `₹${event.price}`}</td>
                  <td className="actions-cell">
                    <button className="btn btn-sm btn-edit" onClick={() => openEdit(event)}
                      id={`edit-btn-${event._id}`} aria-label={`Edit ${event.title}`}>
                      ✏️ Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(event._id, event.title)}
                      id={`delete-btn-${event._id}`} aria-label={`Delete ${event.title}`}>
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default OrganizerPanel;
