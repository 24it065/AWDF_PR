import React, { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import BookingForm from '../components/BookingForm';
import { useAuth } from '../context/AuthContext';
import { getEvents, bookTicket } from '../services/api';

function EventsPage() {
  // State 1: events list from API
  const [events, setEvents] = useState([]);
  // State 2: loading indicator
  const [loading, setLoading] = useState(true);
  // State 3: error state
  const [error, setError] = useState('');
  // State 4: client-side search (filters already-fetched data – no new API call)
  const [searchQuery, setSearchQuery] = useState('');
  // State 5: selected event for booking form
  const [selectedEvent, setSelectedEvent] = useState(null);
  // State 6: booking loading/success/error
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState({ type: '', text: '' });

  const { token } = useAuth();

  // Fetch events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getEvents(token);
        setEvents(data.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load events. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [token]);

  // Client-side filter — does NOT trigger new API call
  const filteredEvents = events.filter((ev) =>
    ev.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBookClick = (event) => {
    setSelectedEvent(event);
    setBookingMessage({ type: '', text: '' });
  };

  const handleCloseForm = () => {
    setSelectedEvent(null);
  };

  const handleBookingSubmit = async (eventId, quantity) => {
    setBookingLoading(true);
    setBookingMessage({ type: '', text: '' });
    try {
      await bookTicket(eventId, quantity, token);
      // Update local inventory
      setEvents((prev) =>
        prev.map((ev) =>
          ev._id === eventId ? { ...ev, ticketsAvailable: ev.ticketsAvailable - quantity } : ev
        )
      );
      setBookingMessage({ type: 'success', text: `🎉 Successfully booked ${quantity} ticket(s)!` });
      setTimeout(() => {
        setSelectedEvent(null);
        setBookingMessage({ type: '', text: '' });
      }, 2000);
    } catch (err) {
      setBookingMessage({ type: 'error', text: err.message || 'Booking failed.' });
    } finally {
      setBookingLoading(false);
    }
  };

  const categories = [...new Set(events.map((e) => e.category).filter(Boolean))];

  return (
    <div className="events-page">
      <div className="events-header">
        <div className="events-header-content">
          <h1 className="page-title">Upcoming Events</h1>
          <p className="page-subtitle">Discover and book tickets for amazing events near you</p>
        </div>
        <div className="events-stats">
          <div className="stat-card">
            <span className="stat-number">{events.length}</span>
            <span className="stat-label">Total Events</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{events.filter((e) => e.ticketsAvailable > 0).length}</span>
            <span className="stat-label">Available</span>
          </div>
        </div>
      </div>

      {/* Search Bar – client-side filtering, no API call */}
      <div className="search-section">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            id="event-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title…"
            className="search-input"
            aria-label="Search events"
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Global booking message */}
      {bookingMessage.text && !selectedEvent && (
        <div className={`alert alert-${bookingMessage.type}`} role="alert">
          {bookingMessage.text}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state" aria-live="polite">
          <div className="loading-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
          <p className="loading-text">Loading events…</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="error-state" role="alert">
          <span className="error-icon">⚠️</span>
          <h3>Failed to Load Events</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredEvents.length === 0 && (
        <div className="empty-state">
          {searchQuery ? (
            <>
              <span className="empty-icon">🔍</span>
              <h3>No events match &ldquo;{searchQuery}&rdquo;</h3>
              <p>Try a different search term.</p>
              <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
                Clear Search
              </button>
            </>
          ) : (
            <>
              <span className="empty-icon">🎪</span>
              <h3>No events available</h3>
              <p>Check back later for upcoming events.</p>
            </>
          )}
        </div>
      )}

      {/* Events Grid */}
      {!loading && !error && filteredEvents.length > 0 && (
        <>
          {searchQuery && (
            <p className="search-results-count">
              Showing {filteredEvents.length} of {events.length} events
            </p>
          )}
          <div className="events-grid">
            {filteredEvents.map((event) => (
              <EventCard
                key={event._id}
                _id={event._id}
                title={event.title}
                category={event.category}
                date={event.date}
                venue={event.venue}
                ticketsAvailable={event.ticketsAvailable}
                price={event.price}
                onBook={handleBookClick}
              />
            ))}
          </div>
        </>
      )}

      {/* Booking Form Modal */}
      {selectedEvent && (
        <BookingForm
          event={selectedEvent}
          onSubmit={handleBookingSubmit}
          onClose={handleCloseForm}
          loading={bookingLoading}
          message={bookingMessage}
        />
      )}
    </div>
  );
}

export default EventsPage;
