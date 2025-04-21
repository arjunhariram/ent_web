import React, { useEffect } from 'react';

const AuthStateDebugger: React.FC = () => {
  useEffect(() => {
    const logAuthState = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      console.group('Auth State Debug');
      console.log('Token exists:', !!token);
      console.log('User data:', user ? JSON.parse(user) : null);
      console.groupEnd();
    };

    logAuthState();
    window.addEventListener('storage', logAuthState);
    return () => window.removeEventListener('storage', logAuthState);
  }, []);

  return null;
};

export default AuthStateDebugger;
