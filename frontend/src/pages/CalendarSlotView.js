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
      const daySlots = getAvailableTimeSlots(date);
      const existingSlots = getSlotsForDate(date);
      
      return {
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        fullDate: date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }),
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
              <p><strong>🔄 Regular Weekly Appointments</strong></p>
              <p>Book once, and this time slot will be yours every week!</p>
              <p><strong>Schedule:</strong> Sun: 6-7 PM, 9-10 PM (4 slots) | Mon-Fri: 3-9 PM (6 slots) | Sat: 9-11 AM (2 slots)</p>
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
                {day.slots.map((timeSlot, index) => {
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
                })}
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
          font-size: 24px;
          font-weight: 700;
          color: #2c3e50;
          text-align: center;
        }

        .recurring-note {
          text-align: center;
          color: #667eea;
          font-size: 14px;
          font-weight: 600;
          margin: 8px 0 0 0;
        }

        .availability-info {
          padding: 20px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-bottom: 2px solid #5568d3;
          text-align: center;
          color: white;
        }

        .availability-info p {
          margin: 5px 0;
          color: white;
          font-size: 14px;
        }

        .availability-info strong {
          color: #fff;
          font-size: 16px;
        }

        .create-weekly-slots-btn {
          margin-top: 15px;
          padding: 12px 30px;
          background: white;
          color: #667eea;
          border: 2px solid white;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .create-weekly-slots-btn:hover:not(:disabled) {
          background: #f0f7ff;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }

        .create-weekly-slots-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Slots List Container */
        .slots-list-container {
          padding: 32px;
          max-width: 900px;
          margin: 0 auto;
        }

        .day-section {
          margin-bottom: 40px;
          padding-bottom: 32px;
          border-bottom: 2px solid #e9ecef;
        }

        .day-section:last-child {
          border-bottom: none;
        }

        .day-section.today-section {
          background: linear-gradient(to right, #fff8f0, #ffffff);
          padding: 24px;
          border-radius: 12px;
          border: 2px solid #ffc107;
        }

        .day-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .day-name-heading {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #2c3e50;
        }

        .today-badge {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          box-shadow: 0 2px 8px rgba(240, 147, 251, 0.4);
        }

        .time-slots-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .slot-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          margin-bottom: 12px;
          background: white;
          border: 2px solid #dee2e6;
          border-radius: 10px;
          transition: all 0.3s ease;
          position: relative;
          padding-left: 40px;
        }

        .slot-item::before {
          content: "•";
          position: absolute;
          left: 20px;
          font-size: 20px;
          color: #6c757d;
        }

        .slot-item.available-slot {
          background: #d4edda;
          border-color: #28a745;
          border-left: 5px solid #28a745;
        }

        .slot-item.available-slot::before {
          color: #28a745;
        }

        .slot-item.booked-slot {
          background: #fff3cd;
          border-color: #ffc107;
          border-left: 5px solid #ffc107;
        }

        .slot-item.booked-slot::before {
          color: #ffc107;
        }

        .slot-item.unavailable-slot {
          background: #f8f9fa;
          border-color: #dee2e6;
          opacity: 0.6;
        }

        .slot-item.clickable-slot {
          cursor: pointer;
        }

        .slot-item.clickable-slot:hover {
          transform: translateX(8px);
          box-shadow: 0 4px 16px rgba(40, 167, 69, 0.2);
        }

        .slot-time-text {
          font-size: 18px;
          font-weight: 700;
          color: #2c3e50;
          min-width: 180px;
        }

        .slot-date-text {
          font-size: 16px;
          color: #6c757d;
          font-weight: 400;
          margin-left: 8px;
        }

        .status-tag {
          margin-left: auto;
          padding: 6px 14px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-tag.available-tag {
          background: #28a745;
          color: white;
        }

        .status-tag.booked-tag {
          background: #ffc107;
          color: #856404;
        }

        .status-tag.unavailable-tag {
          background: #6c757d;
          color: white;
        }

        .book-btn-inline {
          padding: 8px 20px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-left: 12px;
        }

        .book-btn-inline:hover {
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

          .slots-list-container {
            padding: 20px 16px;
          }

          .day-name-heading {
            font-size: 24px;
          }

          .slot-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            padding: 14px 16px 14px 36px;
          }

          .slot-time-text {
            font-size: 16px;
            min-width: auto;
          }

          .slot-date-text {
            font-size: 14px;
            margin-left: 0;
          }

          .status-tag {
            margin-left: 0;
          }

          .book-btn-inline {
            width: 100%;
            margin-left: 0;
            margin-top: 8px;
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
