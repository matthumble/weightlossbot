/**
 * Admin user validation utilities
 */

/**
 * Check if a user ID is in the admin list
 * @param {string} userId - Slack user ID to check
 * @returns {boolean} - True if user is admin
 */
function isAdmin(userId) {
  if (!userId) {
    return false;
  }

  const adminIdsStr = process.env.ADMIN_IDS;
  if (!adminIdsStr) {
    return false;
  }

  // Split by comma and trim whitespace
  const adminIds = adminIdsStr.split(',').map(id => id.trim());
  return adminIds.includes(userId);
}

module.exports = {
  isAdmin
};


