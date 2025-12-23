/**
 * Weight parsing and validation utilities
 */

/**
 * Parse weight from a message text (e.g., "baseline 200lbs" or "checkin 185lbs")
 * @param {string} text - The message text
 * @returns {number|null} - The weight in pounds, or null if not found/invalid
 */
function parseWeight(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Match pattern like "200lbs", "200 lbs", "200.5lbs", etc.
  const weightRegex = /(\d+\.?\d*)\s*lbs?/i;
  const match = text.match(weightRegex);

  if (!match) {
    return null;
  }

  const weight = parseFloat(match[1]);
  
  // Validate weight is reasonable (between 100 and 1000 lbs)
  if (isNaN(weight)) {
    return null;
  }
  
  if (weight < 100 || weight > 1000) {
    // Return a special value to indicate out of range (we'll handle this in the handlers)
    return null;
  }

  return weight;
}

/**
 * Validate date format YYYY-MM-DD
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} - True if valid format
 */
function validateDateFormat(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return false;
  }

  // Trim whitespace
  const trimmed = dateStr.trim();
  
  // Check format matches YYYY-MM-DD exactly
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(trimmed)) {
    return false;
  }

  // Parse the components
  const parts = trimmed.split('-');
  if (parts.length !== 3) {
    return false;
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  // Validate that parsing worked (not NaN)
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return false;
  }

  // Validate basic ranges
  if (year < 1000 || year > 9999) {
    return false;
  }
  if (month < 1 || month > 12) {
    return false;
  }
  if (day < 1 || day > 31) {
    return false;
  }

  // Use Date object to validate the date is actually valid
  // This will catch invalid dates like 2026-02-30
  const date = new Date(year, month - 1, day);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return false;
  }

  // Verify the date components match (catches invalid dates that got normalized)
  // This ensures dates like 2026-02-30 are rejected (would become 2026-03-01)
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day;
}

/**
 * Format date as YYYY-MM-DD
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date as YYYY-MM-DD
 * @returns {string} - Today's date
 */
function getTodayDate() {
  return formatDate(new Date());
}

/**
 * Calculate days between two dates
 * @param {string} dateStr1 - First date (YYYY-MM-DD)
 * @param {string} dateStr2 - Second date (YYYY-MM-DD)
 * @returns {number} - Number of days
 */
function daysBetween(dateStr1, dateStr2) {
  const date1 = new Date(dateStr1);
  const date2 = new Date(dateStr2);
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

module.exports = {
  parseWeight,
  validateDateFormat,
  formatDate,
  getTodayDate,
  daysBetween
};

