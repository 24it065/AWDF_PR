import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-message">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="not-found-actions">
          <Link to="/events" className="btn btn-primary">Browse Events</Link>
          <Link to="/" className="btn btn-secondary">Go to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
