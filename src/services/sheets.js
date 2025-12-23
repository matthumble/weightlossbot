/**
 * Google Sheets API service wrapper
 */

const { google } = require('googleapis');

const SHEET_NAME = 'Users';
const CONFIG_SHEET_NAME = 'Config';
const COLUMNS = {
  SLACK_ID: 0,
  USERNAME: 1,
  BASELINE_WEIGHT: 2,
  BASELINE_DATE: 3,
  CHECKINS: 4,
  TOTAL_LOST: 5,
  LATEST_CHECKIN_DATE: 6
};

let sheets = null;
let auth = null;
let spreadsheetId = null;

/**
 * Initialize Google Sheets client
 */
function initialize() {
  if (sheets && auth && spreadsheetId) {
    return; // Already initialized
  }

  const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;
  if (!credentialsJson) {
    throw new Error('GOOGLE_SHEETS_CREDENTIALS environment variable is required');
  }

  let credentials;
  try {
    credentials = JSON.parse(credentialsJson);
  } catch (parseError) {
    console.error('❌ Error parsing GOOGLE_SHEETS_CREDENTIALS:');
    console.error('Error message:', parseError.message);
    console.error('JSON length:', credentialsJson.length);
    console.error('First 100 chars:', credentialsJson.substring(0, 100));
    console.error('Last 100 chars:', credentialsJson.substring(Math.max(0, credentialsJson.length - 100)));
    throw new Error(`Failed to parse GOOGLE_SHEETS_CREDENTIALS: ${parseError.message}`);
  }
  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEET_ID environment variable is required');
  }

  sheets = google.sheets({ version: 'v4', auth });
}

/**
 * Get user data by Slack ID
 * @param {string} slackId - User's Slack ID
 * @returns {Object|null} - User data object or null if not found
 */
async function getUserData(slackId) {
  initialize();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A2:G`,
    });

    const rows = response.data.values || [];
    
    for (const row of rows) {
      if (row[COLUMNS.SLACK_ID] === slackId) {
        let checkins = [];
        if (row[COLUMNS.CHECKINS]) {
          try {
            const parsedCheckins = JSON.parse(row[COLUMNS.CHECKINS]);
            // Ensure weights in checkins are numbers
            checkins = parsedCheckins.map(checkin => ({
              weight: typeof checkin.weight === 'number' ? checkin.weight : parseFloat(checkin.weight),
              date: checkin.date
            })).filter(checkin => !isNaN(checkin.weight));
          } catch (e) {
            console.error('Error parsing checkins JSON:', e);
            checkins = [];
          }
        }
        
        const baselineWeight = row[COLUMNS.BASELINE_WEIGHT] ? parseFloat(row[COLUMNS.BASELINE_WEIGHT]) : null;
        
        return {
          slackId: row[COLUMNS.SLACK_ID] || '',
          username: row[COLUMNS.USERNAME] || '',
          baselineWeight: baselineWeight,
          baselineDate: row[COLUMNS.BASELINE_DATE] || null,
          checkins: checkins,
          totalLost: row[COLUMNS.TOTAL_LOST] ? parseFloat(row[COLUMNS.TOTAL_LOST]) : 0,
          latestCheckinDate: row[COLUMNS.LATEST_CHECKIN_DATE] || null,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
}

/**
 * Find row index for a user (1-based, accounting for header row)
 * @param {string} slackId - User's Slack ID
 * @returns {number|null} - Row index or null if not found
 */
async function findUserRowIndex(slackId) {
  initialize();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A2:A`,
    });

    const rows = response.data.values || [];
    
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === slackId) {
        return i + 2; // +2 because we start at row 2 (after header) and sheets uses 1-based indexing
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding user row:', error);
    throw error;
  }
}

/**
 * Set baseline weight for a user
 * @param {string} slackId - User's Slack ID
 * @param {string} username - User's Slack username
 * @param {number} weight - Baseline weight
 * @param {string} date - Baseline date (YYYY-MM-DD)
 */
async function setBaseline(slackId, username, weight, date) {
  initialize();

  try {
    // Check if user already exists
    const existingUser = await getUserData(slackId);
    
    if (existingUser && existingUser.baselineWeight !== null) {
      throw new Error('User already has a baseline weight set');
    }

    const rowIndex = existingUser ? await findUserRowIndex(slackId) : null;

    if (rowIndex) {
      // Update existing row
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!B${rowIndex}:D${rowIndex}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[username, weight.toString(), date]],
        },
      });
    } else {
      // Append new row
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_NAME}!A:G`,
        valueInputOption: 'RAW',
        resource: {
          values: [[slackId, username, weight.toString(), date, '[]', '0', '']],
        },
      });
    }
  } catch (error) {
    console.error('Error setting baseline:', error);
    throw error;
  }
}

/**
 * Add a checkin for a user
 * @param {string} slackId - User's Slack ID
 * @param {number} weight - Checkin weight
 * @param {string} date - Checkin date (YYYY-MM-DD)
 */
async function addCheckin(slackId, weight, date) {
  initialize();

  try {
    const userData = await getUserData(slackId);
    
    if (!userData) {
      throw new Error('User not found. Please set a baseline first.');
    }

    if (!userData.baselineWeight) {
      throw new Error('No baseline weight set. Please set a baseline first.');
    }

    // Add new checkin
    const checkins = userData.checkins || [];
    checkins.push({ weight, date });

    // Calculate total lost: baseline - latest checkin weight
    // The latest checkin is the one we just added (weight parameter)
    const totalLost = userData.baselineWeight - weight;

    const rowIndex = await findUserRowIndex(slackId);
    if (!rowIndex) {
      throw new Error('User row not found');
    }

    // Update checkins, total lost, and latest checkin date
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!E${rowIndex}:G${rowIndex}`,
      valueInputOption: 'RAW',
      resource: {
        values: [[JSON.stringify(checkins), totalLost.toFixed(1), date]],
      },
    });
  } catch (error) {
    console.error('Error adding checkin:', error);
    throw error;
  }
}

/**
 * Get all users with their data
 * @returns {Array} - Array of user data objects
 */
async function getAllUsers() {
  initialize();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A2:G`,
    });

    const rows = response.data.values || [];
    const users = [];

    for (const row of rows) {
      // Skip rows without baseline weight
      if (!row[COLUMNS.BASELINE_WEIGHT]) {
        continue;
      }

      let checkins = [];
      if (row[COLUMNS.CHECKINS]) {
        try {
          const parsedCheckins = JSON.parse(row[COLUMNS.CHECKINS]);
          // Ensure weights in checkins are numbers
          checkins = parsedCheckins.map(checkin => ({
            weight: typeof checkin.weight === 'number' ? checkin.weight : parseFloat(checkin.weight),
            date: checkin.date
          })).filter(checkin => !isNaN(checkin.weight));
        } catch (e) {
          console.error('Error parsing checkins JSON:', e);
          checkins = [];
        }
      }
      
      const baselineWeight = parseFloat(row[COLUMNS.BASELINE_WEIGHT]);
      if (isNaN(baselineWeight)) {
        continue; // Skip users with invalid baseline weights
      }
      
      users.push({
        slackId: row[COLUMNS.SLACK_ID] || '',
        username: row[COLUMNS.USERNAME] || '',
        baselineWeight: baselineWeight,
        baselineDate: row[COLUMNS.BASELINE_DATE] || '',
        checkins: checkins,
        totalLost: row[COLUMNS.TOTAL_LOST] ? parseFloat(row[COLUMNS.TOTAL_LOST]) : 0,
        latestCheckinDate: row[COLUMNS.LATEST_CHECKIN_DATE] || null,
      });
    }

    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

/**
 * Reset challenge - clear all user data (keep headers)
 */
async function resetChallenge() {
  initialize();

  try {
    // Get all rows
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A:G`,
    });

    const rows = response.data.values || [];
    
    if (rows.length <= 1) {
      return; // Only headers, nothing to clear
    }

    // Clear all rows except header (row 1)
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${SHEET_NAME}!A2:G`,
    });
  } catch (error) {
    console.error('Error resetting challenge:', error);
    throw error;
  }
}

/**
 * Set challenge deadline
 * @param {string} deadline - Deadline date (YYYY-MM-DD)
 */
async function setDeadline(deadline) {
  initialize();

  try {
    // Try to get existing config row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${CONFIG_SHEET_NAME}!A2:B`,
    });

    const rows = response.data.values || [];
    const deadlineRowIndex = rows.findIndex(row => row[0] === 'deadline');

    if (deadlineRowIndex >= 0) {
      // Update existing deadline
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${CONFIG_SHEET_NAME}!B${deadlineRowIndex + 2}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[deadline]],
        },
      });
    } else {
      // Append new deadline row
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${CONFIG_SHEET_NAME}!A:B`,
        valueInputOption: 'RAW',
        resource: {
          values: [['deadline', deadline]],
        },
      });
    }
  } catch (error) {
    console.error('Error setting deadline:', error);
    throw error;
  }
}

/**
 * Get challenge deadline
 * @returns {string|null} - Deadline date (YYYY-MM-DD) or null if not set
 */
async function getDeadline() {
  initialize();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${CONFIG_SHEET_NAME}!A2:B`,
    });

    const rows = response.data.values || [];
    
    for (const row of rows) {
      if (row[0] === 'deadline' && row[1]) {
        return row[1];
      }
    }

    return null;
  } catch (error) {
    // Config sheet might not exist yet, return null
    if (error.code === 400) {
      return null;
    }
    console.error('Error getting deadline:', error);
    throw error;
  }
}

/**
 * Get a config value
 * @param {string} key - Config key
 * @returns {string|null} - Config value or null if not found
 */
async function getConfigValue(key) {
  initialize();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${CONFIG_SHEET_NAME}!A2:B`,
    });

    const rows = response.data.values || [];
    
    for (const row of rows) {
      if (row[0] === key && row[1]) {
        return row[1];
      }
    }

    return null;
  } catch (error) {
    if (error.code === 400) {
      return null;
    }
    console.error('Error getting config value:', error);
    throw error;
  }
}

/**
 * Set a config value
 * @param {string} key - Config key
 * @param {string} value - Config value
 */
async function setConfigValue(key, value) {
  initialize();

  try {
    // Try to get existing config row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${CONFIG_SHEET_NAME}!A2:B`,
    });

    const rows = response.data.values || [];
    const configRowIndex = rows.findIndex(row => row[0] === key);

    if (configRowIndex >= 0) {
      // Update existing config
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${CONFIG_SHEET_NAME}!B${configRowIndex + 2}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[value]],
        },
      });
    } else {
      // Append new config row
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${CONFIG_SHEET_NAME}!A:B`,
        valueInputOption: 'RAW',
        resource: {
          values: [[key, value]],
        },
      });
    }
  } catch (error) {
    console.error('Error setting config value:', error);
    throw error;
  }
}

module.exports = {
  getUserData,
  setBaseline,
  addCheckin,
  getAllUsers,
  resetChallenge,
  setDeadline,
  getDeadline,
  getConfigValue,
  setConfigValue,
};

