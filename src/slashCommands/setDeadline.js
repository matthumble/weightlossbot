/**
 * Handle /set-deadline slash command (admin-only)
 */

const sheets = require('../services/sheets');
const { isAdmin } = require('../utils/admin');
const { validateDateFormat } = require('../utils/validation');

/**
 * Handle set-deadline command
 * @param {Object} ack - Slack ack function
 * @param {Object} respond - Slack respond function
 * @param {Object} body - Slack command body
 */
async function handleSetDeadline(ack, respond, body) {
  await ack();

  const userId = body.user_id;
  const deadlineStr = body.text ? body.text.trim() : '';

  try {
    // Check if user is admin
    if (!isAdmin(userId)) {
      await respond({
        response_type: 'ephemeral',
        text: "❌ Unauthorized. This command is admin-only.",
      });
      return;
    }

    // Validate date format
    if (!deadlineStr) {
      await respond({
        response_type: 'ephemeral',
        text: "❌ Please provide a date. Use YYYY-MM-DD format.\nExample: `/set-deadline 2024-12-31`",
      });
      return;
    }

    if (!validateDateFormat(deadlineStr)) {
      await respond({
        response_type: 'ephemeral',
        text: `❌ Invalid date format: "${deadlineStr}"\nPlease use YYYY-MM-DD format (e.g., 2024-12-31).\nExample: \`/set-deadline 2024-12-31\``,
      });
      return;
    }

    // Set deadline
    await sheets.setDeadline(deadlineStr);

    await respond({
      response_type: 'ephemeral',
      text: `✅ Challenge deadline set to ${deadlineStr}`,
    });
  } catch (error) {
    console.error('Error handling set-deadline command:', error);
    await respond({
      response_type: 'ephemeral',
      text: "❌ An error occurred while setting the deadline. Please try again.",
    });
  }
}

module.exports = {
  handleSetDeadline
};

