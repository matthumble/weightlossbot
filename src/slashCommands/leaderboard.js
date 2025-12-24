/**
 * Handle /leaderboard slash command
 */

const sheets = require('../services/sheets');
const { formatLeaderboardEntry, formatLeaderboardEntryWithMode, formatChallengeStatus } = require('../utils/messages');
const { daysBetween, getTodayDate } = require('../utils/validation');

/**
 * Handle leaderboard command
 * @param {Object} ack - Slack ack function
 * @param {Object} respond - Slack respond function
 * @param {Object} client - Slack WebClient
 */
async function handleLeaderboard(ack, respond, client) {
  await ack();

  try {
    const fitnessChannel = process.env.FITNESS_CHANNEL;
    if (!fitnessChannel) {
      await respond({
        response_type: 'ephemeral',
        text: "❌ FITNESS_CHANNEL environment variable not configured.",
      });
      return;
    }

    // Get competition mode
    const mode = await sheets.getCompetitionMode();

    // Get all users
    const users = await sheets.getAllUsers();

    if (users.length === 0) {
      await client.chat.postMessage({
        channel: fitnessChannel,
        text: "📊 *Weight Loss Challenge Leaderboard*\n\nNo participants yet. Set your baseline weight to get started!",
      });
      await respond({
        response_type: 'ephemeral',
        text: "✅ Leaderboard posted to #fitness-channel",
      });
      return;
    }

    // Calculate weight loss for each user (baseline vs latest checkin)
    const leaderboard = [];
    
    for (const user of users) {
      // Ensure baselineWeight is a number
      const baselineWeight = typeof user.baselineWeight === 'number' 
        ? user.baselineWeight 
        : parseFloat(user.baselineWeight);
      
      if (isNaN(baselineWeight) || baselineWeight <= 0) {
        console.error('Invalid baseline weight for user:', user.username, user.baselineWeight);
        continue;
      }

      let currentWeight = baselineWeight;
      
      // Get latest checkin if exists
      if (user.checkins && user.checkins.length > 0) {
        // Ensure weights are numbers and sort by date (newest first)
        const sortedCheckins = [...user.checkins]
          .map(checkin => ({
            weight: typeof checkin.weight === 'number' ? checkin.weight : parseFloat(checkin.weight),
            date: checkin.date
          }))
          .filter(checkin => !isNaN(checkin.weight))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (sortedCheckins.length > 0) {
          currentWeight = sortedCheckins[0].weight;
        }
      }

      const weightLost = baselineWeight - currentWeight;
      
      // Calculate metric based on mode
      let metric;
      if (mode === 'percentage') {
        // Percentage: ((baseline - current) / baseline) * 100
        metric = baselineWeight > 0 ? (weightLost / baselineWeight) * 100 : 0;
      } else {
        // Total mode: use weight lost in pounds
        metric = weightLost;
      }
      
      leaderboard.push({
        username: user.username,
        baselineWeight: baselineWeight,
        currentWeight: currentWeight,
        weightLost: weightLost,
        metric: metric, // The metric used for sorting
      });
    }

    // Sort by metric (descending)
    leaderboard.sort((a, b) => b.metric - a.metric);

    // Get top 5
    const top5 = leaderboard.slice(0, 5);

    // Format message
    let message = "📊 *Weight Loss Challenge Leaderboard*\n\n";
    
    // Add deadline info if set
    const deadline = await sheets.getDeadline();
    if (deadline) {
      const today = getTodayDate();
      const daysLeft = daysBetween(today, deadline);
      const statusLine = formatChallengeStatus(deadline, daysLeft);
      message += `${statusLine}\n\n`;
    }

    if (top5.length === 0) {
      message += "No results yet.";
    } else {
      top5.forEach((entry, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        message += `${medal} ${formatLeaderboardEntryWithMode(entry.username, entry.weightLost, entry.baselineWeight, entry.currentWeight, mode)}\n`;
      });
    }

    message += `\n_Use \`baseline [weight]lbs\` to set your starting weight, and \`checkin [weight]lbs\` to log your progress!_`;

    await client.chat.postMessage({
      channel: fitnessChannel,
      text: message,
    });

    await respond({
      response_type: 'ephemeral',
      text: "✅ Leaderboard posted to #fitness-channel",
    });
  } catch (error) {
    console.error('Error handling leaderboard command:', error);
    await respond({
      response_type: 'ephemeral',
      text: "❌ An error occurred while generating the leaderboard. Please try again.",
    });
  }
}

module.exports = {
  handleLeaderboard
};

