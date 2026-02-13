# Deployment Instructions for Vercel

This project is configured for easy deployment on [Vercel](https://vercel.com).

## Prerequisites
1. A Vercel account.
2. The Vercel CLI installed (optional, but recommended): `npm i -g vercel`

## Environment Variables
The application requires the following environment variable to be set in your Vercel project settings:

- `API_KEY`: Your Google Gemini API Key.

## Deploying

### Option 1: Using the Vercel CLI (Recommended)
1. Open your terminal in the project directory.
2. Run the deployment command:
   ```bash
   npx vercel
   ```
3. Follow the prompts:
   - Set up and deploy? [Y/n]: `y`
   - Which scope do you want to deploy to?: Select your account.
   - Link to existing project? [y/N]: `n`
   - What’s your project’s name?: `edubook-ai` (or your preferred name)
   - In which directory is your code located?: `./`
   - Want to modify these settings? [y/N]: `n`
4. **Important**: After the initial deployment (which might fail if the API key isn't set), go to your Vercel Dashboard -> Project Settings -> Environment Variables.
5. Add `API_KEY` with your Gemini API key value.
6. Trigger a new deployment or redeploy.

### Option 2: Using the Vercel Dashboard (Git Integration)
1. Push this code to a Git repository (GitHub, GitLab, Bitbucket).
2. Import the project in Vercel.
3. In the "Environment Variables" section during import, add:
   - Name: `API_KEY`
   - Value: `your_gemini_api_key_here`
4. Click "Deploy".

## Troubleshooting
- If the build fails, check the "Build Logs" in Vercel.
- Ensure `npm run build` runs successfully locally.
- If you do not have Git or Node.js installed locally, you can use the **Vercel Dashboard Manual Upload**:
  1. Install the Vercel CLI (requires Node.js) OR use the "Import" feature on Vercel's dashboard to connect a Git repository (recommended).
  2. If you cannot install tools, you may need to use a cloud IDE (like GitHub Codespaces or StackBlitz) to commit this code to a repository, then deploy that repository in Vercel.
