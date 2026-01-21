import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

function TeacherDashboard({ userId, userName }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new teacher slots management page
    navigate('/teacher-slots');
  }, [navigate]);

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>Redirecting to Slot Management...</h2>
    </div>
  );
}

TeacherDashboard.propTypes = {
  userId: PropTypes.string.isRequired,
  userName: PropTypes.string.isRequired
};

export default TeacherDashboard;
