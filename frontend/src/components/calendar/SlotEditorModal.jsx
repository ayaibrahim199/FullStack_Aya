import React from 'react';
import PropTypes from 'prop-types';

function SlotEditorModal({
  isOpen,
  startValue,
  endValue,
  onChangeStart,
  onChangeEnd,
  onSave,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      onKeyDown={(event) => event.key === 'Escape' && onClose()}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div className="modal-content" onClick={(event) => event.stopPropagation()} role="document">
        <h3>Edit Time Slot</h3>
        <div className="form-group">
          <label htmlFor="edit-start-time">Start Time:</label>
          <input
            id="edit-start-time"
            type="datetime-local"
            value={startValue}
            onChange={(event) => onChangeStart(event.target.value)}
            className="form-control"
          />
        </div>
        <div className="form-group">
          <label htmlFor="edit-end-time">End Time:</label>
          <input
            id="edit-end-time"
            type="datetime-local"
            value={endValue}
            onChange={(event) => onChangeEnd(event.target.value)}
            className="form-control"
          />
        </div>
        <div className="modal-actions">
          <button className="btn-save" type="button" onClick={onSave}>
            Save Changes
          </button>
          <button className="btn-cancel" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

SlotEditorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  startValue: PropTypes.string.isRequired,
  endValue: PropTypes.string.isRequired,
  onChangeStart: PropTypes.func.isRequired,
  onChangeEnd: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SlotEditorModal;
