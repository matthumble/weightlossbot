/**
 * Handle 'checkin' DM command
 */

const sheets = require('../services/sheets');
const { parseWeight, getTodayDate } = require('../utils/validation');

/**
 * Handle checkin command
 * @param {Object} event - Slack message event
 * @param {Object} client - Slack WebClient
 */
async function handleCheckin(event, client) {
  const userId = event.user;
  const text = event.text || '';

  try {
    // Check deadline
    const deadline = await sheets.getDeadline();
    const today = getTodayDate();

    if (deadline && today > deadline) {
      await client.chat.postMessage({
        channel: userId,
        text: `❌ The challenge deadline has passed (${deadline}). Checkins are no longer accepted.`,
      });
      return;
    }

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
            text: "❌ Invalid format. Please use: `checkin 185lbs`\nExample: `checkin 185lbs`",
          });
        }
      } else {
        await client.chat.postMessage({
          channel: userId,
          text: "❌ Invalid format. Please use: `checkin 185lbs`\nExample: `checkin 185lbs`",
        });
      }
      return;
    }

    // Get user data to check baseline exists
    const userData = await sheets.getUserData(userId);
    if (!userData || !userData.baselineWeight) {
      await client.chat.postMessage({
        channel: userId,
        text: "❌ No baseline weight found. Please set your baseline first using: `baseline 200lbs`",
      });
      return;
    }

    // Add checkin
    await sheets.addCheckin(userId, weight, today);

    // Get updated user data to calculate stats
    const updatedUserData = await sheets.getUserData(userId);
    
    // Calculate total lost: baseline - latest checkin weight (current checkin is the latest)
    const totalLost = updatedUserData.baselineWeight - weight;
    const checkinCount = updatedUserData.checkins.length;

    let message = `✅ Checkin recorded!\n\n`;
    message += `Current weight: ${weight}lbs\n`;
    message += `Total lost: ${totalLost >= 0 ? '-' : '+'}${Math.abs(totalLost).toFixed(1)}lbs\n`;
    message += `Baseline: ${updatedUserData.baselineWeight}lbs\n`;
    message += `Total checkins: ${checkinCount}`;

    if (deadline) {
      const daysLeft = Math.ceil((new Date(deadline) - new Date(today)) / (1000 * 60 * 60 * 24));
      if (daysLeft >= 0) {
        message += `\nDays until deadline: ${daysLeft}`;
      }
    }

    await client.chat.postMessage({
      channel: userId,
      text: message,
    });
  } catch (error) {
    console.error('Error handling checkin command:', error);
    
    let errorMessage = "❌ An error occurred while recording your checkin. Please try again.";
    if (error.message.includes('not found') || error.message.includes('baseline')) {
      errorMessage = `❌ ${error.message}`;
    }

    await client.chat.postMessage({
      channel: userId,
      text: errorMessage,
    });
  }
}

module.exports = {
  handleCheckin
};

