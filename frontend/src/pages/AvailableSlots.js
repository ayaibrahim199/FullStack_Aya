import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function AvailableSlots({ userId }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [bookingSlotId, setBookingSlotId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      setError('User ID not found. Please log in again.');
      return;
    }
    fetchSlots();
  }, [userId]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await api.get('/slots/available');
      setSlots(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load available slots: ' + (err.response?.data || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slotId) => {
    if (!userId) {
      setError('User ID not found. Please log in again.');
      return;
    }

    try {
      setBookingSlotId(slotId);
      await api.post(`/bookings/book?studentId=${userId}&slotId=${slotId}`);
      
      setSuccessMessage('✅ Appointment booked successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh slots
      fetchSlots();
    } catch (err) {
      setError('Failed to book appointment: ' + (err.response?.data?.message || err.response?.data || err.message));
      console.error(err);
    } finally {
      setBookingSlotId(null);
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

  return (
    <div className="container" style={{ marginTop: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>📅 Available Appointment Slots</h1>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', background: '#666', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>

      {successMessage && <div className="success">{successMessage}</div>}
      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading slots...</div>
      ) : slots.length === 0 ? (
        <div className="info">No available slots at the moment</div>
      ) : (
        <div style={{ marginTop: '20px' }}>
          {slots.map((slot) => (
            <div
              key={slot.id}
              style={{
                border: '1px solid #ddd',
                padding: '15px',
                marginBottom: '15px',
                borderRadius: '5px',
                background: '#f9f9f9',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <strong>📍 Teacher:</strong> {slot.teacher?.username || 'N/A'}
                </div>
                <div>
                  <strong>📌 Status:</strong> <span style={{ color: slot.status === 'AVAILABLE' ? 'green' : 'red' }}>{slot.status}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <strong>🕐 Start:</strong> {formatDateTime(slot.startTime)}
                </div>
                <div>
                  <strong>🕑 End:</strong> {formatDateTime(slot.endTime)}
                </div>
              </div>
              <button
                onClick={() => handleBookSlot(slot.id)}
                disabled={slot.status !== 'AVAILABLE' || bookingSlotId === slot.id}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: slot.status !== 'AVAILABLE' ? '#ccc' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: slot.status !== 'AVAILABLE' ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                {bookingSlotId === slot.id ? 'Booking...' : slot.status === 'AVAILABLE' ? 'Book Appointment' : 'Slot Booked'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AvailableSlots;
