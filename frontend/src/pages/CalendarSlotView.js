import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function CalendarSlotView({ userId, userRole }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [bookingSlotId, setBookingSlotId] = useState(null);
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'day'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const navigate = useNavigate();

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      let endpoint = userRole === 'TEACHER' ? `/slots/teacher/${userId}` : '/slots/available';
      const response = await api.get(endpoint);
      setSlots(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load slots: ' + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  }, [userId, userRole]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots, selectedDate, currentWeek]);

  const handleBookSlot = async (slotId) => {
    if (userRole !== 'STUDENT') return;
    
    try {
      setBookingSlotId(slotId);
      await api.post(`/bookings/book?studentId=${userId}&slotId=${slotId}`);
      setSuccessMessage('✅ Appointment booked successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchSlots();
    } catch (err) {
      setError('Failed to book appointment: ' + (err.response?.data?.message || err.response?.data || err.message));
    } finally {
      setBookingSlotId(null);
    }
  };

  // Helper functions for date calculations
  const getWeekDates = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Start on Monday
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatTimeSimple = (hour, minute = 0) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const isSameDay = (date1, date2) => {
    return date1.toDateString() === date2.toDateString();
  };

  const getSlotsForDate = (date) => {
    return slots.filter(slot => {
      if (!slot.startTime) return false;
      const slotDate = new Date(slot.startTime);
      return isSameDay(slotDate, date);
    }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  };

  const getTimeSlots = () => {
    const timeSlots = [];
    for (let hour = 8; hour <= 20; hour++) {
      timeSlots.push({ hour, minute: 0 });
      timeSlots.push({ hour, minute: 30 });
    }
    return timeSlots;
  };

  const findSlotAtTime = (date, hour, minute) => {
    const daySlots = getSlotsForDate(date);
    return daySlots.find(slot => {
      const slotStart = new Date(slot.startTime);
      return slotStart.getHours() === hour && slotStart.getMinutes() === minute;
    });
  };

  const navigateWeek = (direction) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newWeek);
  };

  const navigateDay = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const getSlotStatus = (slot) => {
    if (!slot) return null;
    
    const statusColors = {
      'AVAILABLE': { bg: '#d4edda', border: '#28a745', text: '#155724' },
      'BOOKED': { bg: '#fff3cd', border: '#ffc107', text: '#856404' },
      'CANCELLED': { bg: '#f8d7da', border: '#dc3545', text: '#721c24' }
    };
    
    return statusColors[slot.status] || statusColors['AVAILABLE'];
  };

  // Week View Component - Simple Available Slots Table
  const WeekView = () => {
    const weekDates = getWeekDates(currentWeek);
    const today = new Date();

    // Define available time slots based on schedule
    const getAvailableTimeSlots = (date) => {
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Saturday: 2 morning slots only
      if (dayOfWeek === 6) {
        return [
          { start: '09:00', end: '10:00', display: '9:00 AM - 10:00 AM' },
          { start: '10:00', end: '11:00', display: '10:00 AM - 11:00 AM' }
        ];
      }
      
      // Sunday to Friday: 5 slots from 3 PM to 9 PM
      return [
        { start: '15:00', end: '16:00', display: '3:00 PM - 4:00 PM' },
        { start: '16:00', end: '17:00', display: '4:00 PM - 5:00 PM' },
        { start: '17:00', end: '18:00', display: '5:00 PM - 6:00 PM' },
        { start: '18:00', end: '19:00', display: '6:00 PM - 7:00 PM' },
        { start: '19:00', end: '20:00', display: '7:00 PM - 8:00 PM' },
        { start: '20:00', end: '21:00', display: '8:00 PM - 9:00 PM' }
      ];
    };

    // Build available slots for the week
    const weeklyAvailableSlots = weekDates.map(date => {
      const daySlots = getAvailableTimeSlots(date);
      const existingSlots = getSlotsForDate(date);
      
      return {
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        shortDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday: isSameDay(date, today),
        slots: daySlots.map(timeSlot => {
          // Find matching slot from database
          const matchedSlot = existingSlots.find(slot => {
            const slotStart = new Date(slot.startTime);
            const slotHour = slotStart.getHours().toString().padStart(2, '0');
            const slotMinute = slotStart.getMinutes().toString().padStart(2, '0');
            return `${slotHour}:${slotMinute}` === timeSlot.start;
          });
          
          return {
            ...timeSlot,
            slot: matchedSlot,
            status: matchedSlot ? matchedSlot.status : 'UNAVAILABLE'
          };
        })
      };
    });

    return (
      <div className="calendar-week-view">
        <div className="week-navigation">
          <button onClick={() => navigateWeek(-1)} className="nav-btn">
            ← Previous Week
          </button>
          <h3 className="week-range">
            {weekDates[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - 
            {weekDates[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          <button onClick={() => navigateWeek(1)} className="nav-btn">
            Next Week →
          </button>
        </div>

        <div className="availability-info">
          <p><strong>📅 Teacher's Weekly Schedule:</strong></p>
          <p>Sunday - Friday: 3:00 PM - 9:00 PM (6 slots per day)</p>
          <p>Saturday: 9:00 AM - 11:00 AM (2 morning slots)</p>
        </div>
        
        <div className="available-slots-table-wrapper">
          <table className="available-slots-table">
            <thead>
              <tr>
                <th className="day-header-cell">Day</th>
                <th className="slots-header-cell">Available Time Slots</th>
              </tr>
            </thead>
            <tbody>
              {weeklyAvailableSlots.map((day) => (
                <tr key={day.date.toISOString()} className={`day-row ${day.isToday ? 'today-row' : ''}`}>
                  <td className="day-cell">
                    <div className="day-info">
                      <div className="day-name-large">{day.dayName}</div>
                      <div className="day-date-large">{day.shortDate}</div>
                      {day.isToday && <span className="today-badge-large">Today</span>}
                    </div>
                  </td>
                  <td className="slots-cell">
                    <div className="slots-grid">
                      {day.slots.map((timeSlot, index) => {
                        const slot = timeSlot.slot;
                        const isAvailable = slot && slot.status === 'AVAILABLE';
                        const isBooked = slot && slot.status === 'BOOKED';
                        const isUnavailable = !slot || timeSlot.status === 'UNAVAILABLE';
                        
                        return (
                          <div
                            key={index}
                            className={`time-slot-card ${isAvailable ? 'available' : ''} ${isBooked ? 'booked' : ''} ${isUnavailable ? 'unavailable' : ''} ${userRole === 'STUDENT' && isAvailable ? 'clickable' : ''}`}
                            onClick={() => userRole === 'STUDENT' && isAvailable && handleBookSlot(slot.id)}
                          >
                            <div className="slot-time">{timeSlot.display}</div>
                            {slot && slot.teacher && (
                              <div className="slot-teacher-name">👨‍🏫 {slot.teacher.username}</div>
                            )}
                            <div className="slot-status-indicator">
                              {isAvailable && <span className="status-badge available-badge">✓ Available</span>}
                              {isBooked && <span className="status-badge booked-badge">📅 Booked</span>}
                              {isUnavailable && <span className="status-badge unavailable-badge">— Not Open</span>}
                            </div>
                            {userRole === 'STUDENT' && isAvailable && (
                              <button className="quick-book-btn" onClick={(e) => {
                                e.stopPropagation();
                                handleBookSlot(slot.id);
                              }}>
                                Book Now
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="legend-simple">
          <div className="legend-item">
            <span className="legend-dot available"></span>
            <span>Available to Book</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot booked"></span>
            <span>Already Booked</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot unavailable"></span>
            <span>Not Available Yet</span>
          </div>
        </div>
      </div>
    );
  };

  // Day View Component
  const DayView = () => {
    const daySlots = getSlotsForDate(selectedDate);

    return (
      <div className="calendar-day-view">
        <div className="day-header">
          <button onClick={() => navigateDay(-1)} className="nav-button">←</button>
          <h3>{selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</h3>
          <button onClick={() => navigateDay(1)} className="nav-button">→</button>
        </div>
        
        <div className="day-slots">
          {daySlots.length === 0 ? (
            <div className="no-slots">
              <div className="empty-state">
                <span className="empty-icon">📅</span>
                <h4>No appointments scheduled</h4>
                <p>This day is completely free!</p>
              </div>
            </div>
          ) : (
            daySlots.map((slot) => {
              const statusStyle = getSlotStatus(slot);
              return (
                <div 
                  key={slot.id}
                  className="day-slot-card"
                  style={{
                    backgroundColor: statusStyle?.bg,
                    borderColor: statusStyle?.border,
                  }}
                >
                  <div className="slot-header">
                    <div className="slot-time-range">
                      <span className="time-start">{formatTime(new Date(slot.startTime))}</span>
                      <span className="time-separator">→</span>
                      <span className="time-end">{formatTime(new Date(slot.endTime))}</span>
                    </div>
                    <div className="slot-status-badge" style={{ color: statusStyle?.text }}>
                      {slot.status}
                    </div>
                  </div>
                  
                  <div className="slot-details">
                    <div className="teacher-info">
                      <span className="teacher-icon">👨‍🏫</span>
                      <span className="teacher-name">{slot.teacher?.username || 'Unknown Teacher'}</span>
                    </div>
                    
                    <div className="slot-duration">
                      Duration: {Math.round((new Date(slot.endTime) - new Date(slot.startTime)) / (1000 * 60))} minutes
                    </div>
                  </div>
                  
                  {userRole === 'STUDENT' && slot.status === 'AVAILABLE' && (
                    <button 
                      className="book-slot-button"
                      onClick={() => handleBookSlot(slot.id)}
                      disabled={bookingSlotId === slot.id}
                    >
                      {bookingSlotId === slot.id ? 'Booking...' : 'Book This Slot'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <style jsx>{`
        .calendar-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f5f7fa;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding: 25px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          color: white;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
        }

        .view-controls {
          display: flex;
          gap: 12px;
        }

        .view-button {
          padding: 10px 24px;
          border: 2px solid white;
          background: transparent;
          color: white;
          border-radius: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          font-size: 14px;
        }

        .view-button.active {
          background: white;
          color: #667eea;
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
        }

        .view-button:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .back-button {
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateX(-3px);
        }

        /* Week View - Available Slots Table */
        .calendar-week-view {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
        }

        .week-navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          background: linear-gradient(to right, #f8f9fa, #e9ecef);
          border-bottom: 3px solid #667eea;
        }

        .week-range {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #2c3e50;
        }

        .nav-btn {
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .nav-btn:hover {
          background: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }

        .availability-info {
          padding: 20px 32px;
          background: #f0f7ff;
          border-bottom: 2px solid #d0e7ff;
          text-align: center;
        }

        .availability-info p {
          margin: 5px 0;
          color: #2c3e50;
          font-size: 14px;
        }

        .availability-info strong {
          color: #667eea;
          font-size: 16px;
        }

        .available-slots-table-wrapper {
          padding: 24px;
          overflow-x: auto;
        }

        .available-slots-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .day-header-cell {
          width: 180px;
          background: #2c3e50;
          color: white;
          padding: 16px;
          font-weight: 700;
          font-size: 15px;
          text-align: left;
          border-top-left-radius: 12px;
        }

        .slots-header-cell {
          background: #2c3e50;
          color: white;
          padding: 16px;
          font-weight: 700;
          font-size: 15px;
          text-align: left;
          border-top-right-radius: 12px;
        }

        .day-row {
          border-bottom: 2px solid #e9ecef;
          transition: background 0.2s ease;
        }

        .day-row:hover {
          background: #f8f9fa;
        }

        .day-row.today-row {
          background: #fff8f0;
        }

        .day-row.today-row:hover {
          background: #fff3e6;
        }

        .day-cell {
          padding: 24px;
          vertical-align: top;
          border-right: 2px solid #e9ecef;
        }

        .day-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .day-name-large {
          font-size: 18px;
          font-weight: 700;
          color: #2c3e50;
        }

        .day-date-large {
          font-size: 14px;
          color: #6c757d;
          font-weight: 500;
        }

        .today-badge-large {
          display: inline-block;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          box-shadow: 0 2px 8px rgba(240, 147, 251, 0.4);
          width: fit-content;
        }

        .slots-cell {
          padding: 16px;
        }

        .slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
        }

        .time-slot-card {
          background: #f8f9fa;
          border: 2px solid #dee2e6;
          border-radius: 10px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 0.3s ease;
          min-height: 120px;
        }

        .time-slot-card.available {
          background: #d4edda;
          border-color: #28a745;
          border-left: 5px solid #28a745;
        }

        .time-slot-card.booked {
          background: #fff3cd;
          border-color: #ffc107;
          border-left: 5px solid #ffc107;
        }

        .time-slot-card.unavailable {
          background: #f8f9fa;
          border-color: #dee2e6;
          opacity: 0.6;
        }

        .time-slot-card.clickable {
          cursor: pointer;
        }

        .time-slot-card.clickable:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(40, 167, 69, 0.3);
        }

        .slot-time {
          font-size: 15px;
          font-weight: 700;
          color: #2c3e50;
          text-align: center;
        }

        .slot-teacher-name {
          font-size: 12px;
          color: #495057;
          text-align: center;
        }

        .slot-status-indicator {
          display: flex;
          justify-content: center;
          margin-top: auto;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .available-badge {
          background: #28a745;
          color: white;
        }

        .booked-badge {
          background: #ffc107;
          color: #856404;
        }

        .unavailable-badge {
          background: #6c757d;
          color: white;
        }

        .quick-book-btn {
          margin-top: 8px;
          padding: 8px 16px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
        }

        .quick-book-btn:hover {
          background: #5568d3;
          transform: scale(1.05);
        }

        .legend-simple {
          display: flex;
          justify-content: center;
          gap: 32px;
          padding: 24px;
          background: #f8f9fa;
          border-top: 2px solid #e9ecef;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #495057;
        }

        .legend-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
        }

        .legend-dot.available {
          background: #28a745;
        }

        .legend-dot.booked {
          background: #ffc107;
        }

        .legend-dot.unavailable {
          background: #6c757d;
        }

        /* Day View Styles */
        .calendar-day-view {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }

        .day-slots {
          padding: 20px;
          max-height: 600px;
          overflow-y: auto;
        }

        .no-slots {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 300px;
        }

        .empty-state {
          text-align: center;
          color: #6c757d;
        }

        .empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 15px;
        }

        .day-slot-card {
          background: #e8f5e8;
          border: 2px solid #4caf50;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 15px;
          transition: all 0.3s ease;
        }

        .day-slot-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .slot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .slot-time-range {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 18px;
          font-weight: bold;
        }

        .time-separator {
          color: #6c757d;
          font-size: 16px;
        }

        .slot-status-badge {
          padding: 4px 12px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }

        .slot-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          color: #555;
        }

        .teacher-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .teacher-icon {
          font-size: 18px;
        }

        .book-slot-button {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .book-slot-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .book-slot-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* Messages */
        .success {
          background: #d4edda;
          color: #155724;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #c3e6cb;
        }

        .error {
          background: #f8d7da;
          color: #721c24;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #f5c6cb;
        }

        .loading {
          text-align: center;
          padding: 40px;
          font-size: 18px;
          color: #6c757d;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .calendar-container {
            padding: 10px;
          }

          .week-grid {
            grid-template-columns: 60px repeat(7, 1fr);
          }

          .slot-card {
            font-size: 8px;
          }

          .calendar-header {
            flex-direction: column;
            gap: 15px;
          }

          .view-controls {
            width: 100%;
            justify-content: center;
          }

          .week-navigation {
            flex-direction: column;
            gap: 15px;
            padding: 20px 15px;
          }

          .week-range {
            font-size: 16px;
            text-align: center;
          }

          .nav-btn {
            width: 100%;
          }

          .availability-info p {
            font-size: 12px;
          }

          .day-cell {
            padding: 16px;
          }

          .slots-grid {
            grid-template-columns: 1fr;
          }

          .legend-simple {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>

      <div className="calendar-header">
        <div>
          <h1>📅 {userRole === 'STUDENT' ? 'Available Appointment Slots' : 'My Teaching Schedule'}</h1>
          <p>{userRole === 'STUDENT' ? 'Select a time that works best for you' : 'Manage your availability and bookings'}</p>
        </div>
        
        <div className="view-controls">
          <button 
            className={`view-button ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => setViewMode('week')}
          >
            Week View
          </button>
          <button 
            className={`view-button ${viewMode === 'day' ? 'active' : ''}`}
            onClick={() => setViewMode('day')}
          >
            Day View
          </button>
          <button className="back-button" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
        </div>
      </div>

      {successMessage && <div className="success">{successMessage}</div>}
      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">
          <div>🔄 Loading your schedule...</div>
        </div>
      ) : (
        <>
          {viewMode === 'week' ? <WeekView /> : <DayView />}
        </>
      )}
    </div>
  );
}

CalendarSlotView.propTypes = {
  userId: PropTypes.string.isRequired,
  userRole: PropTypes.oneOf(['STUDENT', 'TEACHER']).isRequired,
};

export default CalendarSlotView;
