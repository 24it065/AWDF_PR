import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await login(email.trim(), password);
      loginUser(data.token, data.attendee);
      navigate('/events');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-shape shape-1" />
        <div className="login-shape shape-2" />
        <div className="login-shape shape-3" />
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-logo">
            <span className="logo-icon">🎟️</span>
            <h1 className="logo-text">EventHub</h1>
            <p className="logo-tagline">Your gateway to amazing events</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">Email Address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="form-input"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password" className="form-label">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="alert alert-error" role="alert">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              id="login-submit-btn"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? <span className="btn-spinner" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="demo-credentials">
            <p className="demo-title">🔑 Demo Accounts</p>
            <div className="demo-cards">
              <button
                type="button"
                className="demo-card"
                onClick={() => fillDemo('alice@demo.com', 'Alice@123')}
                title="Click to auto-fill attendee credentials"
              >
                <span className="demo-role attendee">Attendee</span>
                <span className="demo-email">alice@demo.com</span>
              </button>
              <button
                type="button"
                className="demo-card"
                onClick={() => fillDemo('bob@demo.com', 'Bob@1234')}
                title="Click to auto-fill organizer credentials"
              >
                <span className="demo-role organizer">Organizer</span>
                <span className="demo-email">bob@demo.com</span>
              </button>
              <button
                type="button"
                className="demo-card"
                onClick={() => fillDemo('admin@demo.com', 'Admin@123')}
                title="Click to auto-fill admin credentials"
              >
                <span className="demo-role admin">Admin</span>
                <span className="demo-email">admin@demo.com</span>
              </button>
            </div>
            <p className="demo-hint">Click a card to auto-fill credentials</p>
          </div>
        </div>

        <div className="login-info">
          <h2>ITUE301 – Advanced Web Development Frameworks</h2>
          <p>Set F · Practical Examination · Roll No: 24IT065</p>
          <div className="login-features">
            <div className="feature-item">✅ JWT Authentication</div>
            <div className="feature-item">✅ Protected Routes</div>
            <div className="feature-item">✅ Role-based Access</div>
            <div className="feature-item">✅ Live Ticket Booking</div>
            <div className="feature-item">✅ MongoDB + Mongoose</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
