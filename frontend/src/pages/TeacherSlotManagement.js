import React from 'react';
import PropTypes from 'prop-types';
import CalendarSlotView from './CalendarSlotView';

function TeacherSlotManagement({ userId, userName }) {
  return <CalendarSlotView userId={userId} userRole="TEACHER" />;
}

TeacherSlotManagement.propTypes = {
  userId: PropTypes.string.isRequired,
  userName: PropTypes.string.isRequired,
};

export default TeacherSlotManagement;