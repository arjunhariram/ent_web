import React, { useState } from 'react';
import '../styles/profile_dropdown.css';
import ChangePasswordModal from './ChangePasswordModal';
import InvoiceModal from './InvoiceModal';

interface ProfileDropdownProps {
  onChangePassword: () => void;
  onPastPurchases: () => void;
  onSignOut: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onChangePassword, onPastPurchases, onSignOut }) => {
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const handleCloseChangePasswordModal = () => {
    setShowChangePasswordModal(false);
  };

  const handleCloseInvoiceModal = () => {
    setShowInvoiceModal(false);
  };

  const handleSignOut = async () => {
    const token = localStorage.getItem('authToken'); // Or however your token is stored
    if (token) {
      try {
        const response = await fetch('/api/auth/signout', { // Ensure this matches your backend route
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          console.log('Successfully signed out from server.');
        } else {
          const errorData = await response.json();
          console.error('Sign out failed on server:', errorData.message || response.statusText);
          // Optionally, inform the user about the server-side sign-out failure
        }
      } catch (error) {
        console.error('Error during server sign out:', error);
        // Optionally, inform the user about the network error
      }
    }
    // Always call the onSignOut prop to perform client-side cleanup (e.g., remove token, redirect)
    // regardless of server response, to ensure user is logged out client-side.
    onSignOut();
  };

  return (
    <>
      <div className="profile-dropdown">
        <div
          className="dropdown-option"
          onClick={() => {
            setShowChangePasswordModal(true);
            onChangePassword();
          }}
        >
          Change Password
        </div>
        <div
          className="dropdown-option"
          onClick={() => {
            setShowInvoiceModal(true);
            onPastPurchases();
          }}
        >
          Past Purchases
        </div>
        <button className="dropdown-signout" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>
      {showChangePasswordModal && (
        <ChangePasswordModal 
          onClose={handleCloseChangePasswordModal} 
          showConfirmation={false} 
          onConfirmationClose={() => {}} 
          setShowConfirmation={() => {}} 
        />
      )}
      {showInvoiceModal && (
        <InvoiceModal onClose={handleCloseInvoiceModal} />
      )}
    </>
  );
};

export default ProfileDropdown;
