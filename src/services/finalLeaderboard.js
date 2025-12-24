/**
 * Final leaderboard celebration service
 * Sends a final celebration leaderboard the day after challenge ends
 */

const sheets = require('./sheets');
const { formatLeaderboardEntry, formatLeaderboardEntryWithMode } = require('../utils/messages');
const { getTodayDate } = require('../utils/validation');

/**
 * Check if we should send the final leaderboard today
 * @returns {boolean} - True if challenge ended yesterday and we haven't sent it yet
 */
async function shouldSendFinalLeaderboard() {
  try {
    const deadline = await sheets.getDeadline();
    if (!deadline) {
      return false; // No deadline set
    }

    const today = getTodayDate();
    const deadlineDate = new Date(deadline);
    const todayDate = new Date(today);
    
    // Calculate yesterday's date
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    
    // Check if deadline was yesterday
    if (deadlineDate.toDateString() !== yesterdayDate.toDateString()) {
      return false; // Deadline wasn't yesterday
    }

    // Check if we've already sent the final leaderboard
    const finalLeaderboardSent = await sheets.getConfigValue('final_leaderboard_sent');
    if (finalLeaderboardSent === 'true') {
      return false; // Already sent
    }

    return true;
  } catch (error) {
    console.error('Error checking if should send final leaderboard:', error);
    return false;
  }
}

/**
 * Generate and send the final celebration leaderboard
 * @param {Object} client - Slack WebClient
 */
async function sendFinalLeaderboard(client) {
  try {
    const fitnessChannel = process.env.FITNESS_CHANNEL;
    if (!fitnessChannel) {
      console.error('FITNESS_CHANNEL not configured');
      return;
    }

    // Get competition mode
    const mode = await sheets.getCompetitionMode();

    // Get all users
    const users = await sheets.getAllUsers();

    if (users.length === 0) {
      await client.chat.postMessage({
        channel: fitnessChannel,
        text: "🎉 *Challenge Complete!*\n\nNo participants in this challenge.",
      });
      // Mark as sent even if no participants
      await sheets.setConfigValue('final_leaderboard_sent', 'true');
      return;
    }

    // Calculate weight loss for each user (baseline vs latest checkin)
    const leaderboard = [];
    
    for (const user of users) {
      const baselineWeight = typeof user.baselineWeight === 'number' 
        ? user.baselineWeight 
        : parseFloat(user.baselineWeight);
      
      if (isNaN(baselineWeight) || baselineWeight <= 0) {
        continue;
      }

      let currentWeight = baselineWeight;
      
      // Get latest checkin if exists
      if (user.checkins && user.checkins.length > 0) {
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

    // Get deadline for the message
    const deadline = await sheets.getDeadline();

    // Format celebration message
    let message = "🎉 *Challenge Complete! Final Results*\n\n";
    
    if (deadline) {
      message += `Challenge ended on ${deadline}\n\n`;
    }

    if (leaderboard.length === 0) {
      message += "No results to display.";
    } else {
      // Show all participants (not just top 5)
      leaderboard.forEach((entry, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        message += `${medal} ${formatLeaderboardEntryWithMode(entry.username, entry.weightLost, entry.baselineWeight, entry.currentWeight, mode)}\n`;
      });
    }

    message += `\n🎊 _Congratulations to everyone who participated! Great job on your progress!_`;

    await client.chat.postMessage({
      channel: fitnessChannel,
      text: message,
    });

    // Mark as sent
    await sheets.setConfigValue('final_leaderboard_sent', 'true');
    
    console.log('✅ Final leaderboard sent successfully');
  } catch (error) {
    console.error('Error sending final leaderboard:', error);
  }
}

module.exports = {
  shouldSendFinalLeaderboard,
  sendFinalLeaderboard,
};

