import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyTickets, updateTicketStatus } from '../services/api';

const STATUS_CONFIG = {
  booked:    { label: 'Booked',    icon: '✅', className: 'status-booked' },
  cancelled: { label: 'Cancelled', icon: '❌', className: 'status-cancelled' },
  used:      { label: 'Used',      icon: '🎫', className: 'status-used' },
};

function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { token } = useAuth();

  useEffect(() => {
    fetchTickets();
  }, [token]);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyTickets(token);
      setTickets(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (ticketId) => {
    if (!window.confirm('Are you sure you want to cancel this ticket?')) return;
    setCancellingId(ticketId);
    setMessage({ type: '', text: '' });
    try {
      await updateTicketStatus(ticketId, 'cancelled', token);
      setTickets((prev) =>
        prev.map((t) => (t._id === ticketId ? { ...t, status: 'cancelled' } : t))
      );
      setMessage({ type: 'success', text: 'Ticket cancelled successfully. Inventory restored.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to cancel ticket.' });
    } finally {
      setCancellingId(null);
    }
  };

  const bookedCount = tickets.filter((t) => t.status === 'booked').length;
  const totalTickets = tickets.reduce((s, t) => s + (t.quantity || 0), 0);

  return (
    <div className="my-tickets-page">
      <div className="page-header">
        <h1 className="page-title">My Tickets</h1>
        <p className="page-subtitle">Your personal ticket history and booking details</p>
      </div>

      {/* Stats */}
      {!loading && !error && tickets.length > 0 && (
        <div className="ticket-stats">
          <div className="stat-card">
            <span className="stat-number">{tickets.length}</span>
            <span className="stat-label">Total Bookings</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{bookedCount}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{totalTickets}</span>
            <span className="stat-label">Total Tickets</span>
          </div>
        </div>
      )}

      {/* Messages */}
      {message.text && (
        <div className={`alert alert-${message.type}`} role="alert">
          {message.text}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-state">
          <div className="spinner large" />
          <p>Loading your tickets…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="error-state" role="alert">
          <span className="error-icon">⚠️</span>
          <h3>Failed to Load Tickets</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchTickets}>Try Again</button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && tickets.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🎟️</span>
          <h3>No tickets yet</h3>
          <p>You haven&apos;t booked any tickets. Browse events to get started!</p>
          <a href="/events" className="btn btn-primary">Browse Events</a>
        </div>
      )}

      {/* Tickets Grid */}
      {!loading && !error && tickets.length > 0 && (
        <div className="tickets-grid">
          {tickets.map((ticket) => {
            const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.booked;
            const event = ticket.eventId;
            const attendee = ticket.attendeeId;
            return (
              <article key={ticket._id} className={`ticket-card ${statusCfg.className}`} id={`ticket-${ticket._id}`}>
                <div className="ticket-card-header">
                  <span className={`ticket-status-badge ${statusCfg.className}`}>
                    {statusCfg.icon} {statusCfg.label}
                  </span>
                  <span className="ticket-qty">×{ticket.quantity}</span>
                </div>

                <div className="ticket-card-body">
                  <h3 className="ticket-event-title">{event?.title || 'Unknown Event'}</h3>

                  <div className="ticket-details">
                    <div className="ticket-detail">
                      <span className="detail-icon">📅</span>
                      <span>
                        {event?.date
                          ? new Date(event.date).toLocaleDateString('en-IN', {
                              weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="ticket-detail">
                      <span className="detail-icon">📍</span>
                      <span>{event?.venue || 'N/A'}</span>
                    </div>
                    <div className="ticket-detail">
                      <span className="detail-icon">👤</span>
                      <span>{attendee?.name || 'N/A'}</span>
                    </div>
                    <div className="ticket-detail">
                      <span className="detail-icon">📧</span>
                      <span>{attendee?.email || 'N/A'}</span>
                    </div>
                    <div className="ticket-detail">
                      <span className="detail-icon">📆</span>
                      <span>
                        Booked: {new Date(ticket.bookingDate || ticket.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {ticket.status === 'booked' && (
                  <div className="ticket-card-footer">
                    <button
                      className="btn btn-cancel"
                      onClick={() => handleCancel(ticket._id)}
                      disabled={cancellingId === ticket._id}
                      id={`cancel-btn-${ticket._id}`}
                      aria-label={`Cancel ticket for ${event?.title}`}
                    >
                      {cancellingId === ticket._id ? 'Cancelling…' : 'Cancel Ticket'}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyTicketsPage;
