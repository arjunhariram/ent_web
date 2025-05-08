/**
 * Generates a 5-digit OTP (One Time Password)
 * @returns {string} A 5-digit OTP
 */
export function generateOTP() {
  // Generate a random 5-digit number between 10000 and 99999
  const otp = Math.floor(10000 + Math.random() * 90000).toString();
  return otp;
}
