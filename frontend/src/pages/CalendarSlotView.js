/* eslint-env browser */
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './CalendarSlotView.css';

const SLOT_STATUS_META = {
  AVAILABLE: { label: 'Available', icon: '✅', className: 'status-available' },
  PENDING: { label: 'Pending approval', icon: '⏳', className: 'status-pending' },
  BOOKED: { label: 'Confirmed', icon: '🔒', className: 'status-booked' },
  DISABLED: { label: 'Disabled', icon: '🚫', className: 'status-disabled' },
  CHANGES_REQUESTED: { label: 'Changes requested', icon: '📝', className: 'status-changes' },
  UNPUBLISHED: { label: 'Not enabled', icon: '🚫', className: 'status-disabled' }
};

const formatBookingStatusLabel = (status) => {
  if (!status) return 'Pending';
  const map = {
    AVAILABLE: 'Available for students',
    BOOKED: 'Confirmed lesson',
    DISABLED: 'Hidden from students',
    UNPUBLISHED: 'Not enabled yet',
    PENDING: 'Waiting for your response',
    CHANGES_REQUESTED: 'Teacher asked for edits',
    CONFIRMED: 'Confirmed lesson',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled'
  };
  return map[status] || status;
};

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

  const makeSlotKey = (dayDate, timeSlot, slot) => (slot?.id ? `slot-${slot.id}` : `${dayDate.toISOString()}-${timeSlot.start}`);

  const buildSlotDateTimes = (date, timeSlot) => {
    const start = new Date(date);
    const [startHour, startMinute] = timeSlot.start.split(':').map((value) => Number.parseInt(value, 10));
    start.setHours(startHour, startMinute, 0, 0);
    const end = new Date(date);
    const [endHour, endMinute] = timeSlot.end.split(':').map((value) => Number.parseInt(value, 10));
    end.setHours(endHour, endMinute, 0, 0);

    const toDateTimeLocalString = (dt) => {
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      const hours = String(dt.getHours()).padStart(2, '0');
      const minutes = String(dt.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    return {
      startLocal: toDateTimeLocalString(start),
      endLocal: toDateTimeLocalString(end),
      display: `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    };
  };

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

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
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

  const getSlotStatus = (slot) => {
    if (!slot) return null;
    
    const statusColors = {
      AVAILABLE: { bg: '#d1f4e0', border: '#22c55e', text: '#166534' },
      PENDING: { bg: '#fff4d6', border: '#f6c343', text: '#7a4b00' },
      BOOKED: { bg: '#e9e7ff', border: '#7c3aed', text: '#3c1c7d' },
      CHANGES_REQUESTED: { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
      DISABLED: { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' },
      CANCELLED: { bg: '#f8d7da', border: '#dc3545', text: '#721c24' }
    };
    
    return statusColors[slot.status] || statusColors.AVAILABLE;
  };

  // Week View Component - click slots to control availability
  const WeekView = () => {
    const weekDates = getWeekDates(new Date());
    const today = new Date();

    const weeklyData = weekDates.map((date) => {
      const existingSlots = getSlotsForDate(date);

      const teacherSlots = getAvailableTimeSlots(date).map((templateSlot) => {
        const matchedSlot = existingSlots.find((slot) => {
          const slotStart = new Date(slot.startTime);
          const slotHour = slotStart.getHours().toString().padStart(2, '0');
          const slotMinute = slotStart.getMinutes().toString().padStart(2, '0');
          return `${slotHour}:${slotMinute}` === templateSlot.start;
        });

        return {
          ...templateSlot,
          slot: matchedSlot,
          status: matchedSlot ? matchedSlot.status : 'UNPUBLISHED',
          booking: matchedSlot?.currentBooking || null,
          date,
        };
      });

      const studentSlots = existingSlots
        .filter((slot) => slot.status !== 'DISABLED')
        .map((slot) => {
          const slotStart = new Date(slot.startTime);
          const slotEnd = new Date(slot.endTime);
          return {
            slot,
            status: slot.status,
            display: `${slotStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – ${slotEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
            startTime: slotStart,
            endTime: slotEnd,
          };
        });

      return {
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        shortName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday: isSameDay(date, today),
        teacherSlots,
        studentSlots,
      };
    });

    const helperCopy = lessonType === 'weekly'
      ? 'Weekly lessons repeat automatically. Toggle any slot to instantly enable or disable student access.'
      : 'Single lessons are perfect for ad-hoc sessions. This view is coming soon.';

    const renderTeacherSlotCard = (day, timeSlot) => {
      const slot = timeSlot.slot;
      const slotStatus = slot ? slot.status : 'UNPUBLISHED';
      const booking = slot?.currentBooking;
      const statusMeta = SLOT_STATUS_META[slotStatus] || SLOT_STATUS_META.UNPUBLISHED;
      const slotKey = makeSlotKey(day.date, timeSlot, slot);
      const slotBusy = busySlotKey === slotKey;
      const bookingBusy = booking ? busySlotKey === `booking-${booking.id}` : false;

      const renderActions = () => {
        if (normalizedRole !== 'TEACHER') return null;
        if (!slot) {
          return (
            <button
              type="button"
              className="slot-action primary"
              onClick={() => handleSlotEnable(day.date, timeSlot, null)}
              disabled={slotBusy}
            >
              {slotBusy ? 'Enabling…' : 'Enable slot'}
            </button>
          );
        }

        if (slot.status === 'DISABLED') {
          return (
            <button
              type="button"
              className="slot-action primary"
              onClick={() => handleSlotEnable(day.date, timeSlot, slot)}
              disabled={slotBusy}
            >
              {slotBusy ? 'Enabling…' : 'Enable slot'}
            </button>
          );
        }

        if (slot.status === 'AVAILABLE') {
          return (
            <div className="slot-action-row">
              <button type="button" className="slot-action ghost" onClick={() => handleSlotDisable(slot.id)} disabled={slotBusy}>
                {slotBusy ? 'Working…' : 'Disable'}
              </button>
              <button type="button" className="slot-action ghost" onClick={() => handleEditSlot(slot)}>
                Edit
              </button>
              <button type="button" className="slot-action danger" onClick={() => handleDeleteSlot(slot.id)} disabled={slotBusy}>
                {slotBusy ? 'Removing…' : 'Delete'}
              </button>
            </div>
          );
        }

        if (slot.status === 'PENDING' || slot.status === 'CHANGES_REQUESTED') {
          return (
            <div className="slot-action-row decision">
              <button type="button" className="slot-action success" onClick={() => handleBookingDecision(booking?.id, 'approve')} disabled={bookingBusy || !booking}>
                {bookingBusy ? 'Updating…' : 'Accept'}
              </button>
              <button type="button" className="slot-action ghost" onClick={() => handleBookingDecision(booking?.id, 'request_changes')} disabled={bookingBusy || !booking}>
                {bookingBusy ? 'Updating…' : 'Request changes'}
              </button>
              <button type="button" className="slot-action danger" onClick={() => handleBookingDecision(booking?.id, 'reject')} disabled={bookingBusy || !booking}>
                {bookingBusy ? 'Updating…' : 'Reject'}
              </button>
            </div>
          );
        }

        return (
          <div className="slot-lock-msg">
            <span>Lesson confirmed</span>
            <small>Cancel from the booking tab.</small>
          </div>
        );
      };

      return (
        <div key={`${day.shortName}-${timeSlot.start}`} className={`slot-card ${statusMeta.className}`}>
          <div className="slot-card-head">
            <span className="slot-time">{timeSlot.display}</span>
            <span className={`slot-status-pill ${statusMeta.className}`}>
              {statusMeta.icon} {statusMeta.label}
            </span>
          </div>
          {booking && (
            <div className="slot-booking-summary">
              <span className="booking-avatar">👤</span>
              <div>
                <strong>{booking.studentName || 'Student'}</strong>
                <small>{formatBookingStatusLabel(booking.status)}</small>
              </div>
            </div>
          )}
          {!booking && slotStatus === 'UNPUBLISHED' && (
            <p className="slot-note">Turn this on so students can book it.</p>
          )}
          {slot && slot.status === 'DISABLED' && (
            <p className="slot-note">Hidden from students until you enable it.</p>
          )}
          {slot && slot.status === 'BOOKED' && booking && (
            <p className="slot-note">Booked by {booking.studentName || 'student'}</p>
          )}
          {renderActions()}
        </div>
      );
    };

    const renderStudentSlotCard = (slotWrapper, index) => {
      const slot = slotWrapper.slot;
      const statusMeta = SLOT_STATUS_META[slot.status] || SLOT_STATUS_META.AVAILABLE;
      const showBookCta = slot.status === 'AVAILABLE';
      const isLocked = slot.status === 'BOOKED';

      return (
        <div key={`student-slot-${slot.id}-${index}`} className={`slot-card ${statusMeta.className}`}>
          <div className="slot-card-head">
            <span className="slot-time">{slotWrapper.display}</span>
            <span className={`slot-status-pill ${statusMeta.className}`}>
              {statusMeta.icon} {statusMeta.label}
            </span>
          </div>
          {isLocked && (
            <div className="slot-booking-summary">
              <span className="booking-avatar">🔒</span>
              <div>
                <strong>Reserved</strong>
                <small>This session is confirmed for another student.</small>
              </div>
            </div>
          )}
          {showBookCta ? (
            <button
              type="button"
              className="slot-action primary full"
              onClick={() => handleBookSlot(slot.id, slotWrapper.dayName || '', slotWrapper.display)}
              disabled={bookingSlotId === slot.id}
            >
              {bookingSlotId === slot.id ? 'Booking…' : 'Book this slot'}
            </button>
          ) : (
            <p className="slot-note subtle">{formatBookingStatusLabel(slot.status)}</p>
          )}
        </div>
      );
    };

    return (
      <div className="calendar-week-view modern">
        <div className="weekly-tabs">
          <button
            type="button"
            className={`weekly-tab ${lessonType === 'weekly' ? 'active' : ''}`}
            onClick={() => setLessonType('weekly')}
          >
            <span className="tab-title">Weekly lessons</span>
            <span className="tab-subtitle">Perfect for recurring students</span>
          </button>
          <button
            type="button"
            className={`weekly-tab ${lessonType === 'single' ? 'active' : ''}`}
            onClick={() => setLessonType('single')}
          >
            <span className="tab-title">Single lessons</span>
            <span className="tab-subtitle">Plan ad-hoc sessions</span>
          </button>
        </div>

        <p className="lesson-helper-text">{helperCopy}</p>

        {lessonType === 'single' ? (
          <div className="single-lessons-placeholder">
            <h3>Single lessons view</h3>
            <p>This mode is coming soon. For now, manage recurring lessons via the Weekly view.</p>
          </div>
        ) : (
          <>
            <div className="weekly-grid">
              {weeklyData.map((day) => (
                <div key={day.date.toISOString()} className={`weekly-column ${day.isToday ? 'is-today' : ''}`}>
                  <div className={`weekly-column-header ${day.isToday ? 'is-today' : ''}`}>
                    <span className="weekday-name">{day.shortName}</span>
                    <span className="weekday-date">{day.fullDate}</span>
                  </div>
                  <div className="weekly-column-body">
                    {(isTeacher ? day.teacherSlots : day.studentSlots).length === 0 ? (
                      <div className="weekly-placeholder">—</div>
                    ) : (
                      (isTeacher ? day.teacherSlots : day.studentSlots).map((slotItem, index) => (
                        isTeacher
                          ? renderTeacherSlotCard(day, slotItem)
                          : renderStudentSlotCard({ ...slotItem, dayName: day.dayName }, index)
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="legend-simple modern">
              <div className="legend-item">
                <span className="legend-dot available"></span>
                <span>Students can book</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot pending"></span>
                <span>Awaiting approval</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot confirmed"></span>
                <span>Confirmed lesson</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot changes"></span>
                <span>Changes requested</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot disabled"></span>
                <span>Disabled slot</span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

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
      const statusStyle = getSlotStatus(slot);
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
        <div className="teacher-filter-card">
          <div className="teacher-filter-header">
            <div>
              <p className="teacher-filter-title">Choose a teacher</p>
              <p className="teacher-filter-subtitle">Students view one teacher’s calendar at a time.</p>
            </div>
            {teacherLoading && <span className="teacher-filter-loading">Loading…</span>}
          </div>
          <select
            className="teacher-select"
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            disabled={teacherLoading || teachers.length === 0}
          >
            <option value="">Select a teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.displayName || teacher.email}
              </option>
            ))}
          </select>
          <p className="teacher-filter-hint">
            {teacherLoading
              ? 'Loading teachers…'
              : teachers.length === 0
                ? 'No teachers are available yet.'
                : selectedTeacherId && activeTeacherLabel
                  ? `Viewing ${activeTeacherLabel}'s weekly availability.`
                  : 'Pick a teacher to load their schedule.'}
          </p>
        </div>
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

      {editingSlot && (
        <div 
          className="modal-overlay" 
          onClick={() => setEditingSlot(null)}
          onKeyDown={(e) => e.key === 'Escape' && setEditingSlot(null)}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <h3>Edit Time Slot</h3>
            <div className="form-group">
              <label htmlFor="edit-start-time">Start Time:</label>
              <input 
                id="edit-start-time"
                type="datetime-local" 
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-end-time">End Time:</label>
              <input 
                id="edit-end-time"
                type="datetime-local" 
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-save" onClick={handleUpdateSlot}>Save Changes</button>
              <button className="btn-cancel" onClick={() => setEditingSlot(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

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
            viewMode === 'week' ? <WeekView /> : <DayView />
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
