import React, { useState, KeyboardEvent } from 'react';
import '../styles/login_modal.css';
import ForgotPasswordOTP from './ForgotPasswordOTP';

interface ForgotPasswordInputProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const ForgotPasswordInput: React.FC<ForgotPasswordInputProps> = ({ onClose, onSwitchToLogin }) => {
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [hideForgotPasswordModal, setHideForgotPasswordModal] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileError, setMobileError] = useState('');

  const validateIndianMobileNumber = (number: string): { isValid: boolean; message: string } => {
    const cleanNumber = number.replace(/\s+/g, '').replace(/[-()+]/g, '');

    if (cleanNumber.length !== 10) {
      return {
        isValid: false,
        message: 'Invalid mobile number'
      };
    }

    if (!/^[6-9]/.test(cleanNumber)) {
      return {
        isValid: false,
        message: 'Please enter a valid Indian mobile number'
      };
    }

    return {
      isValid: true,
      message: ''
    };
  };

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

  const handleForgotPassword = async (e: React.MouseEvent | React.FormEvent) => {
    if (e.preventDefault) e.preventDefault();
    console.log('Forgot Password button clicked!');

    try {
      if (!mobileNumber) {
        setMobileError('Please enter a mobile number');
        return;
      }

      const mobileValidation = validateIndianMobileNumber(mobileNumber);

      if (!mobileValidation.isValid) {
        setMobileError(mobileValidation.message);
        return;
      }

      // Use the forgot-password endpoint directly since it already handles validation
      const response = await fetch('http://localhost:4000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber })
      });

      const data = await response.json();
      
      if (response.status === 404) {
        setMobileError('No account linked with this mobile number');
        return;
      }

      if (response.status === 400) {
        setMobileError(data.message || 'Invalid mobile number');
        return;
      }

      if (response.status === 429) {
        setMobileError(data.message || 'Too many OTP requests');
        return;
      }

      // If mobile number is valid and OTP is generated
      if (data.otp) {
        alert(`Your OTP for password reset is: ${data.otp}`);

        if (data.otpsRemaining === 1) {
          alert('Warning: This is your last available OTP. After this, you will need to wait before requesting more OTPs.');
        }

        setShowOTPModal(true);
        setHideForgotPasswordModal(true);
      } else {
        setMobileError(data.message || 'OTP generation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Error: ${errorMessage}`);
      setMobileError('Network error occurred');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleForgotPassword(e);
    }
  };

  const closeOTPModal = () => {
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {!hideForgotPasswordModal && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-content">
            <button className="close-button" onClick={onClose}>
              &times;
            </button>
            <h2>Forgot Password</h2>
            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label htmlFor="mobileNumber">Mobile Number</label>
                <input
                  type="tel"
                  id="mobileNumber"
                  placeholder="Enter your registered mobile number"
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  onKeyDown={handleKeyDown}
                  onKeyPress={handleKeyPress}
                  maxLength={10}
                />
                {mobileError && <div className="error-message">{mobileError}</div>}
                <div className="mobile-requirements">
                  Please enter your registered 10-digit Indian mobile number.
                </div>
              </div>
              <button
                type="submit"
                className="login-button"
              >
                Send OTP
              </button>
            </form>
            <p className="create-account-link">
              Remember your password? <a href="#" onClick={onSwitchToLogin}>Login</a>
            </p>
          </div>
        </div>
      )}
      {showOTPModal && (
        <ForgotPasswordOTP
          onClose={closeOTPModal}
          mobileNumber={mobileNumber}
        />
      )}
    </>
  );
};

export default ForgotPasswordInput;