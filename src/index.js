/**
 * Main entry point for the Weight Loss Challenge Slack Bot
 */

require('dotenv').config();

const { App } = require('@slack/bolt');
const express = require('express');
const cron = require('node-cron');

// Import command handlers
const { handleBaseline } = require('./commands/baseline');
const { handleCheckin } = require('./commands/checkin');

// Import slash command handlers
const { handleLeaderboard } = require('./slashCommands/leaderboard');
const { handleResetChallenge } = require('./slashCommands/resetChallenge');
const { handleSetDeadline } = require('./slashCommands/setDeadline');
const { handleChallengeStatus } = require('./slashCommands/challengeStatus');
const { handleStartChallenge, handleStartChallengeSubmit } = require('./slashCommands/startChallenge');

// Import final leaderboard service
const { shouldSendFinalLeaderboard, sendFinalLeaderboard } = require('./services/finalLeaderboard');

// Initialize Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG',
});

// Handle Socket Mode state machine errors gracefully (prevents crashes on Render)
// This must be set up before app.start() to catch connection errors
process.on('uncaughtException', (error) => {
  if (!error) {
    console.error('Uncaught Exception: (unknown error)');
    process.exit(1);
    return;
  }

  const errorMessage = error.message || '';
  const errorStack = error.stack || '';
  
  // Check if it's a Socket Mode state machine error - don't crash on these
  const isSocketModeError = (
    errorMessage.includes('Unhandled event') ||
    errorStack.includes('StateMachine') ||
    errorStack.includes('SocketModeClient') ||
    errorStack.includes('finity/lib/core/StateMachine')
  );
  
  if (isSocketModeError) {
    console.error('⚠️ Socket Mode state machine error (non-fatal, will reconnect):', errorMessage);
    // Don't exit - Socket Mode will handle reconnection automatically
    // In Node.js, returning from uncaughtException handler prevents default exit
    return;
  }
  
  // For other uncaught exceptions, log and exit
  console.error('Uncaught Exception:', errorMessage);
  console.error('Stack:', errorStack);
  process.exit(1);
});

// Create Express app for health check endpoint (required by Render.com)
const expressApp = express();

// Health check endpoint for Render.com
expressApp.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Handle DM commands (baseline and checkin)
app.message(async ({ message, client }) => {
  // Only process messages in DMs (channel_type is 'im')
  if (message.channel_type !== 'im' || message.subtype || message.bot_id) {
    return;
  }

  const text = (message.text || '').toLowerCase().trim();

  if (text.startsWith('baseline')) {
    await handleBaseline(message, client);
  } else if (text.startsWith('checkin')) {
    await handleCheckin(message, client);
  }
});

// Register slash commands
app.command('/leaderboard', async ({ ack, respond, client }) => {
  await handleLeaderboard(ack, respond, client);
});

app.command('/reset-challenge', async ({ ack, respond, body, client }) => {
  await handleResetChallenge(ack, respond, body, client);
});

app.command('/set-deadline', async ({ ack, respond, body }) => {
  await handleSetDeadline(ack, respond, body);
});

app.command('/challenge-status', async ({ ack, respond }) => {
  await handleChallengeStatus(ack, respond);
});

app.command('/start-challenge', async ({ ack, body, client }) => {
  await handleStartChallenge(ack, body, client);
});

// Register modal submission handlers
app.view('start_challenge_modal', async ({ ack, body, client }) => {
  await handleStartChallengeSubmit(ack, body, client);
});

// Start the Express server and Bolt app
(async () => {
  const port = process.env.PORT || 3000;
  
  // Check environment variables
  console.log('🔍 Checking configuration...');
  console.log('SLACK_BOT_TOKEN:', process.env.SLACK_BOT_TOKEN ? `Set (${process.env.SLACK_BOT_TOKEN.substring(0, 10)}...)` : '❌ MISSING');
  console.log('SLACK_APP_TOKEN:', process.env.SLACK_APP_TOKEN ? `Set (${process.env.SLACK_APP_TOKEN.substring(0, 10)}...)` : '❌ MISSING');
  
  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_APP_TOKEN) {
    console.error('❌ Missing required tokens! Check your .env file.');
    process.exit(1);
  }
  
  if (!process.env.SLACK_APP_TOKEN.startsWith('xapp-')) {
    console.error('❌ SLACK_APP_TOKEN should start with "xapp-". This should be an App-Level Token from Socket Mode settings.');
    process.exit(1);
  }
  
  if (!process.env.SLACK_BOT_TOKEN.startsWith('xoxb-')) {
    console.error('❌ SLACK_BOT_TOKEN should start with "xoxb-". This should be a Bot User OAuth Token.');
    process.exit(1);
  }
  
  try {
    // Start Express server for health checks
    expressApp.listen(port, () => {
      console.log(`🌐 Health check server running on port ${port}`);
    });
    
    // Start Bolt app (Socket Mode doesn't need port)
    console.log('🔌 Connecting to Slack via Socket Mode...');
    try {
      await app.start();
      console.log(`⚡️ Weight Loss Bot started!`);
      
      // Add Socket Mode error handlers after successful start
      if (app.receiver && app.receiver.client) {
        app.receiver.client.on('error', (error) => {
          console.error('⚠️ Socket Mode client error:', error.message || error);
          // Don't crash - let it try to reconnect
        });

        app.receiver.client.on('close', (code, reason) => {
          console.log(`⚠️ Socket Mode connection closed. Code: ${code}. Will attempt to reconnect.`);
        });
      }
    } catch (error) {
      // If it's a Socket Mode connection error, log but don't exit
      if (error.message && (error.message.includes('StateMachine') || error.message.includes('Unhandled event'))) {
        console.error('⚠️ Socket Mode connection issue (non-fatal):', error.message);
        console.log('Bot will attempt to reconnect automatically...');
        // Don't exit - the error handler above will catch reconnection attempts
      } else {
        throw error; // Re-throw other errors
      }
    }
    
    // Verify connection by testing API access
    try {
      console.log('🔍 Verifying connection...');
      const authTest = await app.client.auth.test();
      console.log('✅ Slack API connection verified!');
      console.log('   Bot User ID:', authTest.user_id);
      console.log('   Bot User Name:', authTest.user);
      console.log('   Team:', authTest.team);
    } catch (error) {
      console.error('❌ Failed to verify Slack API connection:', error.message);
      console.error('   This means Socket Mode is not connected properly.');
      console.error('   Check your SLACK_APP_TOKEN and Socket Mode settings in Slack app configuration.');
    }

    // Schedule final leaderboard check to run daily at 9am
    // Cron format: minute hour day month day-of-week
    // '0 9 * * *' = 9:00 AM every day (uses server's local timezone)
    // Set FINAL_LEADERBOARD_TIMEZONE env var to specify timezone (e.g., 'America/New_York')
    const cronOptions = process.env.FINAL_LEADERBOARD_TIMEZONE 
      ? { timezone: process.env.FINAL_LEADERBOARD_TIMEZONE }
      : {};
    
    cron.schedule('0 9 * * *', async () => {
      console.log('⏰ Daily check: Checking if final leaderboard should be sent...');
      try {
        if (await shouldSendFinalLeaderboard()) {
          console.log('🎉 Challenge ended yesterday! Sending final leaderboard...');
          await sendFinalLeaderboard(app.client);
        } else {
          console.log('   No final leaderboard needed at this time.');
        }
      } catch (error) {
        console.error('❌ Error in final leaderboard cron job:', error);
      }
    }, cronOptions);
    
    const timezoneInfo = process.env.FINAL_LEADERBOARD_TIMEZONE 
      ? ` (${process.env.FINAL_LEADERBOARD_TIMEZONE} timezone)`
      : ' (server local time)';
    console.log(`⏰ Final leaderboard scheduler started (runs daily at 9:00 AM${timezoneInfo})`);
  } catch (error) {
    console.error('❌ Error starting app:', error.message);
    console.error('Full error:', error);
    if (error.code === 'slack_webapi_platform_error') {
      console.error('💡 This might be a token issue. Check your SLACK_APP_TOKEN in .env file.');
    }
    process.exit(1);
  }
})();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing app');
  await app.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing app');
  await app.stop();
  process.exit(0);
});

