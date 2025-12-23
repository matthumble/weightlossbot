/**
 * Handle 'baseline' DM command
 */

const sheets = require('../services/sheets');
const { parseWeight, getTodayDate } = require('../utils/validation');

/**
 * Handle baseline command
 * @param {Object} event - Slack message event
 * @param {Object} client - Slack WebClient
 */
async function handleBaseline(event, client) {
  const userId = event.user;
  const text = event.text || '';

  try {
    // Parse weight from message
    const weight = parseWeight(text);

    if (!weight) {
      // Check if it's a format issue or range issue
      const weightMatch = text.match(/(\d+\.?\d*)\s*lbs?/i);
      if (weightMatch) {
        const parsed = parseFloat(weightMatch[1]);
        if (parsed < 100) {
          await client.chat.postMessage({
            channel: userId,
            text: "❌ Weight must be at least 100lbs. Please enter a valid weight.",
          });
        } else if (parsed > 1000) {
          await client.chat.postMessage({
            channel: userId,
            text: "❌ Weight must be 1000lbs or less. Please enter a valid weight.",
          });
        } else {
          await client.chat.postMessage({
            channel: userId,
            text: "❌ Invalid format. Please use: `baseline 200lbs`\nExample: `baseline 200lbs`",
          });
        }
      } else {
        await client.chat.postMessage({
          channel: userId,
          text: "❌ Invalid format. Please use: `baseline 200lbs`\nExample: `baseline 200lbs`",
        });
      }
      return;
    }

    // Get user info
    const userInfo = await client.users.info({ user: userId });
    const username = userInfo.user.name;

    // Check if user already has a baseline
    const existingUser = await sheets.getUserData(userId);
    if (existingUser && existingUser.baselineWeight !== null) {
      await client.chat.postMessage({
        channel: userId,
        text: `❌ You already have a baseline weight set: ${existingUser.baselineWeight}lbs (set on ${existingUser.baselineDate}).\nTo update your baseline, contact an admin to reset the challenge.`,
      });
      return;
    }

    // Set baseline
    const today = getTodayDate();
    await sheets.setBaseline(userId, username, weight, today);

    await client.chat.postMessage({
      channel: userId,
      text: `✅ Baseline weight set: ${weight}lbs\nDate: ${today}\n\nYou can now log checkins using: \`checkin 185lbs\``,
    });
  } catch (error) {
    console.error('Error handling baseline command:', error);
    
    let errorMessage = "❌ An error occurred while setting your baseline. Please try again.";
    if (error.message === 'User already has a baseline weight set') {
      errorMessage = `❌ ${error.message}`;
    }

    await client.chat.postMessage({
      channel: userId,
      text: errorMessage,
    });
  }
}

module.exports = {
  handleBaseline
};

