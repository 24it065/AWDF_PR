import React from 'react';

/**
 * EventCard component
 * Props: title, category, date, venue, ticketsAvailable, price, _id, onBook
 * Shows all five required props.
 * Shows "Sold Out" badge when ticketsAvailable === 0.
 */
function EventCard({ title, category, date, venue, ticketsAvailable, price, _id, onBook }) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-IN', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      })
    : 'Date TBA';

  const formattedTime = date
    ? new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  const isSoldOut = ticketsAvailable === 0;

  const categoryColors = {
    Technology: '#6366f1',
    Music: '#ec4899',
    Business: '#f59e0b',
    Culture: '#10b981',
    Education: '#3b82f6',
    Entertainment: '#f97316',
    General: '#8b5cf6',
  };
  const categoryColor = categoryColors[category] || '#8b5cf6';

  return (
    <article className="event-card" id={`event-card-${_id}`}>
      <div className="event-card-header" style={{ borderTopColor: categoryColor }}>
        <span className="event-category" style={{ backgroundColor: categoryColor + '22', color: categoryColor }}>
          {category || 'General'}
        </span>
        {isSoldOut && <span className="sold-out-badge">🔴 Sold Out</span>}
      </div>

      <div className="event-card-body">
        <h3 className="event-title">{title}</h3>

        <div className="event-meta">
          <div className="event-meta-item">
            <span className="meta-icon">📅</span>
            <div>
              <span className="meta-label">Date</span>
              <span className="meta-value">{formattedDate}</span>
              {formattedTime && <span className="meta-sub">{formattedTime}</span>}
            </div>
          </div>

          <div className="event-meta-item">
            <span className="meta-icon">📍</span>
            <div>
              <span className="meta-label">Venue</span>
              <span className="meta-value">{venue}</span>
            </div>
          </div>

          <div className="event-meta-item">
            <span className="meta-icon">🎟️</span>
            <div>
              <span className="meta-label">Available</span>
              <span className={`meta-value ${isSoldOut ? 'text-danger' : ticketsAvailable < 20 ? 'text-warning' : 'text-success'}`}>
                {isSoldOut ? 'Sold Out' : `${ticketsAvailable} tickets`}
              </span>
            </div>
          </div>

          <div className="event-meta-item">
            <span className="meta-icon">💰</span>
            <div>
              <span className="meta-label">Price</span>
              <span className="meta-value">
                {price === 0 ? <span className="free-badge">FREE</span> : `₹${price}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="event-card-footer">
        {isSoldOut ? (
          <button className="btn btn-sold-out" disabled aria-label="Event sold out">
            🔴 Sold Out
          </button>
        ) : (
          <button
            className="btn btn-book"
            onClick={() => onBook && onBook({ _id, title, ticketsAvailable, price })}
            id={`book-btn-${_id}`}
            aria-label={`Book tickets for ${title}`}
          >
            Book Tickets
          </button>
        )}
      </div>
    </article>
  );
}

export default EventCard;
