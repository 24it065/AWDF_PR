import React, { useState } from 'react';

/**
 * BookingForm component
 * Props: event (selected event object), onSubmit, onClose, loading
 */
function BookingForm({ event, onSubmit, onClose, loading }) {
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  if (!event) return null;

  const maxQty = event.ticketsAvailable;

  const handleQuantityChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setError('');
    if (isNaN(val) || val < 1) {
      setError('Quantity must be at least 1.');
      setQuantity(1);
    } else if (val > maxQty) {
      setError(`Only ${maxQty} ticket(s) available.`);
      setQuantity(maxQty);
    } else {
      setQuantity(val);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (quantity < 1 || quantity > maxQty) return;
    onSubmit(event._id, quantity);
  };

  const totalPrice = (event.price || 0) * quantity;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="booking-title">
      <div className="modal-content booking-form" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close booking form">✕</button>

        <div className="booking-header">
          <h2 id="booking-title">🎟️ Book Tickets</h2>
          <p className="booking-event-title">{event.title}</p>
        </div>

        <div className="booking-details">
          <div className="booking-detail-item">
            <span>📅</span>
            <span>
              {new Date(event.date).toLocaleDateString('en-IN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
          </div>
          <div className="booking-detail-item">
            <span>📍</span>
            <span>{event.venue}</span>
          </div>
          <div className="booking-detail-item">
            <span>🎟️</span>
            <span>{maxQty} tickets remaining</span>
          </div>
          <div className="booking-detail-item">
            <span>💰</span>
            <span>{event.price === 0 ? 'FREE' : `₹${event.price} / ticket`}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="booking-form-fields">
          <div className="form-group">
            <label htmlFor="ticket-quantity" className="form-label">
              Number of Tickets
            </label>
            <div className="quantity-controls">
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                id="ticket-quantity"
                type="number"
                min="1"
                max={maxQty}
                value={quantity}
                onChange={handleQuantityChange}
                className="qty-input"
                required
              />
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={quantity >= maxQty}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            {error && <p className="field-error">{error}</p>}
          </div>

          {event.price > 0 && (
            <div className="total-price">
              <span>Total</span>
              <span className="price-amount">₹{totalPrice}</span>
            </div>
          )}

          <div className="booking-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !!error}
              id="confirm-booking-btn"
            >
              {loading ? 'Booking…' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookingForm;
