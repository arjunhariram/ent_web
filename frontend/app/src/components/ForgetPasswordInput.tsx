import React, { useState } from 'react';
import '../styles/login_modal.css';
import ForgetPasswordOTP from './ForgetPasswordOTP';

interface ForgetPasswordInputProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const ForgetPasswordInput: React.FC<ForgetPasswordInputProps> = ({ onClose, onSwitchToLogin }) => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setMobileNumber(value);
      if (mobileError) {
        setMobileError('');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'];
    if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobileNumber) {
      setMobileError('Please enter a mobile number');
      return;
    }

    setIsLoading(true);
    
    try {
      // First, check if the user exists
      const checkUserResponse = await fetch('http://localhost:4000/api/auth/check-user-exists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber })
      });

      const checkUserData = await checkUserResponse.json();

      if (!checkUserData.exists) {
        setMobileError(checkUserData.message);
        setIsLoading(false);
        return;
      }

      // If user exists, proceed with mobile validation and OTP generation
      const response = await fetch('http://localhost:4000/api/validate/validate-mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber })
      });

      const data = await response.json();

      if (data.isValid) {
        if (data.otp) {
          alert(`Your OTP for verification is: ${data.otp}`);
        }

        setShowOTPModal(true);
      } else {
        setMobileError(data.message || 'Validation failed');
      }
    } catch (error) {
      console.error('Error:', error);
      setMobileError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (showOTPModal) {
    return (
      <ForgetPasswordOTP
        onClose={onClose}
        mobileNumber={mobileNumber}
      />
    );
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Forgot Password</h2>
        <p className="forgot-password-subtitle">Enter your mobile number to reset your password</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="mobileNumber">Mobile Number</label>
            <input
              type="tel"
              id="mobileNumber"
              placeholder="Enter your mobile number"
              value={mobileNumber}
              onChange={handleMobileChange}
              onKeyDown={handleKeyDown}
              maxLength={10}
              className="login-input login-input-mobile"
            />
            {mobileError && <div className="error-message">{mobileError}</div>}
            <div className="mobile-requirements">
              Please enter a valid 10-digit Indian mobile number.
            </div>
          </div>
          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Continue'}
          </button>
        </form>
        <p className="create-account-link">
          Remember your password? <a href="#" onClick={onSwitchToLogin}>Login</a>
        </p>
      </div>
    </div>
  );
};

export default ForgetPasswordInput;