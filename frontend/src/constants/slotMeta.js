export const SLOT_STATUS_META = {
  AVAILABLE: { label: 'Available', icon: '✅', className: 'status-available' },
  PENDING: { label: 'Pending approval', icon: '⏳', className: 'status-pending' },
  BOOKED: { label: 'Confirmed', icon: '🔒', className: 'status-booked' },
  DISABLED: { label: 'Disabled', icon: '🚫', className: 'status-disabled' },
  CHANGES_REQUESTED: { label: 'Changes requested', icon: '📝', className: 'status-changes' },
  UNPUBLISHED: { label: 'Not enabled', icon: '🚫', className: 'status-disabled' },
};

const BOOKING_STATUS_LABELS = {
  AVAILABLE: 'Available for students',
  BOOKED: 'Confirmed lesson',
  DISABLED: 'Hidden from students',
  UNPUBLISHED: 'Not enabled yet',
  PENDING: 'Waiting for your response',
  CHANGES_REQUESTED: 'Teacher asked for edits',
  CONFIRMED: 'Confirmed lesson',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

export const formatBookingStatusLabel = (status) => {
  if (!status) return 'Pending';
  return BOOKING_STATUS_LABELS[status] || status;
};

const STATUS_COLOR_MAP = {
  AVAILABLE: { bg: '#d1f4e0', border: '#22c55e', text: '#166534' },
  PENDING: { bg: '#fff4d6', border: '#f6c343', text: '#7a4b00' },
  BOOKED: { bg: '#e9e7ff', border: '#7c3aed', text: '#3c1c7d' },
  CHANGES_REQUESTED: { bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  DISABLED: { bg: '#f3f4f6', border: '#d1d5db', text: '#374151' },
  CANCELLED: { bg: '#f8d7da', border: '#dc3545', text: '#721c24' },
};

export const getStatusStyles = (status) => {
  if (!status) {
    return STATUS_COLOR_MAP.AVAILABLE;
  }
  const normalized = status.toUpperCase();
  return STATUS_COLOR_MAP[normalized] || STATUS_COLOR_MAP.AVAILABLE;
};
