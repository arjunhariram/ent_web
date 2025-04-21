import React from 'react';
import '../styles/login_modal.css';

interface PasswordChangeConfProps {
  onClose: () => void;
}

const PasswordChangeConf: React.FC<PasswordChangeConfProps> = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-password-content">
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Password Changed Successfully</h2>
        <p>Your password has been updated successfully. You can now log in with your new password.</p>
        <button className="modal-submit-button modal-submit-button-unique" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default PasswordChangeConf;



