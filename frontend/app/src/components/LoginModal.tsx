import React, { useState } from 'react';
import '../styles/login_modal.css';
import CreateAccount from './CreateAccount';

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const switchToCreateAccount = () => {
    setShowCreateAccount(true);
  };

  const switchToLogin = () => {
    setShowCreateAccount(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobile) {
      setError('Please enter your mobile number');
      return;
    }
    
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      onClose();
      window.location.reload();
      
    } catch (error: any) {
      setError(error?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showCreateAccount) {
    return (
      <CreateAccount
        onClose={onClose}
        onSwitchToLogin={switchToLogin}
      />
    );
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          {error && <div className="login-error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="mobile">Mobile Number</label>
            <input 
              type="text" 
              id="mobile" 
              placeholder="Enter your mobile number" 
              className="login-input login-input-mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              placeholder="Enter your password" 
              className="login-input login-input-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className={`login-button login-button-unique ${isLoading ? 'disabled-button' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="create-account-link">
          Don't have an account? <a href="#" onClick={switchToCreateAccount}>Create Account</a>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
