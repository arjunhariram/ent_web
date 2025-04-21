const validatePassword = (req, res, next) => {
    const { password, confirmPassword, currentPassword, newPassword } = req.body;
    
    const passwordToValidate = newPassword || password;
    const confirmPasswordToCheck = confirmPassword;
    
    if (!passwordToValidate) {
        return res.status(400).json({
            isValid: false,
            message: 'Password is required'
        });
    }
    
    if (passwordToValidate.length < 8) {
        return res.status(400).json({
            isValid: false,
            message: 'Password must be at least 8 characters long'
        });
    }

    if (!/[A-Z]/.test(passwordToValidate)) {
        return res.status(400).json({
            isValid: false,
            message: 'Password must contain at least one uppercase letter'
        });
    }

    if (!/[0-9]/.test(passwordToValidate)) {
        return res.status(400).json({
            isValid: false,
            message: 'Password must contain at least one number'
        });
    }
    
    if (newPassword && !currentPassword) {
        return res.status(400).json({
            isValid: false,
            message: 'Current password is required'
        });
    }
    
    if (newPassword && currentPassword && newPassword === currentPassword) {
        return res.status(400).json({
            isValid: false,
            message: 'New password must be different from current password'
        });
    }
    
    if (confirmPasswordToCheck !== undefined && passwordToValidate !== confirmPasswordToCheck) {
        return res.status(400).json({
            isValid: false,
            message: 'Passwords do not match'
        });
    }
    
    next();
};

export default validatePassword;
