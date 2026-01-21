import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CalendarSlotView from './pages/CalendarSlotView';
import MyBookings from './pages/MyBookings';
import StudentStatistics from './pages/StudentStatistics';
import TeacherDashboard from './pages/TeacherDashboard';
import DebugAuth from './pages/DebugAuth';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('token')));
  const [user, setUser] = useState(() => localStorage.getItem('displayName') || localStorage.getItem('username'));
  const [userId, setUserId] = useState(() => localStorage.getItem('userId'));
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole'));
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const displayName = localStorage.getItem('displayName');
    const id = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');
    
    console.log('App.js - useEffect checking localStorage:', { 
      token: token ? 'present' : 'missing', 
      username, 
      displayName,
      id, 
      role 
    });
    
    if (token && username && id) {
      setIsAuthenticated(true);
      setUser(displayName || username);
      setUserId(id);
      setUserRole(role);
      console.log('App.js - User restored from localStorage:', { isAuthenticated: true, userId: id, userRole: role });
    } else {
      setIsAuthenticated(false);
      setUser(null);
      setUserId(null);
      setUserRole(null);
    }

    setBootstrapped(true);
  }, []);

  const handleLogin = (token, username, id, role, displayName) => {
    const normalizedId = id != null ? String(id) : '';
    console.log('App.js - handleLogin called with:', { token: token ? 'present' : 'missing', username, displayName, id: normalizedId, role });
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('displayName', displayName || username);
    localStorage.setItem('userId', normalizedId);
    localStorage.setItem('userRole', role);
    setIsAuthenticated(true);
    setUser(displayName || username);
    setUserId(normalizedId);
    setUserRole(role);
    console.log('App.js - After login state set:', { isAuthenticated: true, userId: normalizedId, userRole: role });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('displayName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUser(null);
    setUserId(null);
    setUserRole(null);
  };

  if (!bootstrapped) {
    return (
      <div className="app-loading" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}>
        <p>Loading your session...</p>
      </div>
    );
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {isAuthenticated && (
        <nav className="navbar">
          <h1>📅 Smart Appointment Booking</h1>
          <div className="navbar-user">
            <span>
              {user}
              <span style={{ 
                marginLeft: '0.5rem',
                padding: '0.25rem 0.5rem',
                background: userRole === 'ROLE_TEACHER' ? 'var(--success-bg)' : 'var(--info-bg)',
                color: userRole === 'ROLE_TEACHER' ? 'var(--success)' : 'var(--info)',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {userRole === 'ROLE_TEACHER' ? 'Teacher' : 'Student'}
              </span>
            </span>
            <button onClick={handleLogout}>Sign Out</button>
          </div>
        </nav>
      )}
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/signup" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup onSignup={handleLogin} />} 
        />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard user={user} userRole={userRole} userId={userId} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/available-slots" 
          element={isAuthenticated ? (
            <CalendarSlotView 
              userId={userId} 
              userName={user} 
              userRole={userRole ? userRole.replace('ROLE_', '') : ''} 
            />
          ) : <Navigate to="/login" />} 
        />
        <Route 
          path="/my-bookings" 
          element={isAuthenticated ? <MyBookings userId={userId} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/student-statistics" 
          element={isAuthenticated && userRole === 'ROLE_STUDENT' ? <StudentStatistics userId={userId} /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/teacher-dashboard" 
          element={isAuthenticated && userRole === 'ROLE_TEACHER' ? <TeacherDashboard userId={userId} userName={user} /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/teacher-slots" 
          element={isAuthenticated && userRole === 'ROLE_TEACHER' ? (
            <CalendarSlotView 
              userId={userId} 
              userName={user} 
              userRole="TEACHER" 
            />
          ) : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/debug" 
          element={<DebugAuth />} 
        />
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
        />
        <Route 
          path="*" 
          element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;