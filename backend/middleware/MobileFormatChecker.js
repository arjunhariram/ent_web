export const isValidIndianMobileNumber = (mobileNumber) => {
  // Remove spaces, dashes, and other non-numeric characters
  const cleanNumber = mobileNumber.replace(/\s+/g, '').replace(/[-()+]/g, '');

  // Check if the number is exactly 10 digits and starts with 6-9
  if (cleanNumber.length === 10 && /^[6-9]\d{9}$/.test(cleanNumber)) {
    return true;
  }

  return false;
};
