/**
 * Handle /reset-challenge slash command (admin-only)
 */

const sheets = require('../services/sheets');
const { isAdmin } = require('../utils/admin');

/**
 * Handle reset-challenge command
 * @param {Object} ack - Slack ack function
 * @param {Object} respond - Slack respond function
 * @param {Object} body - Slack command body
 * @param {Object} client - Slack WebClient
 */
async function handleResetChallenge(ack, respond, body, client) {
  await ack();

  const userId = body.user_id;

  try {
    // Check if user is admin
    if (!isAdmin(userId)) {
      await respond({
        response_type: 'ephemeral',
        text: "❌ Unauthorized. This command is admin-only.",
      });
      return;
    }

    const fitnessChannel = process.env.FITNESS_CHANNEL;
    if (!fitnessChannel) {
      await respond({
        response_type: 'ephemeral',
        text: "❌ FITNESS_CHANNEL environment variable not configured.",
      });
      return;
    }

    // Reset challenge
    await sheets.resetChallenge();
    
    // Reset final leaderboard sent flag
    await sheets.setConfigValue('final_leaderboard_sent', 'false');

    // Announce in fitness channel
    await client.chat.postMessage({
      channel: fitnessChannel,
      text: "🔄 *Challenge Reset*\n\nThe challenge has been reset. All participant data has been cleared. Participants can now set new baseline weights to start fresh!",
    });

    await respond({
      response_type: 'ephemeral',
      text: "✅ Challenge reset successfully. Announcement posted to #fitness-channel",
    });
  } catch (error) {
    console.error('Error handling reset-challenge command:', error);
    await respond({
      response_type: 'ephemeral',
      text: "❌ An error occurred while resetting the challenge. Please try again.",
    });
  }
}

module.exports = {
  handleResetChallenge
};


