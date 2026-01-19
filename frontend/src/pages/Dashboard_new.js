import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard({ user, userRole, userId }) {
  const navigate = useNavigate();
  const isTeacher = userRole === 'ROLE_TEACHER';

  return (
    <div className="container" style={{ marginTop: '60px' }}>
      <h1>📊 Dashboard</h1>
      
      <div className="success">
        ✅ Welcome to Smart Appointment Booking System!
      </div>

      <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {!isTeacher && (
          <>
            <div 
              onClick={() => navigate('/available-slots')}
              style={{
                padding: '20px',
                background: '#f0f4ff',
                borderRadius: '8px',
                cursor: 'pointer',
                border: '2px solid #667eea',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <h3>📅 Book Appointment</h3>
              <p>Browse available slots and book appointments with teachers</p>
            </div>

            <div 
              onClick={() => navigate('/my-bookings')}
              style={{
                padding: '20px',
                background: '#f0f4ff',
                borderRadius: '8px',
                cursor: 'pointer',
                border: '2px solid #667eea',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <h3>📋 My Bookings</h3>
              <p>View and manage your appointment bookings</p>
            </div>
          </>
        )}

        {isTeacher && (
          <div 
            onClick={() => navigate('/teacher-dashboard')}
            style={{
              padding: '20px',
              background: '#e7f5e7',
              borderRadius: '8px',
              border: '2px solid #28a745',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <h3>👨‍🏫 Manage My Slots</h3>
            <p>Create, edit, and delete your available appointment slots</p>
          </div>
        )}
      </div>

      <div className="info" style={{ marginTop: '30px' }}>
        <strong>Current User: {user}</strong><br/>
        <strong>Role: {isTeacher ? 'Teacher' : 'Student'}</strong><br/>
        <small>Logged in successfully with JWT authentication</small>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '5px' }}>
        <h3 style={{ color: '#667eea', marginBottom: '10px' }}>Backend Status:</h3>
        <p>✅ Spring Boot API: Running on http://localhost:8080</p>
        <p>✅ Authentication: JWT Enabled</p>
        <p>✅ Database: H2 In-Memory</p>
        <p>✅ Booking System: Operational</p>
      </div>
    </div>
  );
}

export default Dashboard;
