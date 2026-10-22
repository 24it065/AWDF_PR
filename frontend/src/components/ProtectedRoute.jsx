import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 * - No token → redirect to /  (login page)
 * - Has token but wrong role → redirect to /events (do NOT log out)
 * - Has token and correct role → render children
 */
function ProtectedRoute({ children, requiredRole }) {
  const { token, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Verifying session…</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && role !== requiredRole && role !== 'admin') {
    return <Navigate to="/events" replace />;
  }

  return children;
}

export default ProtectedRoute;
