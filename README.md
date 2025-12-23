# Weight Loss Challenge Slack Bot

A production-ready Slack bot built with Bolt for JavaScript that tracks fitness weight loss progress through DM commands and displays leaderboards. Data is stored in Google Sheets for easy viewing and analysis.

## Features

- **DM Commands**:
  - `baseline 200lbs` - Set your starting weight (one-time)
  - `checkin 185lbs` - Log your weekly weight with auto-timestamp

- **Slash Commands**:
  - `/leaderboard` - Posts top 5 participants to #fitness-channel
  - `/reset-challenge` - Admin-only: Wipes all data and announces reset
  - `/set-deadline YYYY-MM-DD` - Admin-only: Sets challenge end date
  - `/challenge-status` - Shows deadline and days remaining

- **Smart Features**:
  - Automatic weight loss calculations (baseline vs latest checkin)
  - Deadline enforcement (blocks checkins after deadline)
  - One baseline per user enforcement
  - Input validation (lbs format only)
  - Admin-only commands with user ID validation
  - DM confirmations for all actions

## Prerequisites

- Node.js 18+ 
- A Slack workspace with admin permissions
- A Google Cloud Project with Sheets API enabled
- A Google Sheets spreadsheet
- A Render.com account (for deployment)

## Setup Instructions

### 1. Slack App Setup

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and create a new app
2. Choose "From scratch" and give it a name (e.g., "Weight Loss Bot")
3. Go to **OAuth & Permissions**:
   - Add the following Bot Token Scopes:
     - `app_mentions:read`
     - `chat:write`
     - `commands`
     - `im:history`
     - `im:read`
     - `im:write`
     - `users:read`
   - Install the app to your workspace
   - Copy the **Bot User OAuth Token** (starts with `xoxb-`)

4. Go to **Socket Mode**:
   - Enable Socket Mode
   - Create an app-level token with `connections:write` scope
   - Copy the **App-Level Token** (starts with `xapp-`)

5. Go to **Slash Commands**:
   - Create 4 slash commands:
     - `/leaderboard` - Description: "View the weight loss leaderboard"
     - `/reset-challenge` - Description: "Reset the challenge (admin only)"
     - `/set-deadline` - Description: "Set challenge deadline (admin only)"
     - `/challenge-status` - Description: "View challenge status and deadline"

6. Get your Slack User ID (for admin access):
   - Go to your Slack profile
   - Click the three dots menu → Copy member ID
   - This is your User ID (starts with `U`)

7. Get your channel ID (for #fitness-channel):
   - Right-click on the channel → View channel details
   - Scroll down to find the Channel ID (starts with `C`)

### 2. Google Sheets Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable the Google Sheets API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

4. Create a Service Account:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - Give it a name (e.g., "weightlossbot-sheets")
   - Click "Create and Continue"
   - Skip optional steps and click "Done"

5. Create a Key for the Service Account:
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose JSON format
   - Download the JSON file (keep it secure!)

6. Create a Google Sheet:
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new spreadsheet
   - Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
   - Share the sheet with the service account email (found in the JSON file)
   - Give it "Editor" permissions

7. Convert the JSON credentials to a single-line string:
   - The JSON file should be converted to a single line for the `GOOGLE_SHEETS_CREDENTIALS` env var
   - You can use an online JSON minifier or simply remove all newlines

### 3. Local Setup

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Fill in your `.env` file:
   ```env
   SLACK_BOT_TOKEN=xoxb-your-bot-token-here
   SLACK_APP_TOKEN=xapp-your-app-token-here
   GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}
   GOOGLE_SHEET_ID=your-sheet-id-here
   ADMIN_IDS=U1234567
   FITNESS_CHANNEL=C1234567
   PORT=3000
   ```

5. Initialize the Google Sheet:
   ```bash
   npm run setup
   ```
   This will create the necessary headers and Config sheet.

6. Start the bot:
   ```bash
   npm start
   ```

### 4. Deployment to Render.com

1. Push your code to GitHub (make sure `.env` is in `.gitignore`)

2. Go to [Render.com](https://render.com) and sign up/login

3. Create a new Web Service:
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

4. Configure the service:
   - **Name**: `weightlossbot` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free tier is sufficient

5. Add Environment Variables in Render:
   - Go to "Environment" tab
   - Add all the variables from your `.env` file:
     - `SLACK_BOT_TOKEN`
     - `SLACK_APP_TOKEN`
     - `GOOGLE_SHEETS_CREDENTIALS` (paste the entire JSON as a single-line string)
     - `GOOGLE_SHEET_ID`
     - `ADMIN_IDS` (comma-separated if multiple: `U1234567,U7654321`)
     - `FITNESS_CHANNEL`
     - `PORT` (Render sets this automatically, but you can leave it)
     - `NODE_ENV=production`

6. Deploy:
   - Click "Create Web Service"
   - Render will build and deploy your bot
   - Check the logs to ensure it starts correctly

7. Run the setup script:
   - Once deployed, you can run the setup script locally (since it modifies the sheet, not the bot)
   - Or SSH into the Render instance and run `npm run setup`

## Usage

### For Participants

1. **Set your baseline** (one-time):
   - DM the bot: `baseline 200lbs`
   - You'll receive a confirmation

2. **Log weekly checkins**:
   - DM the bot: `checkin 185lbs`
   - You'll receive a confirmation with your progress

3. **View leaderboard**:
   - Use `/leaderboard` in any channel
   - Results are posted to #fitness-channel

### For Admins

1. **Set challenge deadline**:
   - Use `/set-deadline 2024-12-31`
   - Format: YYYY-MM-DD

2. **Check challenge status**:
   - Use `/challenge-status`
   - Shows deadline and days remaining

3. **Reset challenge**:
   - Use `/reset-challenge`
   - Clears all participant data
   - Announces reset in #fitness-channel

## Google Sheets Structure

### Users Sheet
- **SlackID**: User's Slack user ID
- **Username**: User's Slack username
- **BaselineWeight**: Starting weight in pounds
- **BaselineDate**: Date baseline was set (YYYY-MM-DD)
- **Checkins**: JSON array of checkin objects: `[{"weight":185,"date":"2024-01-15"},...]`
- **TotalLost**: Calculated total weight lost (baseline - latest checkin)
- **LatestCheckinDate**: Date of most recent checkin

### Config Sheet
- **Key**: Configuration key (e.g., "deadline")
- **Value**: Configuration value (e.g., "2024-12-31")

## Error Handling

The bot includes comprehensive error handling:
- Invalid weight format → Clear error message
- Missing baseline → Prompt to set baseline first
- Duplicate baseline → Inform user they already have one
- Post-deadline checkin → Block with deadline info
- Admin commands → Unauthorized message for non-admins
- API errors → User-friendly error messages

## Security

- Admin commands verify user ID against `ADMIN_IDS` env var
- Google Sheets credentials are stored as environment variables
- Input validation prevents malicious data
- Service account has editor access only to the specific sheet

## Troubleshooting

### Bot not responding
- Check that Socket Mode is enabled in Slack app settings
- Verify `SLACK_BOT_TOKEN` and `SLACK_APP_TOKEN` are correct
- Check Render logs for errors

### Google Sheets errors
- Verify service account email has editor access to the sheet
- Check `GOOGLE_SHEET_ID` is correct (from the URL)
- Ensure `GOOGLE_SHEETS_CREDENTIALS` is valid JSON (single-line)
- Run `npm run setup` to initialize sheets

### Commands not working
- Verify slash commands are created in Slack app settings
- Check bot has required OAuth scopes
- Ensure bot is invited to #fitness-channel (for leaderboard posts)

## License

MIT

## Support

For issues or questions, please check the logs first, then review the setup instructions above.


