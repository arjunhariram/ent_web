import React, { useState, useEffect } from 'react';
import '../styles/login_modal.css';
import PasswordModal from './PasswordModal';

interface OTPModalProps {
  onClose: () => void;
  mobileNumber: string;
}

const OTPModal: React.FC<OTPModalProps> = ({ onClose, mobileNumber }) => {
  const [otp, setOtp] = useState<string[]>(Array(5).fill(""));
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [hideOTPModal, setHideOTPModal] = useState(false);
  const [isOtpComplete, setIsOtpComplete] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [resendAttemptsLeft, setResendAttemptsLeft] = useState(2); // Start with 2 because initial send counts as 1

  useEffect(() => {
    setIsOtpComplete(otp.every(digit => digit !== ""));
  }, [otp]);

  useEffect(() => {
    let timer: number | null = null;

    if (resendCountdown > 0 && resendDisabled) {
      timer = window.setTimeout(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
    } else if (resendCountdown === 0) {
      setResendDisabled(false);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [resendCountdown, resendDisabled]);

  const handleChange = (value: string, index: number) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 4) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleResendClick = async () => {
    if (resendDisabled || resendAttemptsLeft <= 0) return;

    try {
      setVerificationError(null);
      const response = await fetch('http://localhost:4000/api/user/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobileNumber })
      });

      const data = await response.json();

      if (data.isValid) {
        setOtp(Array(5).fill(""));

        if (data.otp) {
          alert(`Your new OTP is: ${data.otp}`);
        }

        // Calculate new attempts value first
        const newAttemptsLeft = resendAttemptsLeft - 1;
        setResendAttemptsLeft(newAttemptsLeft);
        
        // Only reset countdown if there are attempts remaining
        if (newAttemptsLeft > 0) {
          setResendCountdown(60);
          setResendDisabled(true);
        }
      } else {
        if (data.timeRemaining) {
          setResendCountdown(data.timeRemaining);
        }
        setVerificationError(data.message || 'Unable to resend OTP');
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      setVerificationError('Network error occurred while resending OTP');
    }
  };

  const handleVerifyClick = async () => {
    if (isOtpComplete) {
      const otpString = otp.join('');

      try {
        const response = await fetch('http://localhost:4000/api/user/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mobileNumber, otp: otpString })
        });

        const data = await response.json();

        if (data.isValid) {
          setVerificationError(null);
          setShowPasswordModal(true);
          setHideOTPModal(true);
        } else {
          setVerificationError(data.message || 'Invalid OTP');
        }
      } catch (error) {
        console.error('OTP verification error:', error);
        setVerificationError('Network error occurred');
      }
    }
  };

  const closePasswordModal = () => {
    onClose();
  };

  return (
    <>
      {!hideOTPModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-button" onClick={onClose}>
              &times;
            </button>
            <h2>Enter OTP</h2>
            <p className="otp-subtitle">
              A 5-digit OTP has been sent to your mobile number
              <br />
              <span className="otp-expiry-note">OTP will expire in 5 minutes</span>
            </p>
            <div className="otp-input-container">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="otp-input otp-input-unique"
                />
              ))}
            </div>
            {verificationError && (
              <div className="error-message">{verificationError}</div>
            )}
            <button
              className={`otpverification-button otpverification-button-unique ${!isOtpComplete ? 'disabled-button' : ''}`}
              onClick={handleVerifyClick}
              disabled={!isOtpComplete}
            >
              Verify Now
            </button>

            <div className="resend-container">
              <button
                className={`resend-button ${resendDisabled || resendAttemptsLeft === 0 ? 'disabled-button' : ''}`}
                onClick={handleResendClick}
                disabled={resendDisabled || resendAttemptsLeft === 0}
              >
                {resendAttemptsLeft > 0 
                  ? (resendDisabled ? `Resend OTP in ${resendCountdown}s` : 'Resend OTP')
                  : 'No more resend attempts'}
              </button>
              {resendAttemptsLeft === 0 && (
                <span className="attempts-left">
                  Maximum resend attempts reached
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      {showPasswordModal && <PasswordModal onClose={closePasswordModal} mobileNumber={mobileNumber} />}
    </>
  );
};

export default OTPModal;
