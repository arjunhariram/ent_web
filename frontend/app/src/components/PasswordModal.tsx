import React, { useState } from 'react';
import '../styles/login_modal.css';
import AccountConfirmation from './AccountConfirmation';

interface PasswordModalProps {
  onClose: () => void;
  mobileNumber: string;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onClose, mobileNumber }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    number: false
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    setPasswordRequirements({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      number: /[0-9]/.test(newPassword)
    });

    if (passwordError) {
      setPasswordError('');
    }
  };

  const validatePasswordClient = () => {
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match!');
      return false;
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return false;
    }

    if (!/[0-9]/.test(password)) {
      setPasswordError('Password must contain at least one number');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validatePasswordClient()) {
      return;
    }

    setIsLoading(true);
    setPasswordError('');

    try {
      const cleanNumber = mobileNumber.replace(/\D/g, '');
      console.log('Sending password set request for:', cleanNumber);

      // Use dynamic base URL based on current environment
      const baseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:4000' 
        : window.location.origin;
      
      const response = await fetch(`${baseUrl}/api/user/set-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mobileNumber: cleanNumber,
          password,
          confirmPassword
        })
      });

      if (!response.ok) {
        console.error('Server error:', response.status);
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Password set response:', data);

      if (data.success) {
        setShowConfirmation(true);
      } else {
        console.error('Password set error:', data);
        setPasswordError(data.message || 'Error setting password. Please try again.');

        if (data.message && data.message.includes('OTP verification required')) {
          if (window.confirm('Your OTP verification has expired. Do you want to request a new OTP?')) {
            onClose();
          }
        }
      }
    } catch (error) {
      console.error('Error setting password:', error);
      setPasswordError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showConfirmation) {
    return <AccountConfirmation onClose={onClose} />;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-password-content">
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Set Password</h2>
        <div className="modal-form-group">
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={handlePasswordChange}
            className="modal-input modal-input-password"
            disabled={isLoading}
          />
        </div>

        <div className="password-requirements">
          <div className={`requirement ${passwordRequirements.length ? 'met' : ''}`}>
            ✓ At least 8 characters
          </div>
          <div className={`requirement ${passwordRequirements.uppercase ? 'met' : ''}`}>
            ✓ At least 1 uppercase letter
          </div>
          <div className={`requirement ${passwordRequirements.number ? 'met' : ''}`}>
            ✓ At least 1 number
          </div>
        </div>

        <div className="modal-form-group">
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="modal-input modal-input-confirm-password"
            disabled={isLoading}
          />
        </div>
        {passwordError && (
          <div className="password-error-message">{passwordError}</div>
        )}
        <button
          className={`modal-submit-button modal-submit-button-unique ${isLoading ? 'disabled-button' : ''}`}
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Setting Password...' : 'Submit'}
        </button>
      </div>
    </div>
  );
};

export default PasswordModal;
