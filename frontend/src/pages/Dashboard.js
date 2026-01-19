import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard({ user, userRole, userId }) {
  const navigate = useNavigate();
  const isTeacher = userRole === 'ROLE_TEACHER';

  return (
    <div className="dashboard animate-fade-in">
      {/* Welcome Header */}
      <div className="dashboard-header">
        <h1>👋 Welcome back, {user}!</h1>
        <p>
          {isTeacher 
            ? 'Manage your availability and view upcoming appointments' 
            : 'Book appointments and manage your schedule'}
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          border: '1px solid var(--border-light)'
        }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Your Role
          </div>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: '700',
            color: isTeacher ? 'var(--secondary-color)' : 'var(--primary-color)'
          }}>
            {isTeacher ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
          </div>
        </div>
        
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          border: '1px solid var(--border-light)'
        }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            System Status
          </div>
          <div style={{ 
            fontSize: '1.25rem', 
            fontWeight: '700',
            color: 'var(--success)'
          }}>
            ✅ Online
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Quick Actions</h2>
      <div className="dashboard-grid">
        {!isTeacher && (
          <>
            <div 
              className="dashboard-card"
              onClick={() => navigate('/available-slots')}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && navigate('/available-slots')}
            >
              <div className="dashboard-card-icon">📅</div>
              <div>
                <h3>Book Appointment</h3>
                <p>Browse available time slots and schedule an appointment with a teacher</p>
              </div>
              <div style={{ 
                color: 'var(--primary-color)', 
                fontSize: '0.875rem',
                fontWeight: '600',
                marginTop: 'auto'
              }}>
                View Available Slots →
              </div>
            </div>

            <div 
              className="dashboard-card"
              onClick={() => navigate('/my-bookings')}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && navigate('/my-bookings')}
            >
              <div className="dashboard-card-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>📋</div>
              <div>
                <h3>My Bookings</h3>
                <p>View and manage your scheduled appointments</p>
              </div>
              <div style={{ 
                color: 'var(--secondary-color)', 
                fontSize: '0.875rem',
                fontWeight: '600',
                marginTop: 'auto'
              }}>
                View Bookings →
              </div>
            </div>

            <div 
              className="dashboard-card"
              onClick={() => navigate('/student-statistics')}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && navigate('/student-statistics')}
            >
              <div className="dashboard-card-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)' }}>📊</div>
              <div>
                <h3>Learning Statistics</h3>
                <p>View detailed analytics of your booking activity and learning patterns</p>
              </div>
              <div style={{ 
                color: '#8b5cf6', 
                fontSize: '0.875rem',
                fontWeight: '600',
                marginTop: 'auto'
              }}>
                View Statistics →
              </div>
            </div>
          </>
        )}

        {isTeacher && (
          <div 
            className="dashboard-card"
            onClick={() => navigate('/teacher-dashboard')}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && navigate('/teacher-dashboard')}
            style={{ borderColor: 'var(--secondary-light)' }}
          >
            <div className="dashboard-card-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>👨‍🏫</div>
            <div>
              <h3>Manage My Slots</h3>
              <p>Create, edit, and delete your available appointment time slots</p>
            </div>
            <div style={{ 
              color: 'var(--secondary-color)', 
              fontSize: '0.875rem',
              fontWeight: '600',
              marginTop: 'auto'
            }}>
              Manage Availability →
            </div>
          </div>
        )}
      </div>

      {/* System Info */}
      <div style={{ 
        marginTop: '2rem', 
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        border: '1px solid var(--border-light)'
      }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
          🔧 System Information
        </h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--success)' }}>●</span>
            <span style={{ color: 'var(--text-secondary)' }}>Backend API: Active</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--success)' }}>●</span>
            <span style={{ color: 'var(--text-secondary)' }}>JWT Auth: Enabled</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--success)' }}>●</span>
            <span style={{ color: 'var(--text-secondary)' }}>Database: Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
