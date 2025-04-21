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
        <button className="dropdown-signout" onClick={onSignOut}>
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
