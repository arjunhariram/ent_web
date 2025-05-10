/**
 * Validate password format
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * 
 * @param {string} password - Password to validate
 * @returns {Object} - Result with success flag, message, and details
 */
export function validatePasswordFormat(password) {
  // Check if password is provided
  if (!password) {
    return {
      success: false,
      message: 'Password is required',
      details: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false
      }
    };
  }

  // Check password length
  const hasMinLength = password.length >= 8;
  
  // Check for uppercase letter
  const hasUppercase = /[A-Z]/.test(password);
  
  // Check for lowercase letter
  const hasLowercase = /[a-z]/.test(password);
  
  // Check for number
  const hasNumber = /[0-9]/.test(password);
  
  // Create details object for client feedback
  const details = {
    length: hasMinLength,
    uppercase: hasUppercase,
    lowercase: hasLowercase,
    number: hasNumber
  };
  
  // Check if all requirements are met
  const isValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;
  
  if (!isValid) {
    let message = 'Please choose a valid password that includes:';
    if (!hasMinLength) message += ' at least 8 characters,';
    if (!hasUppercase) message += ' 1 uppercase letter,';
    if (!hasLowercase) message += ' 1 lowercase letter,';
    if (!hasNumber) message += ' 1 number,';
    
    // Remove trailing comma and add period
    message = message.slice(0, -1) + '.';
    
    return {
      success: false,
      message,
      details
    };
  }
  
  return {
    success: true,
    message: 'Password format is valid',
    details
  };
}

/**
 * Check if passwords match
 * 
 * @param {string} password - Main password
 * @param {string} confirmPassword - Password confirmation
 * @returns {Object} - Result with success flag and message
 */
export function passwordsMatch(password, confirmPassword) {
  console.log('Checking if passwords match');
  
  if (password !== confirmPassword) {
    console.log('Password match validation failed');
    return {
      success: false,
      message: 'Passwords do not match'
    };
  }
  
  console.log('Password match validation successful');
  return {
    success: true,
    message: 'Passwords match'
  };
}
