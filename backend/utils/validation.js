/**
 * BalochHunar — Centralized Input Validation & Sanitization Utilities
 */

/**
 * Validates standard email address format
 */
function isEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 150;
}

/**
 * Validates that a value is a valid positive commercial price
 */
function isPositivePrice(value) {
  const num = Number(value);
  return !isNaN(num) && num > 0 && num <= 10000000;
}

/**
 * Validates positive integer database IDs
 */
function isValidId(id) {
  const num = Number(id);
  return Number.isInteger(num) && num > 0;
}

/**
 * Validates string length boundaries
 */
function isValidLength(str, minLength = 1, maxLength = 255) {
  if (typeof str !== 'string') return false;
  const len = str.trim().length;
  return len >= minLength && len <= maxLength;
}

/**
 * Basic string sanitizer to strip harmful control characters
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

module.exports = {
  isEmail,
  isPositivePrice,
  isValidId,
  isValidLength,
  sanitizeString
};
