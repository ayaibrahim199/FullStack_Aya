/* eslint-env browser */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function MyBookings({ userId }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      setError('User ID not found. Please log in again.');
      return;
    }
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/bookings/student/${userId}`);
      setBookings(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load bookings: ' + (err.response?.data || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!globalThis.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      setCancellingId(bookingId);
      await api.delete(`/bookings/${bookingId}`);
      
      setSuccessMessage('✅ Booking cancelled successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh bookings
      fetchBookings();
    } catch (err) {
      setError('Failed to cancel booking: ' + (err.response?.data?.message || err.response?.data || err.message));
      console.error(err);
    } finally {
      setCancellingId(null);
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    try {
      return new Date(dateTime).toLocaleString();
    } catch {
      return dateTime;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return '#28a745';
      case 'PENDING':
        return '#ffc107';
      case 'REJECTED':
        return '#fd7e14';
      case 'CANCELLED':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className="container" style={{ marginTop: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>📋 My Bookings</h1>
        <div>
          <button onClick={() => navigate('/available-slots')} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>
            Book More Appointments
          </button>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', background: '#666', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      </div>

      {successMessage && <div className="success">{successMessage}</div>}
      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading bookings...</div>
      ) : (
        bookings.length === 0 ? (
          <div className="info" style={{ marginTop: '20px' }}>
            <p>📭 You don't have any bookings yet.</p>
            <button 
              onClick={() => navigate('/available-slots')}
              style={{
                marginTop: '15px',
                padding: '10px 20px',
                background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Browse Available Slots
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '20px' }}>
          {bookings.map((booking) => (
            <div
              key={booking.id}
              style={{
                border: '1px solid #ddd',
                padding: '15px',
                marginBottom: '15px',
                borderRadius: '5px',
                background: '#f9f9f9',
                borderLeft: `5px solid ${getStatusColor(booking.status)}`
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <strong>👨‍🏫 Teacher:</strong> {booking.slot?.teacher?.username || 'N/A'}
                </div>
                <div>
                  <strong>📌 Status:</strong> <span style={{ color: getStatusColor(booking.status), fontWeight: 'bold' }}>{booking.status}</span>
                </div>
                <div>
                  <strong>📅 Booked on:</strong> {formatDateTime(booking.createdAt || booking.bookingDate)}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <strong>🕐 Start:</strong> {formatDateTime(booking.slot?.startTime)}
                </div>
                <div>
                  <strong>🕑 End:</strong> {formatDateTime(booking.slot?.endTime)}
                </div>
              </div>
              {booking.notes && (
                <div style={{ marginBottom: '10px', padding: '10px', background: '#fff', borderRadius: '3px' }}>
                  <strong>📝 Notes:</strong> {booking.notes}
                </div>
              )}
              <button
                onClick={() => handleCancelBooking(booking.id)}
                disabled={['CANCELLED', 'REJECTED'].includes(booking.status) || cancellingId === booking.id}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: (() => {
                    if (['CANCELLED', 'REJECTED'].includes(booking.status)) return '#ccc';
                    if (booking.status === 'PENDING') return '#ffc107';
                    return '#dc3545';
                  })(),
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: ['CANCELLED', 'REJECTED'].includes(booking.status) ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                {(() => {
                  if (cancellingId === booking.id) return 'Cancelling...';
                  if (booking.status === 'CANCELLED') return 'Cancelled';
                  if (booking.status === 'REJECTED') return 'Rejected by Teacher';
                  if (booking.status === 'PENDING') return 'Cancel Request';
                  return 'Cancel Booking';
                })()}
              </button>
            </div>
          ))}
        </div>
        )
      )}
    </div>
  );
}

MyBookings.propTypes = {
  userId: PropTypes.string.isRequired
};

export default MyBookings;
