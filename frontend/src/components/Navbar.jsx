import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { attendee, role, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">🎟️</span>
        <Link to="/events" className="brand-name">EventHub</Link>
      </div>

      {attendee && (
        <div className="navbar-links">
          <Link to="/events" className={isActive('/events')}>Events</Link>
          <Link to="/my-tickets" className={isActive('/my-tickets')}>My Tickets</Link>
          {(role === 'organizer' || role === 'admin') && (
            <Link to="/organizer" className={isActive('/organizer')}>Organizer</Link>
          )}
        </div>
      )}

      <div className="navbar-user">
        {attendee ? (
          <>
            <div className="user-info">
              <span className="user-avatar">{attendee.name?.charAt(0).toUpperCase()}</span>
              <div className="user-details">
                <span className="user-name">{attendee.name}</span>
                <span className={`user-role role-${role}`}>{role}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-logout" id="logout-btn">
              Logout
            </button>
          </>
        ) : (
          <Link to="/" className="btn btn-primary">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
