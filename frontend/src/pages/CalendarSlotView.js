import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './CalendarSlotView.css';

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

  // Safety check: ensure props are valid
  if (!userId || !userRole || (userRole !== 'STUDENT' && userRole !== 'TEACHER')) {
    return (
      <div className="calendar-container">
        <div className="loading">
          <div>🔄 Loading authentication...</div>
        </div>
      </div>
    );
  }

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

  const handleBookSlot = async (slotId, dayName, timeDisplay) => {
    if (userRole !== 'STUDENT') return;
    
    const confirmMessage = `Book ${dayName} at ${timeDisplay} for ALL upcoming weeks?\n\nThis will be your regular weekly appointment.`;
    if (!window.confirm(confirmMessage)) return;
    
    try {
      setBookingSlotId(slotId);
      await api.post(`/bookings/book?studentId=${userId}&slotId=${slotId}`);
      setSuccessMessage('✅ Weekly appointment booked successfully! This time slot is now reserved for you every week.');
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchSlots();
    } catch (err) {
      setError('Failed to book appointment: ' + (err.response?.data?.message || err.response?.data || err.message));
    } finally {
      setBookingSlotId(null);
    }
  };

  const handleCreateWeeklySlots = async () => {
    if (userRole !== 'TEACHER') return;
    
    const confirmMessage = 'Create ALL weekly slots based on your schedule?\n\nThis will create slots for:\n• Sunday: 6 PM, 7 PM, 9 PM, 10 PM\n• Monday-Friday: 3 PM - 9 PM (6 slots each day)\n• Saturday: 9 AM - 11 AM';
    if (!window.confirm(confirmMessage)) return;
    
    try {
      setLoading(true);
      const currentWeekDates = getWeekDates(new Date());
      const slotsToCreate = [];
      
      currentWeekDates.forEach(date => {
        const slots = getAvailableTimeSlots(date);
        slots.forEach(slot => {
          const startDateTime = new Date(date);
          const [startHour, startMinute] = slot.start.split(':');
          startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
          
          const endDateTime = new Date(date);
          const [endHour, endMinute] = slot.end.split(':');
          endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
          
          slotsToCreate.push({
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString()
          });
        });
      });
      
      // Create all slots
      for (const slotData of slotsToCreate) {
        await api.post(`/slots/create?teacherId=${userId}`, slotData);
      }
      
      setSuccessMessage(`✅ Successfully created ${slotsToCreate.length} weekly slots!`);
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchSlots();
    } catch (err) {
      setError('Failed to create slots: ' + (err.response?.data?.message || err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Get available time slots helper function
  const getAvailableTimeSlots = (date) => {
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 0) {
      return [
        { start: '18:00', end: '19:00', display: '6:00 PM – 7:00 PM' },
        { start: '19:00', end: '20:00', display: '7:00 PM – 8:00 PM' },
        { start: '21:00', end: '22:00', display: '9:00 PM – 10:00 PM' },
        { start: '22:00', end: '23:00', display: '10:00 PM – 11:00 PM' }
      ];
    }
    
    if (dayOfWeek === 6) {
      return [
        { start: '09:00', end: '10:00', display: '9:00 AM – 10:00 AM' },
        { start: '10:00', end: '11:00', display: '10:00 AM – 11:00 AM' }
      ];
    }
    
    return [
      { start: '15:00', end: '16:00', display: '3:00 PM – 4:00 PM' },
      { start: '16:00', end: '17:00', display: '4:00 PM – 5:00 PM' },
      { start: '17:00', end: '18:00', display: '5:00 PM – 6:00 PM' },
      { start: '18:00', end: '19:00', display: '6:00 PM – 7:00 PM' },
      { start: '19:00', end: '20:00', display: '7:00 PM – 8:00 PM' },
      { start: '20:00', end: '21:00', display: '8:00 PM – 9:00 PM' }
    ];
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

  // Show only current week - no navigation needed
  // const navigateWeek = (direction) => {
  //   const newWeek = new Date(currentWeek);
  //   newWeek.setDate(currentWeek.getDate() + (direction * 7));
  //   setCurrentWeek(newWeek);
  // };

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

  // Week View Component - Simple Available Slots List
  const WeekView = () => {
    const weekDates = getWeekDates(currentWeek);
    const today = new Date();

    // Build available slots for the week
    const weeklyAvailableSlots = weekDates.map(date => {
      const existingSlots = getSlotsForDate(date);
      
      // For TEACHER: show template slots + existing slots
      // For STUDENT: show ONLY existing slots from database
      let slotsToShow;
      
      if (userRole === 'TEACHER') {
        // Teacher sees all possible time slots
        const daySlots = getAvailableTimeSlots(date);
        slotsToShow = daySlots.map(timeSlot => {
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
        });
      } else {
        // Student sees ONLY slots that exist in database
        slotsToShow = existingSlots.map(slot => {
          const slotStart = new Date(slot.startTime);
          const slotEnd = new Date(slot.endTime);
          const startHour = slotStart.getHours();
          const endHour = slotEnd.getHours();
          const startPeriod = startHour >= 12 ? 'PM' : 'AM';
          const endPeriod = endHour >= 12 ? 'PM' : 'AM';
          const displayStartHour = startHour > 12 ? startHour - 12 : (startHour === 0 ? 12 : startHour);
          const displayEndHour = endHour > 12 ? endHour - 12 : (endHour === 0 ? 12 : endHour);
          
          return {
            start: `${slotStart.getHours().toString().padStart(2, '0')}:${slotStart.getMinutes().toString().padStart(2, '0')}`,
            end: `${slotEnd.getHours().toString().padStart(2, '0')}:${slotEnd.getMinutes().toString().padStart(2, '0')}`,
            display: `${displayStartHour}:${slotStart.getMinutes().toString().padStart(2, '0')} ${startPeriod} – ${displayEndHour}:${slotEnd.getMinutes().toString().padStart(2, '0')} ${endPeriod}`,
            slot: slot,
            status: slot.status
          };
        });
      }
      
      return {
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        fullDate: date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        isToday: isSameDay(date, today),
        slots: slotsToShow
      };
    });

    return (
      <div className="calendar-week-view">
        <div className="week-navigation">
          <h3 className="week-range">
            📅 Weekly Schedule
          </h3>
          <p className="recurring-note">{userRole === 'TEACHER' ? 'Manage your weekly availability' : 'Select your preferred weekly time slot'}</p>
        </div>

        <div className="availability-info">
          {userRole === 'TEACHER' ? (
            <>
              <p><strong>👨‍🏫 Teacher Slot Management</strong></p>
              <p>Create all your weekly time slots at once with the button below</p>
              <p><strong>Schedule:</strong> Sun: 6-7 PM, 9-10 PM (4 slots) | Mon-Fri: 3-9 PM (6 slots) | Sat: 9-11 AM (2 slots)</p>
              <button className="create-weekly-slots-btn" onClick={handleCreateWeeklySlots} disabled={loading}>
                {loading ? '⏳ Creating Slots...' : '➕ Create All Weekly Slots'}
              </button>
            </>
          ) : (
            <>
              <p><strong>📅 Available Appointment Slots</strong></p>
              <p>Book any available slot - you'll see only the time slots your teacher has created!</p>
              <p>Slots are updated in real-time when teachers add, edit, or remove them.</p>
            </>
          )}
        </div>
        
        <div className="slots-list-container">
          {weeklyAvailableSlots.map((day) => (
            <div key={day.date.toISOString()} className={`day-section ${day.isToday ? 'today-section' : ''}`}>
              <div className="day-header">
                <h2 className="day-name-heading">{day.dayName}</h2>
                {day.isToday && <span className="today-badge">Today</span>}
              </div>
              
              <ul className="time-slots-list">
                {day.slots.length === 0 && userRole === 'STUDENT' ? (
                  <li className="slot-item unavailable-slot">
                    <span className="slot-time-text">No slots available for this day</span>
                  </li>
                ) : (
                  day.slots.map((timeSlot, index) => {
                    const slot = timeSlot.slot;
                    const isAvailable = slot && slot.status === 'AVAILABLE';
                    const isBooked = slot && slot.status === 'BOOKED';
                    const isUnavailable = !slot || timeSlot.status === 'UNAVAILABLE';
                    
                    return (
                      <li
                        key={index}
                        className={`slot-item ${isAvailable ? 'available-slot' : ''} ${isBooked ? 'booked-slot' : ''} ${isUnavailable ? 'unavailable-slot' : ''} ${userRole === 'STUDENT' && isAvailable ? 'clickable-slot' : ''}`}
                        onClick={() => userRole === 'STUDENT' && isAvailable && handleBookSlot(slot.id, day.dayName, timeSlot.display)}
                      >
                        <span className="slot-time-text">{timeSlot.display}</span>
                        <span className="slot-date-text">({day.fullDate})</span>
                        
                        {isAvailable && <span className="status-tag available-tag">✓ Available</span>}
                        {isBooked && <span className="status-tag booked-tag">Booked</span>}
                        {isUnavailable && <span className="status-tag unavailable-tag">Not Open</span>}
                        
                        {userRole === 'STUDENT' && isAvailable && (
                          <button className="book-btn-inline" onClick={(e) => {
                            e.stopPropagation();
                            handleBookSlot(slot.id, day.dayName, timeSlot.display);
                          }}>
                            Book
                          </button>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          ))}
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
