import React from 'react';
import PropTypes from 'prop-types';

function TeacherFilter({
  teachers,
  loading,
  selectedTeacherId,
  onSelect,
  activeTeacherLabel,
}) {
  return (
    <div className="teacher-filter-card">
      <div className="teacher-filter-header">
        <div>
          <p className="teacher-filter-title">Choose a teacher</p>
          <p className="teacher-filter-subtitle">Students view one teacher’s calendar at a time.</p>
        </div>
        {loading && <span className="teacher-filter-loading">Loading…</span>}
      </div>
      <select
        className="teacher-select"
        value={selectedTeacherId}
        onChange={(event) => onSelect(event.target.value)}
        disabled={loading || teachers.length === 0}
      >
        <option value="">Select a teacher</option>
        {teachers.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>
            {teacher.displayName || teacher.email}
          </option>
        ))}
      </select>
      <p className="teacher-filter-hint">
        {loading
          ? 'Loading teachers…'
          : teachers.length === 0
            ? 'No teachers are available yet.'
            : selectedTeacherId && activeTeacherLabel
              ? `Viewing ${activeTeacherLabel}'s weekly availability.`
              : 'Pick a teacher to load their schedule.'}
      </p>
    </div>
  );
}

TeacherFilter.propTypes = {
  teachers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    displayName: PropTypes.string,
    email: PropTypes.string,
  })).isRequired,
  loading: PropTypes.bool.isRequired,
  selectedTeacherId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onSelect: PropTypes.func.isRequired,
  activeTeacherLabel: PropTypes.string,
};

TeacherFilter.defaultProps = {
  activeTeacherLabel: '',
};

export default TeacherFilter;
