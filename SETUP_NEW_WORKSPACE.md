# Setting Up Weight Loss Bot on a New Slack Workspace

This guide will walk you through setting up the Weight Loss Bot on a completely new Slack workspace from scratch.

## Overview

The bot requires configuration in several places:
1. **Slack App** - Create a new Slack app with the right permissions
2. **Google Sheets** - Set up a new spreadsheet and service account
3. **Environment Variables** - Configure tokens and IDs for local testing
4. **GitHub** - Host your code repository (required for deployment)
5. **Render.com** - Deploy and host your bot 24/7 (recommended for production)

**Deployment Flow:**
- Local Setup (Steps 1-4) → GitHub (Step 5) → Render.com (Step 6)
- You can test locally before deploying, but production deployment to Render is recommended

---

## Step 1: Create a New Slack App

### 1.1 Create the App
1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Enter an app name (e.g., "Weight Loss Bot")
5. Select the **target Slack workspace** where you want to install it
6. Click **"Create App"**

### 1.2 Configure OAuth & Permissions
1. In the left sidebar, go to **"OAuth & Permissions"**
2. Scroll down to **"Bot Token Scopes"**
3. Click **"Add an OAuth Scope"** and add the following scopes:
   - `app_mentions:read`
   - `chat:write`
   - `commands`
   - `im:history`
   - `im:read`
   - `im:write`
   - `users:read`
4. Scroll up to **"OAuth Tokens for Your Workspace"**
5. Click **"Install to Workspace"**
6. Review the permissions and click **"Allow"**
7. **Copy the Bot User OAuth Token** (starts with `xoxb-`) - you'll need this for `SLACK_BOT_TOKEN`

### 1.3 Enable Socket Mode
1. In the left sidebar, go to **"Socket Mode"**
2. Toggle **"Enable Socket Mode"** to ON
3. Click **"Generate Token"** under **"App-Level Tokens"**
4. Name it (e.g., "socket-mode-token")
5. Add the scope: `connections:write`
6. Click **"Generate"**
7. **Copy the App-Level Token** (starts with `xapp-`) - you'll need this for `SLACK_APP_TOKEN`
   - ⚠️ **Important**: You can only see this token once! Copy it immediately.

### 1.4 Configure Event Subscriptions (Required for DMs and Channel Messages!)
1. In the left sidebar, go to **"Event Subscriptions"**
2. Toggle **"Enable Events"** to **ON**
3. Scroll down to **"Subscribe to bot events"** section
4. Click **"Add Bot User Event"** and add:
   - `message.im` - This allows the bot to receive direct messages (DMs)
   - `message.channels` - This allows the bot to receive messages in public channels
   - `message.groups` - This allows the bot to receive messages in private channels (optional, if you want private channel support)
5. Click **"Save Changes"** at the bottom
6. **Important**: After saving, you may need to reinstall the app:
   - Go to **"OAuth & Permissions"**
   - Click **"Reinstall to Workspace"** (if the button appears)
   - Review and approve the new permissions
   - ⚠️ **Note**: Without this step, DMs and channel messages will not work even if Socket Mode is enabled!

### 1.5 Create Slash Commands
1. In the left sidebar, go to **"Slash Commands"**
2. Click **"Create New Command"** and create these 4 commands:

   **Command 1: `/leaderboard`**
   - Command: `/leaderboard`
   - Short Description: `View the weight loss leaderboard`
   - Click **"Save"**

   **Command 2: `/reset-challenge`**
   - Command: `/reset-challenge`
   - Short Description: `Reset the challenge (admin only)`
   - Click **"Save"**

   **Command 3: `/set-deadline`**
   - Command: `/set-deadline`
   - Short Description: `Set challenge deadline (admin only)`
   - Click **"Save"**

   **Command 4: `/challenge-status`**
   - Command: `/challenge-status`
   - Short Description: `View challenge status and deadline`
   - Click **"Save"**

### 1.6 Get Your User ID (for Admin Access)
1. In Slack, click on your profile picture/name
2. Click the three dots (⋮) menu
3. Select **"Copy member ID"**
4. This is your User ID (starts with `U`) - you'll need this for `ADMIN_IDS`

### 1.7 Get Your Channel ID (for Leaderboard Posts)
1. In Slack, navigate to the channel where you want leaderboards posted (e.g., `#fitness-channel`)
2. Right-click on the channel name in the sidebar
3. Click **"View channel details"** (or "View details")
4. Scroll down to find the **Channel ID** (starts with `C`)
   - Alternatively, look at the channel URL: `https://workspace.slack.com/archives/C1234567890` - the `C1234567890` is the Channel ID
5. **Copy the Channel ID** - you'll need this for `FITNESS_CHANNEL`

### 1.8 Invite Bot to Channel (Important!)
1. In the channel where you want leaderboards posted (e.g., `#fitness-channel`)
2. Type `/invite @YourBotName` (use the actual bot name)
3. Or: Right-click channel → "Integrations" → "Add apps" → Find your bot → Add

---

## Step 2: Set Up Google Sheets

### 2.1 Create a Google Cloud Project
1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "weightlossbot-sheets")
5. Click **"Create"**
6. Wait for the project to be created, then select it from the dropdown

### 2.2 Enable Google Sheets API
1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Sheets API"**
3. Click on it and click **"Enable"**
4. Wait for it to enable (may take a minute)

### 2.3 Create a Service Account
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"**
3. Select **"Service account"**
4. Enter a name (e.g., "weightlossbot-sheets")
5. Click **"Create and Continue"**
6. Skip the optional steps and click **"Done"**

### 2.4 Create Service Account Key
1. Click on the service account you just created
2. Go to the **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Select **"JSON"** format
5. Click **"Create"**
6. The JSON file will download automatically - **save it securely!**
7. Keep this file - you'll need to convert it to a single-line string for the environment variable

### 2.5 Create a Google Sheet
1. Go to [https://sheets.google.com](https://sheets.google.com)
2. Click **"Blank"** to create a new spreadsheet
3. Give it a name (e.g., "Weight Loss Challenge")
4. Look at the URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
5. **Copy the Sheet ID** (the long string between `/d/` and `/edit`) - you'll need this for `GOOGLE_SHEET_ID`

### 2.6 Share Sheet with Service Account
1. In your Google Sheet, click the **"Share"** button (top right)
2. Find the service account email in the JSON file you downloaded (look for `"client_email"` field)
   - It looks like: `weightlossbot-sheets@your-project.iam.gserviceaccount.com`
3. Paste the service account email in the "Add people and groups" field
4. Make sure **"Editor"** permissions are selected
5. **Uncheck "Notify people"** (service accounts don't use email)
6. Click **"Share"**

### 2.7 Convert JSON Credentials to Single-Line String
The `GOOGLE_SHEETS_CREDENTIALS` environment variable needs the entire JSON as a single line.

**Option A: Using Terminal (Mac/Linux)**
```bash
cat /path/to/your/service-account-key.json | tr -d '\n'
```

**Option B: Using Online Tool**
1. Copy the entire contents of the JSON file
2. Go to [https://www.jsonformatter.org/json-minify](https://www.jsonformatter.org/json-minify)
3. Paste the JSON
4. Click "Minify JSON"
5. Copy the result (should be all on one line)

**Option C: Manual**
- Open the JSON file in a text editor
- Remove all line breaks and extra spaces
- Make sure it's valid JSON (test it at [jsonlint.com](https://jsonlint.com))

---

## Step 3: Configure Environment Variables

### 3.1 Create .env File
1. In your project root directory, create a file named `.env`
2. Add the following template:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_APP_TOKEN=xapp-your-app-token-here

# Google Sheets Configuration
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
GOOGLE_SHEET_ID=your-sheet-id-here

# Bot Configuration
ADMIN_IDS=U1234567
FITNESS_CHANNEL=C1234567

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3.2 Fill in Your Values

**SLACK_BOT_TOKEN**
- Paste the Bot User OAuth Token from Step 1.2
- Should start with `xoxb-`

**SLACK_APP_TOKEN**
- Paste the App-Level Token from Step 1.3
- Should start with `xapp-`

**GOOGLE_SHEETS_CREDENTIALS**
- Paste the single-line JSON from Step 2.7
- Must be on a single line (no line breaks)

**GOOGLE_SHEET_ID**
- Paste the Sheet ID from Step 2.5
- Just the ID, not the full URL

**ADMIN_IDS**
- Paste your User ID from Step 1.6
- For multiple admins, separate with commas: `U1234567,U7654321`
- Should start with `U`

**FITNESS_CHANNEL**
- Paste the Channel ID from Step 1.7
- Should start with `C`

**PORT**
- Leave as `3000` for local development
- Render.com will set this automatically in production

**NODE_ENV**
- Use `development` for local testing
- Use `production` when deploying

---

## Step 4: Local Setup & Testing

### 4.1 Install Dependencies
```bash
npm install
```

### 4.2 Initialize Google Sheet
```bash
npm run setup
```

This will:
- Create the "Users" sheet with headers
- Create the "Config" sheet with headers
- Verify your Google Sheets credentials work

You should see:
```
✓ Created Users sheet
✓ Set Users sheet headers
✓ Created Config sheet
✓ Set Config sheet headers
✅ Sheet initialization complete!
```

### 4.3 Start the Bot Locally
```bash
npm start
```

You should see:
```
🔍 Checking configuration...
SLACK_BOT_TOKEN: Set (xoxb-12345...)
SLACK_APP_TOKEN: Set (xapp-12345...)
🌐 Health check server running on port 3000
🔌 Connecting to Slack via Socket Mode...
⚡️ Weight Loss Bot started!
🔍 Verifying connection...
✅ Slack API connection verified!
   Bot User ID: U...
   Bot User Name: your-bot-name
   Team: Your Workspace Name
⏰ Final leaderboard scheduler started (runs daily at 9:00 AM (server local time))
```

### 4.4 Test the Bot

**Test 1: Set Baseline (DM)**
1. In Slack, open a DM with your bot
2. Send: `baseline 200lbs`
3. You should receive a confirmation message

**Test 2: Check-in (DM)**
1. In the same DM, send: `checkin 195lbs`
2. You should receive a confirmation with your progress

**Test 3: Leaderboard (Slash Command)**
1. In any channel, type: `/leaderboard`
2. The bot should post the leaderboard to your fitness channel

**Test 4: Challenge Status (Slash Command)**
1. Type: `/challenge-status`
2. You should see the current challenge status

**Test 5: Set Deadline (Admin)**
1. Type: `/set-deadline 2024-12-31`
2. You should see a confirmation (only works if your User ID is in ADMIN_IDS)

---

## Step 5: Set Up GitHub Repository

**Why GitHub?** Render.com requires your code to be hosted on GitHub (or GitLab/Bitbucket) to automatically deploy updates. This step is required for deployment.

### 5.1 Verify .env is Ignored
1. Check that your `.gitignore` file includes `.env` (it should already be there)
2. **Important**: Never commit your `.env` file to GitHub - it contains sensitive tokens!

You can verify by checking `.gitignore` contains:
```
.env
```

### 5.2 Create a GitHub Repository
1. Go to [https://github.com](https://github.com) and sign in (create an account if needed)
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in the repository details:
   - **Repository name**: `weightlossbot` (or your preferred name)
   - **Description**: "Weight Loss Challenge Slack Bot"
   - **Visibility**: Choose **Private** (recommended) or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **"Create repository"**

### 5.3 Initialize Git (if not already done)
If your project doesn't have git initialized yet:

```bash
# Navigate to your project directory
cd /path/to/weightlossbot

# Initialize git repository
git init

# Add all files (except those in .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: Weight Loss Bot setup"
```

### 5.4 Connect to GitHub and Push
1. GitHub will show you commands to push an existing repository - use these:

```bash
# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/weightlossbot.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

2. If prompted for authentication:
   - **Option A**: Use GitHub CLI (`gh auth login`)
   - **Option B**: Use a Personal Access Token (Settings → Developer settings → Personal access tokens → Generate new token)
   - **Option C**: Use SSH keys (more secure, recommended for frequent use)

3. Verify your code is on GitHub:
   - Refresh your repository page on GitHub
   - You should see all your project files
   - **Verify `.env` is NOT visible** (it should be ignored)

### 5.5 Future Updates
After making code changes, commit and push:
```bash
git add .
git commit -m "Description of changes"
git push origin main
```
Render will automatically redeploy when you push to the main branch.

---

## Step 6: Deploy to Render.com

Render.com provides free hosting that keeps your bot running 24/7. This is recommended for production use.

### 6.1 Create Render Account
1. Go to [https://render.com](https://render.com)
2. Click **"Get Started for Free"** or **"Sign Up"**
3. Sign up with your GitHub account (recommended - makes connecting easier)
   - Or sign up with email and connect GitHub later

### 6.2 Connect GitHub Account (if not done during signup)
1. In Render dashboard, click your profile (top right)
2. Go to **"Account Settings"** → **"Connected Accounts"**
3. Click **"Connect"** next to GitHub
4. Authorize Render to access your repositories
5. Select which repositories to allow (you can choose "All repositories" or select specific ones)

### 6.3 Create New Web Service
1. In the Render dashboard, click **"New +"** button
2. Select **"Web Service"**
3. You'll see a list of your GitHub repositories
4. Find and click on your `weightlossbot` repository
5. Click **"Connect"**

### 6.4 Configure Web Service
Fill in the service configuration:

**Basic Settings:**
- **Name**: `weightlossbot` (or your preferred name - this will be in the URL)
- **Region**: Choose the region closest to you (e.g., `Oregon (US West)` or `Frankfurt (EU Central)`)
- **Branch**: `main` (or your default branch name)
- **Root Directory**: Leave **blank** (unless your code is in a subdirectory)

**Build & Deploy:**
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Plan:**
- Select **"Free"** plan (sufficient for this bot)
- Free tier includes:
  - 750 hours/month (enough for 24/7 uptime)
  - Automatic SSL certificates
  - Auto-deploy from GitHub
  - ⚠️ Service spins down after 15 minutes of inactivity (but will wake up when needed)

### 6.5 Add Environment Variables
**This is critical!** All your configuration values need to be added here.

1. Scroll down to the **"Environment Variables"** section
2. Click **"Add Environment Variable"** for each variable below:

   **Slack Configuration:**
   - **Key**: `SLACK_BOT_TOKEN`
     - **Value**: Your Bot User OAuth Token from Step 1.2 (starts with `xoxb-`)
   
   - **Key**: `SLACK_APP_TOKEN`
     - **Value**: Your App-Level Token from Step 1.3 (starts with `xapp-`)

   **Google Sheets Configuration:**
   - **Key**: `GOOGLE_SHEETS_CREDENTIALS`
     - **Value**: The entire single-line JSON from Step 2.7
     - **Important**: Paste the entire JSON without quotes, all on one line
     - Example format: `{"type":"service_account","project_id":"...","private_key":"...",...}`
   
   - **Key**: `GOOGLE_SHEET_ID`
     - **Value**: Your Sheet ID from Step 2.5 (just the ID, not the full URL)

   **Bot Configuration:**
   - **Key**: `ADMIN_IDS`
     - **Value**: Your User ID from Step 1.6 (starts with `U`)
     - For multiple admins: `U1234567,U7654321` (comma-separated, no spaces)
   
   - **Key**: `FITNESS_CHANNEL`
     - **Value**: Your Channel ID from Step 1.7 (starts with `C`)

   **Server Configuration:**
   - **Key**: `NODE_ENV`
     - **Value**: `production`
   
   - **Key**: `PORT`
     - **Value**: Leave **blank** - Render sets this automatically
     - Or set to `10000` if you prefer (Render's default port)

3. **Double-check** all variables are entered correctly - typos will cause the bot to fail
4. For `GOOGLE_SHEETS_CREDENTIALS` specifically:
   - Copy the entire JSON object from Step 2.7
   - Make sure it's all on one line (no line breaks)
   - Don't wrap it in quotes
   - Validate it's valid JSON before pasting

### 6.6 Deploy
1. Scroll down and review all settings one more time
2. Click **"Create Web Service"** at the bottom
3. Render will start building your service:
   - This takes 2-5 minutes
   - You'll see build logs in real-time
   - Watch for any errors

### 6.7 Monitor Deployment
1. Watch the build logs - you should see:
   ```
   npm install
   ... (installing packages)
   npm start
   ... (starting bot)
   ```

2. Look for success messages in the logs:
   ```
   🔍 Checking configuration...
   SLACK_BOT_TOKEN: Set (xoxb-12345...)
   SLACK_APP_TOKEN: Set (xapp-12345...)
   🌐 Health check server running on port 10000
   🔌 Connecting to Slack via Socket Mode...
   ⚡️ Weight Loss Bot started!
   ✅ Slack API connection verified!
   ```

3. If you see errors:
   - Check the error message in the logs
   - Common issues:
     - Missing environment variables
     - Invalid token format
     - Google Sheets credentials not valid JSON
   - Fix the issue and Render will automatically redeploy

### 6.8 Verify Deployment
1. Once deployment succeeds, the service status should show **"Live"**
2. Check the **"Logs"** tab for the success messages above
3. Test your bot in Slack:
   - DM the bot: `baseline 200lbs`
   - Use `/leaderboard` command
   - Verify it works the same as local testing

### 6.9 Understanding Render Free Tier
- **Auto-sleep**: Free services sleep after 15 minutes of inactivity
- **Wake time**: Service wakes up automatically when it receives a request (takes ~30 seconds)
- **For Slack bots**: Since Slack uses Socket Mode (persistent connection), your bot stays awake while connected
- **Monthly hours**: 750 free hours = enough for 24/7 uptime

### 6.10 Updating Your Bot
To update your bot after making code changes:

1. Make changes to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```
3. Render will automatically detect the push and redeploy
4. Check the Render dashboard → "Events" tab to see deployment progress
5. Verify in logs that deployment succeeded

### 6.11 Viewing Logs
- Go to your service in Render dashboard
- Click the **"Logs"** tab
- View real-time logs of your bot
- Useful for debugging issues

### 6.12 Service Management
- **Stop/Start**: Use the buttons in the Render dashboard
- **Redeploy**: Click "Manual Deploy" → "Clear build cache & deploy"
- **Delete**: Settings → "Delete Service" (permanent!)

---

## Troubleshooting

### Bot Not Responding
- ✅ Check Socket Mode is enabled in Slack app settings
- ✅ Verify `SLACK_BOT_TOKEN` starts with `xoxb-`
- ✅ Verify `SLACK_APP_TOKEN` starts with `xapp-`
- ✅ Check Render logs (if deployed) or terminal output (if local)
- ✅ Make sure the bot is invited to the fitness channel

### Google Sheets Errors
- ✅ Verify service account email has **Editor** access to the sheet
- ✅ Check `GOOGLE_SHEET_ID` is correct (from the URL)
- ✅ Ensure `GOOGLE_SHEETS_CREDENTIALS` is valid JSON on a single line
- ✅ Run `npm run setup` to initialize the sheets
- ✅ Make sure Google Sheets API is enabled in Google Cloud Console

### Commands Not Working
- ✅ Verify slash commands are created in Slack app settings
- ✅ Check bot has all required OAuth scopes
- ✅ Ensure bot is installed to the workspace (OAuth & Permissions → Install to Workspace)
- ✅ For admin commands: Verify your User ID is correct in `ADMIN_IDS`

### Leaderboard Not Posting
- ✅ Verify `FITNESS_CHANNEL` is the correct Channel ID (starts with `C`)
- ✅ Make sure bot is invited to the channel
- ✅ Check bot has `chat:write` scope

### JSON Credentials Error
If you see "Failed to parse GOOGLE_SHEETS_CREDENTIALS":
- ✅ Ensure the JSON is on a single line (no line breaks)
- ✅ Validate JSON at [jsonlint.com](https://jsonlint.com)
- ✅ Don't wrap it in quotes when setting the environment variable
- ✅ Make sure all double quotes are escaped properly if pasting into a shell

### GitHub Issues
**Can't push to GitHub:**
- ✅ Verify you're authenticated (use `gh auth login` or Personal Access Token)
- ✅ Check remote URL is correct: `git remote -v`
- ✅ Ensure you have write access to the repository
- ✅ Try pushing with: `git push -u origin main`

**`.env` file accidentally committed:**
- ✅ Remove from git: `git rm --cached .env`
- ✅ Commit the removal: `git commit -m "Remove .env from tracking"`
- ✅ Push to GitHub: `git push`
- ✅ Verify `.env` is in `.gitignore`
- ⚠️ **Important**: If you've already pushed secrets, rotate/regenerate them

### Render.com Deployment Issues
**Build fails:**
- ✅ Check build logs for specific error messages
- ✅ Verify `package.json` exists and is valid
- ✅ Ensure all dependencies are in `package.json`
- ✅ Check Node.js version compatibility (bot requires Node 18+)

**Service fails to start:**
- ✅ Check logs for error messages
- ✅ Verify all environment variables are set correctly
- ✅ Ensure environment variables match exactly (no extra spaces)
- ✅ Verify `GOOGLE_SHEETS_CREDENTIALS` is valid JSON on one line

**Service shows "Unavailable" or crashes:**
- ✅ Check logs for error messages
- ✅ Verify Slack tokens are correct and not expired
- ✅ Ensure Socket Mode is enabled in Slack app settings
- ✅ Check that Google Sheets service account has access

**Auto-deploy not working:**
- ✅ Verify GitHub is connected to Render
- ✅ Check repository settings in Render
- ✅ Ensure you're pushing to the branch Render is watching (usually `main`)
- ✅ Check Render's "Events" tab for deployment status

---

## Quick Reference Checklist

### Slack Setup
- [ ] Slack app created
- [ ] Bot Token Scopes added (7 scopes)
- [ ] App installed to workspace
- [ ] Socket Mode enabled
- [ ] App-Level Token created (`xapp-`)
- [ ] Slash commands created (4 commands: `/leaderboard`, `/reset-challenge`, `/set-deadline`, `/challenge-status`)
- [ ] User ID copied (`U...`)
- [ ] Channel ID copied (`C...`)
- [ ] Bot invited to channel

### Google Sheets Setup
- [ ] Google Cloud project created
- [ ] Google Sheets API enabled
- [ ] Service account created
- [ ] Service account key downloaded (JSON)
- [ ] Google Sheet created
- [ ] Sheet shared with service account (Editor permissions)
- [ ] JSON credentials converted to single line

### Local Setup & Testing
- [ ] `.env` file created with all values
- [ ] `npm install` completed
- [ ] `npm run setup` completed successfully
- [ ] `npm start` shows successful connection
- [ ] Bot responds to test commands (baseline, checkin, /leaderboard)

### GitHub Setup (Required for Deployment)
- [ ] GitHub account created
- [ ] Repository created on GitHub
- [ ] `.env` verified in `.gitignore` (not committed)
- [ ] Git initialized (if needed)
- [ ] Code committed and pushed to GitHub
- [ ] Verified `.env` is not visible on GitHub

### Render.com Deployment
- [ ] Render.com account created
- [ ] GitHub account connected to Render
- [ ] Web Service created
- [ ] Service configured (Node, npm install, npm start)
- [ ] All environment variables added in Render
- [ ] Deployment successful (status: Live)
- [ ] Logs show successful connection to Slack
- [ ] Bot tested in Slack after deployment

---

## Next Steps

Once everything is set up:

1. **Set a challenge deadline**: `/set-deadline YYYY-MM-DD`
2. **Announce the challenge** in your fitness channel
3. **Share instructions** with participants:
   - DM the bot: `baseline 200lbs` (one-time)
   - DM the bot: `checkin 195lbs` (weekly)
   - Use `/leaderboard` to see progress
4. **Monitor progress** via the Google Sheet or `/leaderboard`

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the logs (local terminal or Render logs)
3. Verify all environment variables are set correctly
4. Ensure all Slack permissions and commands are configured
5. Check that Google Sheets has the correct permissions

Good luck with your weight loss challenge! 🎉

