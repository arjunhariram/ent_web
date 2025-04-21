import React, { useState } from 'react';
import '../styles/login_modal.css'; 
import PasswordChangeConf from './PasswordChangeConf'; 

interface ChangePasswordModalProps {
  onClose: () => void;
  showConfirmation: boolean;
  onConfirmationClose: () => void;
  setShowConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, showConfirmation, onConfirmationClose, setShowConfirmation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePasswordWithServer = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPasswordError('Not authenticated');
        return;
      }

      const response = await fetch('http://localhost:4000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword: confirmNewPassword
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setShowConfirmation(true);
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError('Error changing password. Please try again.');
      console.error('Error changing password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    setPasswordError('');
    
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }
    
    validatePasswordWithServer();
  };

  return (
    <>
      {!showConfirmation ? (
        <div className="modal-overlay">
          <div className="modal-password-content">
            <button className="modal-close-button" onClick={onClose}>
              &times;
            </button>
            <h2>Change Password</h2>
            <div className="modal-form-group">
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="changepass-current-password"
              />
            </div>
            <div className="modal-form-group">
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="changepass-new-password"
              />
            </div>
            <div className="modal-form-group">
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="changepass-confirm-new-password"
              />
            </div>
            {passwordError && (
              <div className="password-error-message">{passwordError}</div>
            )}
            <div className="password-requirements">
              Password must be at least 8 characters long, contain at least one uppercase letter and one number.
            </div>
            <button 
              className="changepass-submit-button" 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Change Password'}
            </button>
          </div>
        </div>
      ) : (
        <PasswordChangeConf onClose={onConfirmationClose} />
      )}
    </>
  );
};

export default ChangePasswordModal;
