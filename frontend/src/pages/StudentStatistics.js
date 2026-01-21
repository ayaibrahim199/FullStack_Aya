import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function StudentStatistics({ userId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const navigate = useNavigate();

  const fetchBookingsAndCalculateStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/bookings/student/${userId}`);
      const bookingsData = response.data;
      calculateStatistics(bookingsData);
      setError('');
    } catch (err) {
      setError('Failed to load statistics: ' + (err.response?.data || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      setError('User ID not found. Please log in again.');
      return;
    }
    fetchBookingsAndCalculateStats();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const calculateStatistics = (bookingsData) => {
    const now = new Date();
    
    // Basic counts
    const totalBookings = bookingsData.length;
    const confirmedBookings = bookingsData.filter(b => b.status === 'CONFIRMED').length;
    const cancelledBookings = bookingsData.filter(b => b.status === 'CANCELLED').length;
    const rejectedBookings = bookingsData.filter(b => b.status === 'REJECTED').length;
    const pendingBookings = bookingsData.filter(b => b.status === 'PENDING').length;
    
    // Time-based analysis
    const upcomingBookings = bookingsData.filter(b => 
      b.slot?.startTime && new Date(b.slot.startTime) > now && b.status !== 'CANCELLED'
    ).length;
    
    const completedBookings = bookingsData.filter(b => 
      b.slot?.endTime && new Date(b.slot.endTime) < now && b.status === 'CONFIRMED'
    ).length;
    
    // Teacher analysis
    const teacherStats = {};
    bookingsData.forEach(booking => {
      const teacherLabel = booking.slot?.teacherName || booking.slot?.teacherEmail;
      if (teacherLabel) {
        teacherStats[teacherLabel] = (teacherStats[teacherLabel] || 0) + 1;
      }
    });
    
    const mostBookedTeacher = Object.entries(teacherStats)
      .reduce((max, [teacher, count]) => count > max.count ? { teacher, count } : max, 
              { teacher: 'N/A', count: 0 });
    
    // Monthly analysis
    const monthlyStats = {};
    bookingsData.forEach(booking => {
      if (booking.slot?.startTime) {
        const month = new Date(booking.slot.startTime).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        monthlyStats[month] = (monthlyStats[month] || 0) + 1;
      }
    });
    
    // Time of day analysis
    const timeSlots = { morning: 0, afternoon: 0, evening: 0 };
    bookingsData.forEach(booking => {
      if (booking.slot?.startTime) {
        const hour = new Date(booking.slot.startTime).getHours();
        if (hour < 12) timeSlots.morning++;
        else if (hour < 17) timeSlots.afternoon++;
        else timeSlots.evening++;
      }
    });
    
    const preferredTimeSlot = Object.entries(timeSlots)
      .reduce((max, [time, count]) => count > max.count ? { time, count } : max, 
              { time: 'N/A', count: 0 });
    
    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const recentBookings = bookingsData.filter(b => 
      b.createdAt && new Date(b.createdAt) > thirtyDaysAgo
    ).length;
    
    setStats({
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      rejectedBookings,
      pendingBookings,
      upcomingBookings,
      completedBookings,
      mostBookedTeacher,
      monthlyStats,
      timeSlots,
      preferredTimeSlot,
      recentBookings,
      cancellationRate: totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : 0,
      rejectionRate: totalBookings > 0 ? ((rejectedBookings / totalBookings) * 100).toFixed(1) : 0,
      completionRate: totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0
    });
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'var(--primary-color)' }) => (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      border: '1px solid var(--border-light)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        fontSize: '3rem',
        opacity: '0.1',
        color: color
      }}>
        {icon}
      </div>
      <div style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold', 
        color: color,
        marginBottom: '0.5rem'
      }}>
        {value}
      </div>
      <div style={{ 
        color: 'var(--text-primary)', 
        fontWeight: '600',
        marginBottom: '0.25rem'
      }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ 
          color: 'var(--text-muted)', 
          fontSize: '0.875rem'
        }}>
          {subtitle}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '60px' }}>
        <div className="loading">📊 Loading your statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ marginTop: '60px' }}>
        <div className="error">{error}</div>
        <button onClick={() => navigate('/dashboard')} style={{
          marginTop: '1rem',
          padding: '10px 20px',
          background: 'var(--primary-color)',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ marginTop: '60px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <div>
          <h1>📊 My Learning Statistics</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Comprehensive overview of your appointment booking activity
          </p>
        </div>
        <div>
          <button 
            onClick={() => navigate('/my-bookings')} 
            style={{
              padding: '10px 20px',
              background: 'var(--secondary-color)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              marginRight: '10px',
              fontWeight: '600'
            }}
          >
            📋 View Bookings
          </button>
          <button 
            onClick={() => navigate('/dashboard')} 
            style={{
              padding: '10px 20px',
              background: 'var(--border)',
              color: 'var(--text-primary)',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Main Statistics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings || 0}
          subtitle="All time sessions"
          icon="📚"
          color="var(--primary-color)"
        />
        <StatCard
          title="Completed Sessions"
          value={stats.completedBookings || 0}
          subtitle={`${stats.completionRate}% completion rate`}
          icon="✅"
          color="var(--success)"
        />
        <StatCard
          title="Upcoming Sessions"
          value={stats.upcomingBookings || 0}
          subtitle="Scheduled ahead"
          icon="📅"
          color="var(--warning)"
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelledBookings || 0}
          subtitle={`${stats.cancellationRate}% cancellation rate`}
          icon="❌"
          color="var(--error)"
        />
        <StatCard
          title="Rejected"
          value={stats.rejectedBookings || 0}
          subtitle={`${stats.rejectionRate}% rejection rate`}
          icon="🚫"
          color="#fd7e14"
        />
      </div>

      {/* Detailed Analytics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        
        {/* Status Breakdown */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          border: '1px solid var(--border-light)'
        }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📈 Booking Status Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>✅ Confirmed</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '100px',
                  height: '8px',
                  background: 'var(--border-light)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${stats.totalBookings > 0 ? (stats.confirmedBookings / stats.totalBookings) * 100 : 0}%`,
                    height: '100%',
                    background: 'var(--success)',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <strong>{stats.confirmedBookings || 0}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>⏳ Pending</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '100px',
                  height: '8px',
                  background: 'var(--border-light)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${stats.totalBookings > 0 ? (stats.pendingBookings / stats.totalBookings) * 100 : 0}%`,
                    height: '100%',
                    background: 'var(--warning)',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <strong>{stats.pendingBookings || 0}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>❌ Cancelled</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '100px',
                  height: '8px',
                  background: 'var(--border-light)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${stats.totalBookings > 0 ? (stats.cancelledBookings / stats.totalBookings) * 100 : 0}%`,
                    height: '100%',
                    background: 'var(--error)',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <strong>{stats.cancelledBookings || 0}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🚫 Rejected</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '100px',
                  height: '8px',
                  background: 'var(--border-light)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${stats.totalBookings > 0 ? (stats.rejectedBookings / stats.totalBookings) * 100 : 0}%`,
                    height: '100%',
                    background: '#fd7e14',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <strong>{stats.rejectedBookings || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Preferences */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          border: '1px solid var(--border-light)'
        }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🎯 Learning Preferences
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Favorite Teacher:</strong>
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>👨‍🏫</span>
                <span>{stats.mostBookedTeacher?.teacher}</span>
                <span style={{ 
                  background: 'var(--primary-light)',
                  color: 'var(--primary-color)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {stats.mostBookedTeacher?.count} sessions
                </span>
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Preferred Time:</strong>
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>
                  {(() => {
                     if (stats.preferredTimeSlot?.time === 'morning') return '🌅';
                     if (stats.preferredTimeSlot?.time === 'afternoon') return '☀️';
                     return '🌙';
                   })()}
                </span>
                <span style={{ textTransform: 'capitalize' }}>
                  {stats.preferredTimeSlot?.time}
                </span>
                <span style={{ 
                  background: 'var(--secondary-light)',
                  color: 'var(--secondary-color)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {stats.preferredTimeSlot?.count} bookings
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Time Distribution */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          border: '1px solid var(--border-light)'
        }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⏰ Time Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌅 Morning (6AM-12PM)</span>
              <strong>{stats.timeSlots?.morning || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>☀️ Afternoon (12PM-5PM)</span>
              <strong>{stats.timeSlots?.afternoon || 0}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🌙 Evening (5PM-11PM)</span>
              <strong>{stats.timeSlots?.evening || 0}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Monthly Trends */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        
        {/* Recent Activity */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          border: '1px solid var(--border-light)'
        }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔥 Recent Activity
          </h3>
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
              {stats.recentBookings || 0}
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              bookings in the last 30 days
            </div>
          </div>
        </div>

        {/* Monthly Activity */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          border: '1px solid var(--border-light)'
        }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📅 Monthly Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
            {Object.entries(stats.monthlyStats || {}).length > 0 ? (
              Object.entries(stats.monthlyStats)
                .sort(([a], [b]) => new Date(b) - new Date(a))
                .slice(0, 6)
                .map(([month, count]) => (
                  <div key={month} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid var(--border-light)'
                  }}>
                    <span>{month}</span>
                    <strong style={{ color: 'var(--primary-color)' }}>{count}</strong>
                  </div>
                ))
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                No booking history available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1.5rem',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>🚀 Quick Actions</h3>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/available-slots')}
            style={{
              padding: '12px 24px',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem'
            }}
          >
            📅 Book New Session
          </button>
          <button 
            onClick={() => navigate('/my-bookings')}
            style={{
              padding: '12px 24px',
              background: 'var(--secondary-color)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem'
            }}
          >
            📋 Manage Bookings
          </button>
        </div>
      </div>
    </div>
  );
}

StudentStatistics.propTypes = {
  userId: PropTypes.string.isRequired
};

export default StudentStatistics;
