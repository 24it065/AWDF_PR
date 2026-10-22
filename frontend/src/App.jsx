import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import EventsPage from './pages/EventsPage';
import MyTicketsPage from './pages/MyTicketsPage';
import NotFoundPage from './pages/NotFoundPage';

// Lazy-load OrganizerPanel (Task 2 requirement)
const OrganizerPanel = lazy(() => import('./pages/OrganizerPanel'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public route */}
            <Route path="/" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-tickets"
              element={
                <ProtectedRoute>
                  <MyTicketsPage />
                </ProtectedRoute>
              }
            />

            {/* Organizer-only route with lazy load + Suspense */}
            <Route
              path="/organizer"
              element={
                <ProtectedRoute requiredRole="organizer">
                  <Suspense
                    fallback={
                      <div className="loading-screen">
                        <div className="spinner" />
                        <p>Loading organizer panel…</p>
                      </div>
                    }
                  >
                    <OrganizerPanel />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
