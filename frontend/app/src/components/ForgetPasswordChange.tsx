import React, { useState } from 'react';
import '../styles/login_modal.css';

interface ForgetPasswordChangeProps {
  onClose: () => void;
  mobileNumber: string;
}

const ForgetPasswordChange: React.FC<ForgetPasswordChangeProps> = ({ onClose, mobileNumber }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
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

  const handleSubmit = async () => {
    setIsLoading(true);
    setPasswordError('');

    try {
      const cleanNumber = mobileNumber.replace(/\D/g, '');
      
      // Using the existing set-password endpoint which already has validation
      const response = await fetch('http://localhost:4000/api/user/set-password', {
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

      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsSuccess(true);
      } else {
        setPasswordError(data.message || 'Failed to reset password');

        if (data.message && data.message.includes('OTP verification required')) {
          if (window.confirm('Your OTP verification has expired. Do you want to request a new OTP?')) {
            onClose();
          }
        }
        
        // Show a more user-friendly message for password reuse
        if (data.message && data.message.includes('must be different from current password')) {
          setPasswordError('You cannot reuse your current password. Please choose a different password.');
        }
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setPasswordError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="modal-overlay">
        <div className="modal-password-content">
          <button className="modal-close-button" onClick={onClose}>
            &times;
          </button>
          <div className="confirmation-icon-container">
            <div className="confirmation-icon">✓</div>
          </div>
          <h2>Password Reset Successful</h2>
          <p className="confirmation-message">
            Your password has been reset successfully. You can now log in with your new password.
          </p>
          <button className="modal-submit-button modal-submit-button-unique" onClick={onClose}>
            Continue to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-password-content">
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Reset Password</h2>
        <p className="modal-subtitle">Create a new password for your account</p>
        <div className="modal-form-group">
          <input
            type="password"
            placeholder="Enter New Password"
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
            placeholder="Confirm New Password"
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
          {isLoading ? 'Resetting Password...' : 'Reset Password'}
        </button>
      </div>
    </div>
  );
};

export default ForgetPasswordChange;