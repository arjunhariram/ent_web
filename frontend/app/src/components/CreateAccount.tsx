import React, { useState, KeyboardEvent } from 'react';
import '../styles/login_modal.css';
import OTPModal from './OTPModal';

interface CreateAccountProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const CreateAccount: React.FC<CreateAccountProps> = ({ onClose, onSwitchToLogin }) => {
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [hideCreateAccountModal, setHideCreateAccountModal] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileError, setMobileError] = useState('');


  const validateIndianMobileNumber = (number: string): { isValid: boolean; message: string } => {

    const cleanNumber = number.replace(/\s+/g, '').replace(/[-()+]/g, '');


    if (cleanNumber.length !== 10) {
      return {
        isValid: false,
        message: 'Mobile number must be exactly 10 digits'
      };
    }


    if (!/^[6-9]/.test(cleanNumber)) {
      return {
        isValid: false,
        message: 'Invalid mobile number.'
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

  const handleCreateAccount = async (e: React.MouseEvent | React.FormEvent) => {
    if (e.preventDefault) e.preventDefault();
    console.log('Create Account button clicked!');

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

      // Check if mobile number already exists
      const checkResponse = await fetch('http://localhost:4000/api/user/check-mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber })
      }).catch(fetchError => {
        throw fetchError;
      });

      const checkData = await checkResponse.json();
      
      if (checkData.exists) {
        setMobileError('This mobile number is already registered. Please login instead.');
        return;
      }

      // If mobile number doesn't exist, proceed with OTP validation
      const response = await fetch('http://localhost:4000/api/validate/validate-mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber })
      }).catch(fetchError => {
        throw fetchError;
      });

      const data = await response.json();

      if (data.isValid) {

        if (data.otp) {
          alert(`Your OTP for verification is: ${data.otp}`);
        }


        if (data.otpsRemaining === 1) {
          alert('Warning: This is your last available OTP. After this, you will need to wait 4 hours before requesting more OTPs.');
        }

        setShowOTPModal(true);
        setHideCreateAccountModal(true);
      } else {
        setMobileError(data.message || 'Validation failed');
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
      handleCreateAccount(e);
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
      {!hideCreateAccountModal && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-content">
            <button className="close-button" onClick={onClose}>
              &times;
            </button>
            <h2>Create Account</h2>
            <form onSubmit={handleCreateAccount}>
              <div className="form-group">
                <label htmlFor="newMobile">Mobile Number</label>
                <input
                  type="tel"
                  id="newMobile"
                  placeholder="Enter your mobile number"
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  onKeyDown={handleKeyDown}
                  onKeyPress={handleKeyPress}
                  maxLength={10}
                />
                {mobileError && <div className="error-message">{mobileError}</div>}
                <div className="mobile-requirements">
                  Please enter a valid 10-digit Indian mobile number.
                </div>
              </div>
              <button
                type="submit"
                className="login-button"
              >
                Create Account
              </button>
            </form>
            <p className="create-account-link">
              Already have an account? <a href="#" onClick={onSwitchToLogin}>Login</a>
            </p>
          </div>
        </div>
      )}
      {showOTPModal && (
        <OTPModal
          onClose={closeOTPModal}
          mobileNumber={mobileNumber}
        />
      )}
    </>
  );
};

export default CreateAccount;
