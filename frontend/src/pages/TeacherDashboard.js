import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function TeacherDashboard({ userId, userName }) {
  const [slots, setSlots] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Create slot form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [creatingSlot, setCreatingSlot] = useState(false);

  // Edit slot form
  const [editingSlot, setEditingSlot] = useState(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [updatingSlot, setUpdatingSlot] = useState(false);

  // Delete confirmation
  const [deletingSlot, setDeletingSlot] = useState(null);

  // Booking approval
  const [approvingBooking, setApprovingBooking] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      setError('User ID not found. Please log in again.');
      return;
    }
    fetchTeacherSlots();
    fetchPendingBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchTeacherSlots = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/slots/teacher/${userId}`);
      setSlots(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load your slots: ' + (err.response?.data || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingBookings = async () => {
    try {
      const response = await api.get(`/bookings/teacher/${userId}/pending`);
      setPendingBookings(response.data);
    } catch (err) {
      console.error('Failed to load pending bookings:', err);
      // Don't set error here as it's secondary functionality
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      setError('Please fill in all fields');
      return;
    }

    if (new Date(startTime) >= new Date(endTime)) {
      setError('End time must be after start time');
      return;
    }

    try {
      setCreatingSlot(true);
      await api.post(
        `/slots/create?teacherId=${userId}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`
      );

      setSuccessMessage('✅ Slot created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

      setStartTime('');
      setEndTime('');
      setShowCreateForm(false);

      // Refresh slots
      fetchTeacherSlots();
    } catch (err) {
      setError('Failed to create slot: ' + (err.response?.data?.message || err.response?.data || err.message));
      console.error(err);
    } finally {
      setCreatingSlot(false);
    }
  };

  const handleEditSlot = async (slot) => {
    setEditingSlot(slot);
    setEditStartTime(slot.startTime);
    setEditEndTime(slot.endTime);
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    if (!editStartTime || !editEndTime) {
      setError('Please fill in all fields');
      return;
    }

    if (new Date(editStartTime) >= new Date(editEndTime)) {
      setError('End time must be after start time');
      return;
    }

    try {
      setUpdatingSlot(true);
      await api.put(
        `/slots/${editingSlot.id}?startTime=${encodeURIComponent(editStartTime)}&endTime=${encodeURIComponent(editEndTime)}`
      );

      setSuccessMessage('✅ Slot updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

      setEditingSlot(null);
      fetchTeacherSlots();
    } catch (err) {
      setError('Failed to update slot: ' + (err.response?.data?.message || err.response?.data || err.message));
      console.error(err);
    } finally {
      setUpdatingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) {
      return;
    }

    try {
      setDeletingSlot(slotId);
      await api.delete(`/slots/${slotId}`);

      setSuccessMessage('✅ Slot deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

      fetchTeacherSlots();
    } catch (err) {
      setError('Failed to delete slot: ' + (err.response?.data?.message || err.response?.data || err.message));
      console.error(err);
    } finally {
      setDeletingSlot(null);
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      setApprovingBooking(bookingId);
      await api.post(`/bookings/${bookingId}/approve`);
      
      setSuccessMessage('✅ Booking approved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh data
      fetchPendingBookings();
      fetchTeacherSlots();
    } catch (err) {
      setError('Failed to approve booking: ' + (err.response?.data || err.message));
      console.error(err);
    } finally {
      setApprovingBooking(null);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject this booking?')) {
      return;
    }

    try {
      setApprovingBooking(bookingId);
      await api.post(`/bookings/${bookingId}/reject`);
      
      setSuccessMessage('✅ Booking rejected successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh data
      fetchPendingBookings();
      fetchTeacherSlots();
    } catch (err) {
      setError('Failed to reject booking: ' + (err.response?.data || err.message));
      console.error(err);
    } finally {
      setApprovingBooking(null);
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
        <h1>👨‍🏫 Teacher Dashboard</h1>
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ padding: '10px 20px', background: '#666', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Back to Dashboard
        </button>
      </div>

      {successMessage && <div className="success">{successMessage}</div>}
      {error && <div className="error">{error}</div>}

      {/* Pending Bookings Section */}
      {pendingBookings.length > 0 && (
        <div style={{ 
          marginBottom: '30px', 
          padding: '20px', 
          background: '#fff3cd', 
          borderRadius: '8px',
          border: '2px solid #ffc107'
        }}>
          <h2 style={{ margin: '0 0 15px 0', color: '#856404' }}>⏳ Pending Approval ({pendingBookings.length})</h2>
          <div style={{ display: 'grid', gap: '15px' }}>
            {pendingBookings.map((booking) => (
              <div
                key={booking.id}
                style={{
                  background: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #ffc107',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'center',
                  gap: '15px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    👨‍🎓 {booking.studentName}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    📅 {formatDateTime(booking.slot?.startTime)} - {formatDateTime(booking.slot?.endTime)}
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    📝 Requested: {formatDateTime(booking.bookingDate)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleApproveBooking(booking.id)}
                    disabled={approvingBooking === booking.id}
                    style={{
                      padding: '8px 16px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    {approvingBooking === booking.id ? '✓...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => handleRejectBooking(booking.id)}
                    disabled={approvingBooking === booking.id}
                    style={{
                      padding: '8px 16px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  >
                    {approvingBooking === booking.id ? '✗...' : '✗ Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Slot Form */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        background: '#f0f4ff', 
        borderRadius: '8px',
        border: '2px solid #667eea'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0 }}>➕ Create New Slot</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              padding: '10px 15px',
              background: showCreateForm ? '#dc3545' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {showCreateForm ? 'Cancel' : 'Create Slot'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleCreateSlot}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={creatingSlot}
              style={{
                width: '100%',
                padding: '12px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {creatingSlot ? 'Creating...' : 'Create Slot'}
            </button>
          </form>
        )}
      </div>

      {/* Slots List */}
      <div>
        <h2>📅 Your Available Slots ({slots.length})</h2>

        {loading ? (
          <div className="loading">Loading your slots...</div>
        ) : slots.length === 0 ? (
          <div className="info">You haven't created any slots yet. Create one above to get started!</div>
        ) : (
          <div>
            {slots.map((slot) => (
              <div key={slot.id} style={{
                border: '1px solid #ddd',
                padding: '15px',
                marginBottom: '15px',
                borderRadius: '5px',
                background: slot.status === 'BOOKED' ? '#fff3cd' : '#f9f9f9',
                borderLeft: `5px solid ${slot.status === 'BOOKED' ? '#ffc107' : '#28a745'}`
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <strong>🕐 Time Slot:</strong><br/>
                    {formatDateTime(slot.startTime)} to {formatDateTime(slot.endTime)}
                  </div>
                  <div>
                    <strong>📌 Status:</strong><br/>
                    <span style={{
                      padding: '5px 10px',
                      borderRadius: '3px',
                      background: slot.status === 'BOOKED' ? '#ffc107' : '#28a745',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {slot.status}
                    </span>
                  </div>
                  <div>
                    <strong>👥 Students Booked:</strong><br/>
                    {slot.status === 'BOOKED' ? '1' : '0'}
                  </div>
                </div>

                {editingSlot?.id === slot.id ? (
                  // Edit Form
                  <form onSubmit={handleUpdateSlot} style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                      <input
                        type="datetime-local"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        required
                      />
                      <input
                        type="datetime-local"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        required
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        type="submit"
                        disabled={updatingSlot}
                        style={{
                          padding: '10px',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        {updatingSlot ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSlot(null)}
                        style={{
                          padding: '10px',
                          background: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  // Action Buttons
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      onClick={() => handleEditSlot(slot)}
                      disabled={slot.status === 'BOOKED'}
                      style={{
                        padding: '10px',
                        background: slot.status === 'BOOKED' ? '#ccc' : '#0dcaf0',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: slot.status === 'BOOKED' ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      disabled={deletingSlot === slot.id}
                      style={{
                        padding: '10px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {deletingSlot === slot.id ? '🗑️ Deleting...' : '🗑️ Delete'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {!loading && slots.length > 0 && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <h3>📊 Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
                {slots.length}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Total Slots</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                {slots.filter(s => s.status === 'AVAILABLE').length}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Available</div>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                {slots.filter(s => s.status === 'BOOKED').length}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Booked</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;
