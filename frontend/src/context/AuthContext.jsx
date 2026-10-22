import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [attendee, setAttendee] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('eh_token');
      const storedAttendee = localStorage.getItem('eh_attendee');
      if (storedToken && storedAttendee) {
        const parsedAttendee = JSON.parse(storedAttendee);
        setToken(storedToken);
        setAttendee(parsedAttendee);
        setRole(parsedAttendee.role);
      }
    } catch {
      // Corrupted storage – clear it
      localStorage.removeItem('eh_token');
      localStorage.removeItem('eh_attendee');
    } finally {
      setLoading(false);
    }
  }, []);

  const loginUser = (tokenValue, attendeeData) => {
    setToken(tokenValue);
    setAttendee(attendeeData);
    setRole(attendeeData.role);
    localStorage.setItem('eh_token', tokenValue);
    localStorage.setItem('eh_attendee', JSON.stringify(attendeeData));
  };

  const logoutUser = () => {
    setToken(null);
    setAttendee(null);
    setRole(null);
    localStorage.removeItem('eh_token');
    localStorage.removeItem('eh_attendee');
  };

  return (
    <AuthContext.Provider value={{ attendee, token, role, loading, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export default AuthContext;
