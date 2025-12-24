/**
 * Handle /start-challenge slash command (admin-only)
 * Opens an interactive modal to configure and start a new competition
 */

const sheets = require('../services/sheets');
const { isAdmin } = require('../utils/admin');
const { validateDateFormat, getTodayDate } = require('../utils/validation');

/**
 * Build the modal view for starting a challenge
 * @returns {Object} - Slack Block Kit modal view
 */
function buildStartChallengeModal() {
  return {
    type: 'modal',
    callback_id: 'start_challenge_modal',
    title: {
      type: 'plain_text',
      text: 'Start Weight Loss Competition'
    },
    submit: {
      type: 'plain_text',
      text: 'Start Competition'
    },
    close: {
      type: 'plain_text',
      text: 'Cancel'
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Configure the competition settings below:'
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'input',
        block_id: 'competition_mode_block',
        label: {
          type: 'plain_text',
          text: 'Competition Mode'
        },
        element: {
          type: 'static_select',
          action_id: 'competition_mode',
          placeholder: {
            type: 'plain_text',
            text: 'Select competition mode'
          },
          initial_option: {
            text: {
              type: 'plain_text',
              text: 'Total Weight Loss (pounds)'
            },
            value: 'total'
          },
          options: [
            {
              text: {
                type: 'plain_text',
                text: 'Total Weight Loss (pounds)'
              },
              value: 'total',
              description: {
                type: 'plain_text',
                text: 'Winner loses most pounds'
              }
            },
            {
              text: {
                type: 'plain_text',
                text: 'Percentage Weight Loss (%)'
              },
              value: 'percentage',
              description: {
                type: 'plain_text',
                text: 'Winner loses highest % of body weight'
              }
            }
          ]
        },
        hint: {
          type: 'plain_text',
          text: 'Total: Winner loses most pounds. Percentage: Winner loses highest % of body weight.'
        }
      },
      {
        type: 'input',
        block_id: 'end_date_block',
        label: {
          type: 'plain_text',
          text: 'End Date'
        },
        element: {
          type: 'datepicker',
          action_id: 'end_date',
          placeholder: {
            type: 'plain_text',
            text: 'Select end date'
          }
        },
        hint: {
          type: 'plain_text',
          text: 'The competition will end on this date'
        }
      }
    ]
  };
}

/**
 * Format the competition start announcement message
 * @param {string} mode - Competition mode: "total" or "percentage"
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {string} - Formatted announcement message
 */
function formatStartAnnouncement(mode, startDate, endDate) {
  const modeDescription = mode === 'percentage' 
    ? 'Percentage Weight Loss (%)'
    : 'Total Weight Loss (pounds)';
  
  const modeExplanation = mode === 'percentage'
    ? 'This competition is based on percentage of body weight lost. This makes it fair for everyone regardless of starting weight! The person who loses the highest percentage of their starting weight wins.'
    : 'This competition is based on total weight lost. The person who loses the most pounds wins!';

  // Calculate duration
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let message = `🎉 *Weight Loss Challenge Started!*\n\n`;
  message += `📅 *Competition Details:*\n`;
  message += `• Start Date: ${startDate}\n`;
  message += `• End Date: ${endDate}\n`;
  message += `• Mode: ${modeDescription}\n`;
  message += `• Duration: ${diffDays} days\n\n`;
  message += `🏆 *How It Works:*\n`;
  message += `${modeExplanation}\n\n`;
  message += `📝 *Getting Started:*\n`;
  message += `1. Set your baseline weight by typing:\n`;
  message += `   \`baseline 200lbs\`\n`;
  message += `   (Replace 200 with your starting weight)\n\n`;
  message += `2. Log your progress by typing:\n`;
  message += `   \`checkin 195lbs\`\n`;
  message += `   (Replace 195 with your current weight)\n\n`;
  message += `3. View the leaderboard anytime:\n`;
  message += `   \`/leaderboard\`\n\n`;
  message += `💡 *Tips:*\n`;
  message += `• You can set your baseline and log checkins in DMs with the bot or in any channel\n`;
  message += `• Check in regularly to track your progress\n`;
  message += `• The leaderboard shows the top 5 participants\n`;
  
  if (mode === 'percentage') {
    message += `• Example: If you start at 200lbs and lose 10lbs, that's 5% weight loss\n`;
  }
  
  message += `\nGood luck everyone! Let's crush our goals! 💪`;

  return message;
}

/**
 * Handle start-challenge command (opens modal)
 * @param {Object} ack - Slack ack function
 * @param {Object} body - Slack command body
 * @param {Object} client - Slack WebClient
 */
async function handleStartChallenge(ack, body, client) {
  await ack();

  const userId = body.user_id;

  try {
    // Check if user is admin
    if (!isAdmin(userId)) {
      await client.views.open({
        trigger_id: body.trigger_id,
        view: {
          type: 'modal',
          title: {
            type: 'plain_text',
            text: 'Access Denied'
          },
          close: {
            type: 'plain_text',
            text: 'Close'
          },
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '❌ *Unauthorized*\n\nThis command is admin-only.'
              }
            }
          ]
        }
      });
      return;
    }

    // Open the modal
    const modal = buildStartChallengeModal();
    console.log('Opening modal with structure:', JSON.stringify(modal, null, 2));
    
    await client.views.open({
      trigger_id: body.trigger_id,
      view: modal
    });
  } catch (error) {
    console.error('Error opening start challenge modal:', error);
    if (error.data && error.data.response_metadata && error.data.response_metadata.messages) {
      console.error('Slack error messages:', error.data.response_metadata.messages);
    }
  }
}

/**
 * Handle modal submission
 * @param {Object} ack - Slack ack function
 * @param {Object} body - Slack view submission body
 * @param {Object} client - Slack WebClient
 */
async function handleStartChallengeSubmit(ack, body, client) {
  const userId = body.user.id;
  const values = body.view.state.values;

  try {
    // Check if user is admin
    if (!isAdmin(userId)) {
      await ack({
        response_action: 'errors',
        errors: {
          competition_mode_block: 'Unauthorized. This command is admin-only.'
        }
      });
      return;
    }

    // Get form values
    const modeSelection = values.competition_mode_block?.competition_mode?.selected_option;
    const endDateValue = values.end_date_block?.end_date?.selected_date;

    // Validate mode
    if (!modeSelection || !modeSelection.value) {
      await ack({
        response_action: 'errors',
        errors: {
          competition_mode_block: 'Please select a competition mode.'
        }
      });
      return;
    }

    const mode = modeSelection.value;
    if (mode !== 'total' && mode !== 'percentage') {
      await ack({
        response_action: 'errors',
        errors: {
          competition_mode_block: 'Invalid competition mode selected.'
        }
      });
      return;
    }

    // Validate end date
    if (!endDateValue) {
      await ack({
        response_action: 'errors',
        errors: {
          end_date_block: 'Please select an end date.'
        }
      });
      return;
    }

    if (!validateDateFormat(endDateValue)) {
      await ack({
        response_action: 'errors',
        errors: {
          end_date_block: 'Invalid date format. Please use YYYY-MM-DD format.'
        }
      });
      return;
    }

    // Check if end date is in the future
    const today = getTodayDate();
    if (endDateValue <= today) {
      await ack({
        response_action: 'errors',
        errors: {
          end_date_block: 'End date must be in the future.'
        }
      });
      return;
    }

    // Check if competition is already active
    const hasActive = await sheets.hasActiveCompetition();
    if (hasActive) {
      await ack({
        response_action: 'errors',
        errors: {
          competition_mode_block: 'A competition is already active with participants. Please use /reset-challenge first to clear existing data.'
        }
      });
      return;
    }

    // Set competition configuration
    const startDate = today;
    await sheets.setCompetitionMode(mode);
    await sheets.setCompetitionStartDate(startDate);
    await sheets.setDeadline(endDateValue);
    await sheets.setConfigValue('final_leaderboard_sent', 'false');

    // Post announcement to fitness channel
    const fitnessChannel = process.env.FITNESS_CHANNEL;
    if (fitnessChannel) {
      const announcement = formatStartAnnouncement(mode, startDate, endDateValue);
      await client.chat.postMessage({
        channel: fitnessChannel,
        text: announcement,
      });
    }

    // Acknowledge submission with success message
    await ack({
      response_action: 'update',
      view: {
        type: 'modal',
        title: {
          type: 'plain_text',
          text: 'Competition Started!'
        },
        close: {
          type: 'plain_text',
          text: 'Close'
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `✅ *Competition started successfully!*\n\n• Mode: ${mode === 'percentage' ? 'Percentage Weight Loss' : 'Total Weight Loss'}\n• Start Date: ${startDate}\n• End Date: ${endDateValue}\n\n${fitnessChannel ? 'Announcement posted to #fitness-channel' : 'Note: FITNESS_CHANNEL not configured, announcement not posted'}`
            }
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error handling start challenge submission:', error);
    await ack({
      response_action: 'errors',
      errors: {
        competition_mode_block: 'An error occurred while starting the competition. Please try again.'
      }
    });
  }
}

module.exports = {
  handleStartChallenge,
  handleStartChallengeSubmit
};

