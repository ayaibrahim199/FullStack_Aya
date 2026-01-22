/* eslint-env browser */
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import TeacherFilter from '../components/calendar/TeacherFilter';
import SlotEditorModal from '../components/calendar/SlotEditorModal';
import WeekView from '../components/calendar/WeekView';
import { formatBookingStatusLabel, getStatusStyles } from '../constants/slotMeta';
import {
  isSameDay,
  formatTime,
  buildSlotDateTimes,
  makeSlotKey,
} from '../utils/calendarUtils';
import api from '../services/api';
import './CalendarSlotView.css';

function CalendarSlotView({ userId, userRole }) {
  console.log('CalendarSlotView - Props received:', { userId, userRole });
  const normalizedRoleInitial = userRole ? userRole.replace('ROLE_', '') : '';
  const safeUserId = userId != null ? String(userId) : '';
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [bookingSlotId, setBookingSlotId] = useState(null);
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'day'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingSlot, setEditingSlot] = useState(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [lessonType, setLessonType] = useState('weekly');
  const [busySlotKey, setBusySlotKey] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [teacherLoading, setTeacherLoading] = useState(() => normalizedRoleInitial === 'STUDENT');
  const [selectedTeacherId, setSelectedTeacherId] = useState(() => (normalizedRoleInitial === 'TEACHER' ? safeUserId : ''));
  const navigate = useNavigate();

  const normalizedRole = normalizedRoleInitial;
  const isTeacher = normalizedRole === 'TEACHER';
  const isStudent = normalizedRole === 'STUDENT';

  const fetchSlots = useCallback(async () => {
    if (!safeUserId) {
      return;
    }

    if (isStudent && !selectedTeacherId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const endpoint = isTeacher
        ? `/slots/teacher/${safeUserId}`
        : `/slots/available?teacherId=${selectedTeacherId}`;
      console.log('CalendarSlotView - Fetching slots:', { userRole: normalizedRole, userId: safeUserId, selectedTeacherId, endpoint });
      const response = await api.get(endpoint);
      console.log('CalendarSlotView - Slots response:', response.data);
      setSlots(response.data);
      setError('');
    } catch (err) {
      console.error('CalendarSlotView - Fetch error:', err);
      setError('Failed to load slots: ' + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  }, [safeUserId, isTeacher, isStudent, normalizedRole, selectedTeacherId]);

  useEffect(() => {
    if (!isStudent) {
      setTeacherLoading(false);
      setTeachers([]);
      setSelectedTeacherId(safeUserId);
      return;
    }

    let isMounted = true;

    const loadTeachers = async () => {
      setTeacherLoading(true);
      try {
        const response = await api.get('/teachers');
        if (!isMounted) return;

        const teacherList = Array.isArray(response.data) ? response.data : [];
        const sorted = teacherList.sort((a, b) => {
          const nameA = (a.displayName || a.email || '').toLowerCase();
          const nameB = (b.displayName || b.email || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setTeachers(sorted);
        setSelectedTeacherId((prev) => prev || (sorted[0] ? String(sorted[0].id) : ''));
      } catch (err) {
        if (!isMounted) return;
        console.error('CalendarSlotView - Teacher fetch error:', err);
        setError('Failed to load teachers: ' + (err.response?.data || err.message));
        setTeachers([]);
      } finally {
        if (isMounted) {
          setTeacherLoading(false);
        }
      }
    };

    loadTeachers();

    return () => {
      isMounted = false;
    };
  }, [isStudent, safeUserId]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleBookSlot = async (slotId, dayName, timeDisplay) => {
    if (!isStudent) return;

    const readableDay = dayName || 'this day';
    const readableTime = timeDisplay || 'this time';
    const confirmMessage = `Book ${readableDay} at ${readableTime} for ALL upcoming weeks?\n\nThis becomes your recurring appointment.`;
    // eslint-disable-next-line no-undef
    if (!globalThis.confirm(confirmMessage)) return;
    
    try {
      setBookingSlotId(slotId);
      await api.post(`/bookings/book?studentId=${safeUserId}&slotId=${slotId}`);
      setSuccessMessage('✅ Weekly appointment booked successfully! This time slot is now reserved for you every week.');
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchSlots();
    } catch (err) {
      setError('Failed to book appointment: ' + (err.response?.data?.message || err.response?.data || err.message));
    } finally {
      setBookingSlotId(null);
    }
  };

  const handleEditSlot = (slot) => {
    const startDate = new Date(slot.startTime);
    const endDate = new Date(slot.endTime);
    setEditingSlot(slot);
    setEditStartTime(formatDateTimeLocal(startDate));
    setEditEndTime(formatDateTimeLocal(endDate));
  };

  const handleUpdateSlot = async () => {
    if (!editingSlot) return;
    if (!editStartTime || !editEndTime) {
      setError('Both start and end times are required');
      return;
    }

    try {
      await api.put(`/slots/${editingSlot.id}?startTime=${encodeURIComponent(editStartTime)}&endTime=${encodeURIComponent(editEndTime)}`);
      setSuccessMessage('✅ Slot updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditingSlot(null);
      fetchSlots();
    } catch (err) {
      setError('Failed to update slot: ' + (err.response?.data || err.message));
    }
  };

  const handleDeleteSlot = async (slotId) => {
    // eslint-disable-next-line no-undef
    if (!globalThis.confirm('Delete this time slot? Students will no longer see it.')) return;
    
    try {
      await api.delete(`/slots/${slotId}`);
      setSuccessMessage('✅ Slot deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchSlots();
    } catch (err) {
      setError('Failed to delete slot: ' + (err.response?.data || err.message));
    }
  };

  // buildSlotDateTimes and makeSlotKey now imported from calendar utils

  const handleSlotEnable = async (dayDate, timeSlot, slot) => {
    if (busySlotKey) return;
    const slotKey = makeSlotKey(dayDate, timeSlot, slot);
    try {
      setBusySlotKey(slotKey);
      if (slot) {
        await api.post(`/slots/${slot.id}/enable`);
      } else {
        const { startLocal, endLocal } = buildSlotDateTimes(dayDate, timeSlot);
        await api.post(`/slots/create?teacherId=${safeUserId}&startTime=${encodeURIComponent(startLocal)}&endTime=${encodeURIComponent(endLocal)}`);
      }
      setSuccessMessage('🔔 Slot enabled for students');
      setTimeout(() => setSuccessMessage(''), 3500);
      fetchSlots();
    } catch (err) {
      setError('Failed to enable slot: ' + (err.response?.data || err.message));
    } finally {
      setBusySlotKey(null);
    }
  };

  const handleSlotDisable = async (slotId) => {
    // eslint-disable-next-line no-undef
    if (!globalThis.confirm('Disable this slot? Students will no longer see it.')) return;
    try {
      setBusySlotKey(`slot-${slotId}`);
      await api.post(`/slots/${slotId}/disable`);
      setSuccessMessage('Slot disabled');
      setTimeout(() => setSuccessMessage(''), 3500);
      fetchSlots();
    } catch (err) {
      setError('Failed to disable slot: ' + (err.response?.data || err.message));
    } finally {
      setBusySlotKey(null);
    }
  };

  const handleBookingDecision = async (bookingId, actionType) => {
    if (!bookingId) return;
    let endpoint = `/bookings/${bookingId}/approve`;
    let notePayload = null;
    if (actionType === 'reject') {
      // eslint-disable-next-line no-undef
      if (!globalThis.confirm('Reject this booking request?')) return;
      // eslint-disable-next-line no-undef
      const note = globalThis.prompt('Add a short note for the student (optional):');
      notePayload = note ? { note } : null;
      endpoint = `/bookings/${bookingId}/reject`;
    } else if (actionType === 'request_changes') {
      // eslint-disable-next-line no-undef
      const note = globalThis.prompt('Describe the change you need from the student:');
      if (note === null) return;
      notePayload = note.trim() ? { note: note.trim() } : null;
      endpoint = `/bookings/${bookingId}/request-changes`;
    }

    if (actionType === 'approve') {
      endpoint = `/bookings/${bookingId}/approve`;
    }

    try {
      setBusySlotKey(`booking-${bookingId}`);
      await api.post(endpoint, notePayload || {});
      setSuccessMessage('Booking updated successfully');
      setTimeout(() => setSuccessMessage(''), 3500);
      fetchSlots();
    } catch (err) {
      setError('Failed to update booking: ' + (err.response?.data || err.message));
    } finally {
      setBusySlotKey(null);
    }
  };

  // normalizedRole, isTeacher and isStudent already derived earlier

  const formatDateTimeLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Time helpers imported from calendar utils

  const getSlotsForDate = (date) => {
    return slots.filter(slot => {
      if (!slot.startTime) return false;
      const slotDate = new Date(slot.startTime);
      return isSameDay(slotDate, date);
    }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  };

  const navigateDay = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'day') {
      setSelectedDate(new Date());
    }
  };

  const handleJumpToToday = () => {
    setSelectedDate(new Date());
  };

  // Status colors now provided by getStatusStyles

  // Day View Component
  const DayView = () => {
    const daySlots = getSlotsForDate(selectedDate);
    const bookedSessions = daySlots.filter((slot) => {
      if (!slot || !slot.status) {
        return false;
      }
      return slot.status.toUpperCase() === 'BOOKED' && Boolean(slot.currentBooking);
    });
    const sessionsToDisplay = isTeacher ? bookedSessions : daySlots;
    const isShowingToday = isSameDay(selectedDate, new Date());

    const renderTeacherSessionCard = (slot) => {
      const booking = slot.currentBooking || {};
      const startDate = new Date(slot.startTime);
      const endDate = new Date(slot.endTime);
      const timeRange = `${formatTime(startDate)} – ${formatTime(endDate)}`;
      const displayNameSource = booking.studentName || booking.studentEmail || '';
      const studentLabel = (displayNameSource || 'Student').trim() || 'Student';
      const avatarLabel = studentLabel.charAt(0).toUpperCase() || 'S';
      const showStudentEmail = Boolean(booking.studentEmail && booking.studentEmail !== studentLabel);
      const durationMinutes = Math.round((endDate - startDate) / (1000 * 60));

      return (
        <div key={slot.id} className="session-card">
          <div className="session-card-head">
            <div className="session-time-range">{timeRange}</div>
            <span className="session-status-chip">Booked</span>
          </div>
          <div className="session-card-body">
            <div className="session-student">
              <div className="session-avatar" aria-hidden="true">{avatarLabel}</div>
              <div>
                <div className="session-student-name">{studentLabel}</div>
                {showStudentEmail && (
                  <div className="session-student-email">{booking.studentEmail}</div>
                )}
                <div className="session-meta">Session status: Booked</div>
              </div>
            </div>
            <div className="session-duration">Duration: {durationMinutes} min</div>
          </div>
        </div>
      );
    };

    const renderStudentDaySlot = (slot) => {
      const statusStyle = getStatusStyles(slot.status);
      const slotStatusValue = (slot.status || '').toUpperCase();
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
              {formatBookingStatusLabel(slot.status)}
            </div>
          </div>
          <div className="slot-details">
            <div className="teacher-info">
              <span className="teacher-icon">👨‍🏫</span>
              <span className="teacher-name">
                {slot.teacherName || slot.teacherEmail || 'Unknown Teacher'}
              </span>
            </div>
            <div className="slot-duration">
              Duration: {Math.round((new Date(slot.endTime) - new Date(slot.startTime)) / (1000 * 60))} minutes
            </div>
          </div>
          {isStudent && slotStatusValue === 'AVAILABLE' && (
            <button 
              className="book-slot-button"
              onClick={() => {
                const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
                const timeLabel = `${formatTime(new Date(slot.startTime))} – ${formatTime(new Date(slot.endTime))}`;
                handleBookSlot(slot.id, dayName, timeLabel);
              }}
              disabled={bookingSlotId === slot.id}
            >
              {bookingSlotId === slot.id ? 'Booking…' : 'Book This Slot'}
            </button>
          )}
        </div>
      );
    };

    return (
      <div className="calendar-day-view">
        <div className="day-header">
          <div className="day-nav-group">
            <button type="button" onClick={() => navigateDay(-1)} className="nav-button" aria-label="Previous day">←</button>
          </div>
          <div className="day-title-group">
            <h3>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
            {isShowingToday && <span className="today-chip">Today</span>}
            {isTeacher && <p className="day-subtitle">Today’s booked sessions</p>}
          </div>
          <div className="day-nav-group">
            <button
              type="button"
              className={`nav-button today-button ${isShowingToday ? 'active' : ''}`}
              onClick={handleJumpToToday}
            >
              Today
            </button>
            <button type="button" onClick={() => navigateDay(1)} className="nav-button" aria-label="Next day">→</button>
          </div>
        </div>
        
        <div className="day-slots">
          {sessionsToDisplay.length === 0 ? (
            <div className="no-slots">
              <div className="empty-state">
                <span className="empty-icon">📅</span>
                <h4>{isTeacher ? 'No sessions booked for today.' : 'No appointments scheduled'}</h4>
                <p>{isTeacher ? 'Students haven’t booked anything for this day yet.' : 'This day is completely free!'}</p>
              </div>
            </div>
          ) : (
            sessionsToDisplay.map((slot) => (
              isTeacher ? renderTeacherSessionCard(slot) : renderStudentDaySlot(slot)
            ))
          )}
        </div>
      </div>
    );
  };

  const activeTeacher = teachers.find((teacher) => String(teacher.id) === String(selectedTeacherId));
  const activeTeacherLabel = activeTeacher?.displayName || activeTeacher?.email || '';
  const currentEndpoint = isTeacher
    ? `/slots/teacher/${safeUserId}`
    : selectedTeacherId
      ? `/slots/available?teacherId=${selectedTeacherId}`
      : '/slots/available';
  const showLoadingState = loading || teacherLoading;
  const shouldRenderCalendar = isTeacher || Boolean(selectedTeacherId);
  const introTitle = isTeacher
    ? 'My Teaching Schedule'
    : activeTeacherLabel
      ? `${activeTeacherLabel} • Weekly Lessons`
      : 'Choose a Teacher';
  const introSubtitle = isTeacher
    ? 'Manage your availability and student bookings'
    : activeTeacherLabel
      ? 'Students can only book slots published by this teacher.'
      : 'Select a teacher to see their weekly availability.';

  // Safety check at render time - only check if completely invalid
  if (!safeUserId) {
    return (
      <div className="calendar-container">
        <div className="loading">
          <div>🔄 Loading authentication...</div>
        </div>
      </div>
    );
  }

  if (!normalizedRole || (normalizedRole !== 'STUDENT' && normalizedRole !== 'TEACHER')) {
    return (
      <div className="calendar-container">
        <div className="error">
          <div>⚠️ Invalid user role. Please log out and log in again.</div>
          <button onClick={() => navigate('/dashboard')} style={{marginTop: '20px', padding: '10px 20px', cursor: 'pointer'}}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <section className="calendar-intro-card">
        <div className="intro-icon" aria-hidden="true">📅</div>
        <div className="intro-text">
          <h1>{introTitle}</h1>
          <p>{introSubtitle}</p>
        </div>
      </section>

      <div className="view-controls compact">
        <div className="view-toggle">
          <button 
            className={`view-button ${viewMode === 'week' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('week')}
          >
            Week
          </button>
          <button 
            className={`view-button ${viewMode === 'day' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('day')}
          >
            Day
          </button>
        </div>
        <button className="back-link" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
      </div>

      {isStudent && (
        <TeacherFilter
          teachers={teachers}
          loading={teacherLoading}
          selectedTeacherId={selectedTeacherId}
          onSelect={setSelectedTeacherId}
          activeTeacherLabel={activeTeacherLabel}
        />
      )}

      {successMessage && <div className="success">{successMessage}</div>}
      {error && (
        <div className="error" style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '5px' }}>
          <strong>Error Details:</strong><br/>
          {error}
          <br/><br/>
          <strong>Debug Info:</strong><br/>
          User ID: {safeUserId || 'null'}<br/>
          User Role: {normalizedRole || userRole || 'null'}<br/>
          Current Endpoint: {currentEndpoint}<br/>
          Selected Teacher: {selectedTeacherId || (isTeacher ? safeUserId : 'none')}
        </div>
      )}

      <SlotEditorModal
        isOpen={Boolean(editingSlot)}
        startValue={editStartTime}
        endValue={editEndTime}
        onChangeStart={setEditStartTime}
        onChangeEnd={setEditEndTime}
        onSave={handleUpdateSlot}
        onClose={() => setEditingSlot(null)}
      />

      {showLoadingState ? (
        <div className="loading" style={{ margin: '20px 0', padding: '15px', backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb', borderRadius: '5px' }}>
          <div>🔄 Loading your schedule...</div>
          <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
            <strong>Debug Info:</strong><br/>
            User ID: {safeUserId || 'null'}<br/>
            User Role: {normalizedRole || userRole || 'null'}<br/>
            API Endpoint: {currentEndpoint}<br/>
            Selected Teacher: {selectedTeacherId || (isTeacher ? safeUserId : 'none')}
          </div>
        </div>
      ) : (
        <>
          {shouldRenderCalendar ? (
            viewMode === 'week' ? (
              <WeekView
                isTeacher={isTeacher}
                lessonType={lessonType}
                onLessonTypeChange={setLessonType}
                busySlotKey={busySlotKey}
                bookingSlotId={bookingSlotId}
                handleSlotEnable={handleSlotEnable}
                handleSlotDisable={handleSlotDisable}
                handleEditSlot={handleEditSlot}
                handleDeleteSlot={handleDeleteSlot}
                handleBookingDecision={handleBookingDecision}
                handleBookSlot={handleBookSlot}
                getSlotsForDate={getSlotsForDate}
                isSameDay={isSameDay}
                makeSlotKey={makeSlotKey}
              />
            ) : (
              <DayView />
            )
          ) : (
            <div className="teacher-empty-state">
              <p>
                {teachers.length === 0
                  ? 'No teachers have published availability yet. Check back soon.'
                  : 'Pick a teacher from the dropdown above to see their weekly schedule.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

CalendarSlotView.propTypes = {
  userId: PropTypes.string.isRequired,
  userRole: PropTypes.string.isRequired, // Accept any string, we normalize it internally
};

export default CalendarSlotView;
