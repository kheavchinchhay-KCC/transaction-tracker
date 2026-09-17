<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/f1788029-d848-4a02-9244-b5839c86de47

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Netlify + Google Sheets OAuth

This is a browser SPA. Google Sheets is authorized per user account with Google Identity Services.

1. In Google Cloud Console, use a **Web application** OAuth client.
2. Add the production Netlify site origin to **Authorized JavaScript origins**, for example `https://your-site.netlify.app`.
3. Add local development origins only if needed, such as `http://localhost:3000`.
4. You do **not** need to add a redirect URI for the current popup token flow.
5. Enable the Google Sheets API and Google Drive API for the same Google Cloud project.
6. Configure the OAuth consent screen. During testing, add the Google accounts that will test the app as test users if the consent screen is in Testing status.
7. For a public production app, complete Google's OAuth verification requirements for the scopes used by the app when Google requires verification.
8. In Netlify, optionally set `VITE_GOOGLE_CLIENT_ID` to the Web application client ID. This value is public; never put a client secret in the frontend.

Each user selects their own Google account in the authorization popup. The app then uses that user's access token to find/create its `Transaction Tracker by KCC` spreadsheet in that user's Google Drive. The token and spreadsheet ID are stored only in that browser's local storage.
