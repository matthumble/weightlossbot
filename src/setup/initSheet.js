/**
 * Initialize Google Sheets with headers and Config sheet
 * Run this script once before starting the bot: npm run setup
 */

require('dotenv').config();

const { google } = require('googleapis');

async function initializeSheet() {
  const credentialsJson = process.env.GOOGLE_SHEETS_CREDENTIALS;
  if (!credentialsJson) {
    console.error('❌ GOOGLE_SHEETS_CREDENTIALS environment variable is required');
    process.exit(1);
  }

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    console.error('❌ GOOGLE_SHEET_ID environment variable is required');
    process.exit(1);
  }

  try {
    const credentials = JSON.parse(credentialsJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📊 Initializing Google Sheet...');

    // Define headers for Users sheet
    const usersHeaders = [
      ['SlackID', 'Username', 'BaselineWeight', 'BaselineDate', 'Checkins', 'TotalLost', 'LatestCheckinDate']
    ];

    // Define headers for Config sheet
    const configHeaders = [
      ['Key', 'Value']
    ];

    // Check if Users sheet exists, create if not
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Users!A1',
      });
      console.log('✓ Users sheet already exists');
    } catch (error) {
      if (error.code === 400) {
        // Sheet doesn't exist, create it
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          resource: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: 'Users',
                  },
                },
              },
            ],
          },
        });
        console.log('✓ Created Users sheet');
      } else {
        throw error;
      }
    }

    // Set Users sheet headers (only if A1 is empty)
    try {
      const existingHeaders = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Users!A1:G1',
      });

      if (!existingHeaders.data.values || existingHeaders.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: 'Users!A1:G1',
          valueInputOption: 'RAW',
          resource: {
            values: usersHeaders,
          },
        });
        console.log('✓ Set Users sheet headers');
      } else {
        console.log('✓ Users sheet headers already exist');
      }
    } catch (error) {
      console.error('Error setting Users headers:', error.message);
      throw error;
    }

    // Check if Config sheet exists, create if not
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Config!A1',
      });
      console.log('✓ Config sheet already exists');
    } catch (error) {
      if (error.code === 400) {
        // Sheet doesn't exist, create it
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          resource: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: 'Config',
                  },
                },
              },
            ],
          },
        });
        console.log('✓ Created Config sheet');
      } else {
        throw error;
      }
    }

    // Set Config sheet headers (only if A1 is empty)
    try {
      const existingHeaders = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Config!A1:B1',
      });

      if (!existingHeaders.data.values || existingHeaders.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: 'Config!A1:B1',
          valueInputOption: 'RAW',
          resource: {
            values: configHeaders,
          },
        });
        console.log('✓ Set Config sheet headers');
      } else {
        console.log('✓ Config sheet headers already exist');
      }
    } catch (error) {
      console.error('Error setting Config headers:', error.message);
      throw error;
    }

    console.log('\n✅ Sheet initialization complete!');
    console.log('\nNext steps:');
    console.log('1. Make sure your Slack bot has the required permissions');
    console.log('2. Set up your environment variables (see .env.example)');
    console.log('3. Start the bot with: npm start');
  } catch (error) {
    console.error('\n❌ Error initializing sheet:', error.message);
    if (error.response) {
      console.error('Details:', error.response.data);
    }
    process.exit(1);
  }
}

// Run initialization
initializeSheet();


