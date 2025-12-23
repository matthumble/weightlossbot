/**
 * Handle /challenge-status slash command
 */

const sheets = require('../services/sheets');
const { formatChallengeStatus } = require('../utils/messages');
const { daysBetween, getTodayDate } = require('../utils/validation');

/**
 * Handle challenge-status command
 * @param {Object} ack - Slack ack function
 * @param {Object} respond - Slack respond function
 */
async function handleChallengeStatus(ack, respond) {
  await ack();

  try {
    const deadline = await sheets.getDeadline();
    
    if (!deadline) {
      await respond({
        response_type: 'ephemeral',
        text: "📅 *Challenge Status*\n\nNo deadline has been set for this challenge.",
      });
      return;
    }

    const today = getTodayDate();
    const daysLeft = daysBetween(today, deadline);
    const status = formatChallengeStatus(deadline, daysLeft);

    await respond({
      response_type: 'ephemeral',
      text: `📅 *Challenge Status*\n\n${status}`,
    });
  } catch (error) {
    console.error('Error handling challenge-status command:', error);
    await respond({
      response_type: 'ephemeral',
      text: "❌ An error occurred while retrieving challenge status. Please try again.",
    });
  }
}

module.exports = {
  handleChallengeStatus
};

