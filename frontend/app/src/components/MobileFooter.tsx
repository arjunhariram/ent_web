import React from 'react';
import '../styles/mobilefooter.css';

const MobileFooter: React.FC = () => {
  return (
    <footer className="mobile-footer">
      <div className="mobile-footer-content">
        <p>&copy; 2025 Entproject - All Rights Reserved</p>
        <p>
          <a href="#">About Us</a> | 
          <a href="#">Privacy Policy</a> | 
          <a href="#">Terms</a>
        </p>
        <div className="mobile-social-icons">
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <img src="/assets/twitter-logo.svg" alt="Twitter" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <img src="/assets/instagram-logo.svg" alt="Instagram" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default MobileFooter;
