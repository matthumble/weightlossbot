/**
 * Message formatting utilities
 */

/**
 * Format leaderboard entry
 * @param {string} username - User's Slack username
 * @param {number} weightLost - Total weight lost in pounds
 * @param {number} baselineWeight - Starting weight
 * @param {number} currentWeight - Current weight
 * @returns {string} - Formatted leaderboard entry
 */
function formatLeaderboardEntry(username, weightLost, baselineWeight, currentWeight) {
  const lostDisplay = weightLost > 0 
    ? `-${weightLost.toFixed(1)}lbs` 
    : `+${Math.abs(weightLost).toFixed(1)}lbs`;
  
  return `@${username}: ${lostDisplay} (${baselineWeight}→${currentWeight})`;
}

/**
 * Format challenge status message
 * @param {string} deadline - Deadline date (YYYY-MM-DD)
 * @param {number} daysLeft - Days remaining
 * @returns {string} - Formatted status message
 */
function formatChallengeStatus(deadline, daysLeft) {
  if (!deadline) {
    return "No deadline set for this challenge.";
  }

  if (daysLeft < 0) {
    return `Challenge ended on ${deadline}. (${Math.abs(daysLeft)} days ago)`;
  } else if (daysLeft === 0) {
    return `Challenge ends today (${deadline})!`;
  } else {
    return `Challenge deadline: ${deadline}\nDays remaining: ${daysLeft}`;
  }
}

module.exports = {
  formatLeaderboardEntry,
  formatChallengeStatus
};


