# Client Tracker

React (Vite) frontend + one Netlify Function (`netlify/functions/api.mjs`) for the API and GitHub login.
Data is stored in Netlify Blobs — no external database.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:8888. Login is skipped under `netlify dev`; local data is kept in `.netlify/`.

## Netlify environment variables
| Variable | Value |
| --- | --- |
| `GITHUB_CLIENT_ID` | From your GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | From your GitHub OAuth App (mark as secret) |
| `SESSION_SECRET` | Long random string, e.g. `openssl rand -hex 32` |
| `ALLOWED_GITHUB_USERS` | Comma-separated GitHub usernames allowed in, e.g. `Sohail0707` |

GitHub OAuth App callback URL: `https://client.sohailrana.com/auth/callback`

Sessions last 365 days per browser. Changing `SESSION_SECRET` signs out every device.
