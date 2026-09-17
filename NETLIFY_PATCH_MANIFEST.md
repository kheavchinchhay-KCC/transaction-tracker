# Transaction Tracker — Netlify deployment patch

## Baseline
`transaction-tracker.zip` uploaded by the user in this conversation.

## Goal
Make the browser build suitable for Netlify and fix Google Sheets authorization so each user can authorize their own Google account without redirecting the SPA to a dynamically generated OAuth redirect URL.

## Changed files
- `src/App.tsx` — replace the old hash/redirect implicit OAuth flow with popup-based Google Identity Services authorization.
- `src/utils/googleAuth.ts` — new helper for Google Identity Services token authorization.
- `index.html` — preload Google Identity Services.
- `.env.example` — document `VITE_GOOGLE_CLIENT_ID`; keep Gemini key optional.
- `netlify.toml` — keep Vite build/publish settings and SPA fallback explicit.
- `README.md` — add Netlify/Google OAuth setup instructions.

## Database / SQL
None.

## Installation order
1. Replace the files listed above from this patch.
2. Commit/push to GitHub.
3. In Netlify, deploy the repository root.
4. Build command: `npm run build`.
5. Publish directory: `dist`.
6. Set Node version 20 (already in `netlify.toml`).
7. In Google Cloud, add the final Netlify site origin under **Authorized JavaScript origins** for the Web application OAuth client.
8. Enable Google Sheets API and Google Drive API.
9. Configure the OAuth consent screen and add test users while the app is in Testing status.
10. Open the Netlify site, use Connect Google Sheets, and choose the user's own Google account.

## Important
The Google client ID is not a secret. Do not put a Google OAuth client secret in this frontend.
The app's current Sheets integration stores the user's short-lived access token and spreadsheet ID in that browser's localStorage. Each browser profile therefore authorizes independently.
