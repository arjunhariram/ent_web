import React from 'react';
import '../styles/login_modal.css'; 

interface AccountConfirmationProps {
  onClose: () => void;
}

const AccountConfirmation: React.FC<AccountConfirmationProps> = ({ onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-confirmation-content">
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <div className="confirmation-icon-container">
          <div className="confirmation-icon">✓</div>
        </div>
        <h2>Account Created Successfully</h2>
        <p className="confirmation-message">
          Your account has been created and you are now logged in.
        </p>
        <button className="modal-submit-button modal-submit-button-unique" onClick={onClose}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default AccountConfirmation;
