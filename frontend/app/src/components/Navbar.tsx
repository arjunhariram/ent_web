import React, { useState, useEffect } from 'react';
import LoginModal from './LoginModal';
import ProfileDropdown from './ProfileDropdown';
import ChangePasswordModal from './ChangePasswordModal';
import '../styles/navbar.css';
import logo from '../assets/tsconfig.app.png'; // Assuming the logo is placed in src/assets

const Navbar: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleDropdownToggle = () => {
    if (isAuthenticated) {
      setDropdownOpen(!isDropdownOpen);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleOutsideClick = (event: MouseEvent) => {
    const dropdown = document.querySelector('.profile-dropdown');
    const profileButton = document.querySelector('#profileBtn');
    if (
      dropdown &&
      profileButton &&
      !dropdown.contains(event.target as Node) &&
      !profileButton.contains(event.target as Node)
    ) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (isDropdownOpen) {
      document.addEventListener('click', handleOutsideClick);
    } else {
      document.removeEventListener('click', handleOutsideClick);
    }
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isDropdownOpen]);

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };
  const handlePastPurchases = () => console.log('Past Purchases clicked');
  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setDropdownOpen(false);
  };

  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    setShowChangePasswordModal(false);
  };

  return (
    <>
      <nav className="navbar">
        <img src={logo} alt="Entproject Logo" className="navbar-logo" />
        <div className="navbar-buttons">
          {isAuthenticated && (
            <button className="request-button">
              Request
            </button>
          )}
          <div style={{ position: 'relative' }}>
            <button id="profileBtn" className="profile-button" onClick={handleDropdownToggle}>
              <img
                src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png"
                alt="Profile Icon"
                width="24"
                height="24"
              />
            </button>
            {isDropdownOpen && isAuthenticated && (
              <ProfileDropdown
                onChangePassword={handleChangePassword}
                onPastPurchases={handlePastPurchases}
                onSignOut={handleSignOut}
              />
            )}
          </div>
        </div>
      </nav>
      {isModalOpen && <LoginModal onClose={closeModal} />}
      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={closeChangePasswordModal}
          showConfirmation={showConfirmation}
          onConfirmationClose={handleConfirmationClose}
          setShowConfirmation={setShowConfirmation}
        />
      )}
    </>
  );
};

export default Navbar;
