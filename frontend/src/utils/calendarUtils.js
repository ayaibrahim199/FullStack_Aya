const toDateTimeLocalString = (dt) => {
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  const hours = String(dt.getHours()).padStart(2, '0');
  const minutes = String(dt.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const getAvailableTimeSlots = (date) => {
  const dayOfWeek = date.getDay();

  if (dayOfWeek === 0) {
    return [
      { start: '18:00', end: '19:00', display: '6:00 PM – 7:00 PM' },
      { start: '19:00', end: '20:00', display: '7:00 PM – 8:00 PM' },
      { start: '21:00', end: '22:00', display: '9:00 PM – 10:00 PM' },
      { start: '22:00', end: '23:00', display: '10:00 PM – 11:00 PM' },
    ];
  }

  if (dayOfWeek === 6) {
    return [
      { start: '09:00', end: '10:00', display: '9:00 AM – 10:00 AM' },
      { start: '10:00', end: '11:00', display: '10:00 AM – 11:00 AM' },
    ];
  }

  return [
    { start: '15:00', end: '16:00', display: '3:00 PM – 4:00 PM' },
    { start: '16:00', end: '17:00', display: '4:00 PM – 5:00 PM' },
    { start: '17:00', end: '18:00', display: '5:00 PM – 6:00 PM' },
    { start: '18:00', end: '19:00', display: '6:00 PM – 7:00 PM' },
    { start: '19:00', end: '20:00', display: '7:00 PM – 8:00 PM' },
    { start: '20:00', end: '21:00', display: '8:00 PM – 9:00 PM' },
  ];
};

export const getWeekDates = (date = new Date()) => {
  const week = [];
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);

  for (let i = 0; i < 7; i += 1) {
    const nextDay = new Date(startOfWeek);
    nextDay.setDate(startOfWeek.getDate() + i);
    week.push(nextDay);
  }

  return week;
};

export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) {
    return false;
  }
  return date1.toDateString() === date2.toDateString();
};

export const formatTime = (date) => date.toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

export const buildSlotDateTimes = (date, timeSlot) => {
  const start = new Date(date);
  const [startHour, startMinute] = timeSlot.start.split(':').map((value) => Number.parseInt(value, 10));
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date(date);
  const [endHour, endMinute] = timeSlot.end.split(':').map((value) => Number.parseInt(value, 10));
  end.setHours(endHour, endMinute, 0, 0);

  return {
    startLocal: toDateTimeLocalString(start),
    endLocal: toDateTimeLocalString(end),
    display: `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
  };
};

export const makeSlotKey = (dayDate, timeSlot, slot) => {
  if (slot?.id) {
    return `slot-${slot.id}`;
  }
  return `${dayDate.toISOString()}-${timeSlot.start}`;
};
