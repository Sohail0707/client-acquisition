# Client Tracker

React (Vite) frontend + a small Express API, storing data in SQLite via Node's built-in `node:sqlite`.
One Node process serves both, so it runs on any host that runs Node 22.13+ or Docker. No platform SDKs.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:5173 (the API runs on :3001 and Vite proxies `/api` to it).

## Production
```bash
npm run build
npm start
```
Serves app + API on `PORT` (default 3001). Data is stored in `DATA_DIR/clients.db` (default `./data`).
Back up that one file to back up everything.

### Docker
```bash
docker build -t client-tracker .
docker run -p 3001:3001 -v client-data:/data client-tracker
```

### Hosts
Works on any host with a persistent disk: a VPS, Render, Railway, Fly.io, DigitalOcean App Platform, etc.
Make sure `DATA_DIR` points to a persistent volume, or the data is lost on redeploy.
Static-only hosts (Netlify, Vercel, GitHub Pages) can't run this server as-is.

## Auth
The site is currently open — anyone with the URL can read and edit. GitHub OAuth is planned:
it goes in `server/index.js` as middleware in front of the `/api` routes and static files.
