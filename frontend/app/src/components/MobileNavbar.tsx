import React, { useState, useEffect } from 'react';
import LoginModal from './LoginModal';
import ProfileDropdown from './ProfileDropdown';
import '../styles/mobilenavbar.css';

const MobileNavbar: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
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

  const handleProfileClick = () => {
    if (isAuthenticated) {
      setDropdownOpen(!isDropdownOpen);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setDropdownOpen(false);
  };

  return (
    <>
      <nav className="mobile-navbar">
        <div className="mobile-logo-placeholder"></div>
        <button
          id="mobileProfileBtn"
          className="mobile-profile-button"
          onClick={handleProfileClick}
        >
          <img
            src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png"
            alt="Profile Icon"
            width="24"
            height="24"
          />
        </button>
      </nav>
      {isDropdownOpen && isAuthenticated && (
        <ProfileDropdown
          onChangePassword={() => {}}
          onPastPurchases={() => {}}
          onSignOut={handleSignOut}
        />
      )}
      {isModalOpen && !isAuthenticated && <LoginModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
};

export default MobileNavbar;
