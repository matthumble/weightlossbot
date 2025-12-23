# Setting Up GitHub Personal Access Token (PAT)

## Step 1: Create a Personal Access Token on GitHub

1. Go to **GitHub Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
   - Direct link: https://github.com/settings/tokens
   - Or: Click your profile picture → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. Click **"Generate new token"** → **"Generate new token (classic)"**

3. Fill in the token details:
   - **Note**: `Cursor Git Access` (or any descriptive name)
   - **Expiration**: Choose your preference (90 days, or "No expiration" for convenience)
   - **Scopes**: Check the **`repo`** scope (this gives full control of private repositories)
     - This includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`

4. Scroll down and click **"Generate token"**

5. **⚠️ IMPORTANT**: Copy the token immediately - you won't be able to see it again!
   - It will look like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Save it somewhere secure (password manager recommended)

## Step 2: Use the Token When Pushing

When you push to GitHub and Git asks for credentials:

- **Username**: Your GitHub username
- **Password**: Paste your Personal Access Token (NOT your GitHub password)

## Step 3: Store Credentials (Optional but Recommended)

To avoid entering the token every time, you can configure Git to store your credentials:

### Option A: Store in macOS Keychain (Recommended for Mac)

```bash
git config --global credential.helper osxkeychain
```

After the first push with your PAT, it will be stored in your macOS Keychain.

### Option B: Store Temporarily in Memory

```bash
git config --global credential.helper cache
# Credentials cached for 15 minutes by default
```

To change cache timeout (e.g., 1 hour):
```bash
git config --global credential.helper 'cache --timeout=3600'
```

### Option C: Store in Git Credential Manager

If you have Git Credential Manager installed:
```bash
git config --global credential.helper manager
```

## Troubleshooting

**Token not working?**
- Make sure you copied the entire token (it's long!)
- Verify the `repo` scope is selected
- Check if the token has expired
- Try regenerating a new token

**Still asking for password?**
- Make sure you're using the token, not your GitHub password
- Clear cached credentials: `git credential-osxkeychain erase` (then enter GitHub URL)

**Want to test your token?**
```bash
# Test with a simple API call
curl -H "Authorization: token YOUR_TOKEN_HERE" https://api.github.com/user
```

Replace `YOUR_TOKEN_HERE` with your actual token. You should see your GitHub user info.

