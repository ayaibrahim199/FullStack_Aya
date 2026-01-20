import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CalendarSlotView from './pages/CalendarSlotView';
import MyBookings from './pages/MyBookings';
import StudentStatistics from './pages/StudentStatistics';
import TeacherDashboard from './pages/TeacherDashboard';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const id = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');
    
    if (token && username && id) {
      setIsAuthenticated(true);
      setUser(username);
      setUserId(id);
      setUserRole(role);
    }
  }, []);

  const handleLogin = (token, username, id, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('userId', id);
    localStorage.setItem('userRole', role);
    setIsAuthenticated(true);
    setUser(username);
    setUserId(id);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUser(null);
    setUserId(null);
    setUserRole(null);
  };

  return (
    <BrowserRouter>
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
          element={isAuthenticated ? <CalendarSlotView userId={userId} userRole={userRole} /> : <Navigate to="/login" />} 
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
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
