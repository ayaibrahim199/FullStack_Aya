import React, { useEffect } from 'react';
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

export default TeacherDashboard;
