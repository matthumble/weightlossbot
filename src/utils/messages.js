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
 * Format leaderboard entry with mode awareness
 * @param {string} username - User's Slack username
 * @param {number} weightLost - Total weight lost in pounds
 * @param {number} baselineWeight - Starting weight
 * @param {number} currentWeight - Current weight
 * @param {string} mode - Competition mode: "total" or "percentage"
 * @returns {string} - Formatted leaderboard entry
 */
function formatLeaderboardEntryWithMode(username, weightLost, baselineWeight, currentWeight, mode) {
  if (mode === 'percentage') {
    // Calculate percentage: ((baseline - current) / baseline) * 100
    const percentageLost = baselineWeight > 0 
      ? ((weightLost / baselineWeight) * 100)
      : 0;
    
    const percentageDisplay = percentageLost > 0
      ? `-${percentageLost.toFixed(2)}%`
      : `+${Math.abs(percentageLost).toFixed(2)}%`;
    
    return `@${username}: ${percentageDisplay} (${baselineWeight}→${currentWeight})`;
  } else {
    // Default to total mode
    return formatLeaderboardEntry(username, weightLost, baselineWeight, currentWeight);
  }
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
  formatLeaderboardEntryWithMode,
  formatChallengeStatus
};


