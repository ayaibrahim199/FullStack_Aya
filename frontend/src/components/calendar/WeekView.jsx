import React from 'react';
import PropTypes from 'prop-types';
import { SLOT_STATUS_META, formatBookingStatusLabel } from '../../constants/slotMeta';
import { getAvailableTimeSlots, getWeekDates } from '../../utils/calendarUtils';

function WeekView({
  isTeacher,
  lessonType,
  onLessonTypeChange,
  busySlotKey,
  bookingSlotId,
  handleSlotEnable,
  handleSlotDisable,
  handleEditSlot,
  handleDeleteSlot,
  handleBookingDecision,
  handleBookSlot,
  getSlotsForDate,
  isSameDay,
  makeSlotKey,
}) {
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

  const renderActions = (day, timeSlot, slot, booking, slotKey) => {
    if (!isTeacher) return null;
    const slotBusy = busySlotKey === slotKey;
    const bookingBusy = booking ? busySlotKey === `booking-${booking.id}` : false;

    if (!slot || slot.status === 'DISABLED') {
      return (
        <button
          type="button"
          className="slot-action primary"
          onClick={() => handleSlotEnable(day.date, timeSlot, slot || null)}
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

  const renderTeacherSlotCard = (day, timeSlot) => {
    const slot = timeSlot.slot;
    const slotStatus = slot ? slot.status : 'UNPUBLISHED';
    const booking = slot?.currentBooking;
    const statusMeta = SLOT_STATUS_META[slotStatus] || SLOT_STATUS_META.UNPUBLISHED;
    const slotKey = makeSlotKey(day.date, timeSlot, slot);

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
        {renderActions(day, timeSlot, slot, booking, slotKey)}
      </div>
    );
  };

  const renderStudentSlotCard = (slotWrapper, index, dayName) => {
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
            onClick={() => handleBookSlot(slot.id, dayName, slotWrapper.display)}
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
          onClick={() => onLessonTypeChange('weekly')}
        >
          <span className="tab-title">Weekly lessons</span>
          <span className="tab-subtitle">Perfect for recurring students</span>
        </button>
        <button
          type="button"
          className={`weekly-tab ${lessonType === 'single' ? 'active' : ''}`}
          onClick={() => onLessonTypeChange('single')}
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
                        : renderStudentSlotCard({ ...slotItem, dayName: day.dayName }, index, day.dayName)
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="legend-simple modern">
            <div className="legend-item">
              <span className="legend-dot available" />
              <span>Students can book</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot pending" />
              <span>Awaiting approval</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot confirmed" />
              <span>Confirmed lesson</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot changes" />
              <span>Changes requested</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot disabled" />
              <span>Disabled slot</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

WeekView.propTypes = {
  isTeacher: PropTypes.bool.isRequired,
  lessonType: PropTypes.string.isRequired,
  onLessonTypeChange: PropTypes.func.isRequired,
  busySlotKey: PropTypes.string,
  bookingSlotId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  handleSlotEnable: PropTypes.func.isRequired,
  handleSlotDisable: PropTypes.func.isRequired,
  handleEditSlot: PropTypes.func.isRequired,
  handleDeleteSlot: PropTypes.func.isRequired,
  handleBookingDecision: PropTypes.func.isRequired,
  handleBookSlot: PropTypes.func.isRequired,
  getSlotsForDate: PropTypes.func.isRequired,
  isSameDay: PropTypes.func.isRequired,
  makeSlotKey: PropTypes.func.isRequired,
};

WeekView.defaultProps = {
  busySlotKey: null,
  bookingSlotId: null,
};

export default WeekView;
