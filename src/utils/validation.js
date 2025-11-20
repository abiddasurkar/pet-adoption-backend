import validator from 'validator';

/**
 * Validation utilities for the application
 */
export const validationUtils = {
  /**
   * Validate email format
   */
  validateEmail: (email) => {
    return validator.isEmail(email);
  },

  /**
   * Validate password strength
   */
  validatePassword: (password) => {
    return password && password.length >= 6;
  },

  /**
   * Validate phone number
   */
  validatePhone: (phone) => {
    return !phone || /^\+?[\d\s\-()]+$/.test(phone);
  },

  /**
   * Validate URL
   */
  validateUrl: (url) => {
    return !url || validator.isURL(url);
  },

  /**
   * Validate object ID
   */
  validateObjectId: (id) => {
    return validator.isMongoId(id);
  },

  /**
   * Sanitize input string
   */
  sanitizeString: (str) => {
    return validator.escape(validator.trim(str));
  }
};

export default validationUtils;