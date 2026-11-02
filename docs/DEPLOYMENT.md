# Production deployment walkthrough

This repository is set up for a single-origin deployment on Render: Render builds the React client and runs it with the Express API in one Node web service. This keeps browser sessions and evidence requests on the same HTTPS origin. MongoDB Atlas stores cases; Cloudinary is used for durable generated images when configured.

## 1. Prepare the repository

Push the project to a GitHub repository that your Render account can access. Keep `.env`, `client/.env`, and `server/.env` out of Git; `.gitignore` already excludes them. The committed `render.yaml` defines the service and build commands.

If this folder is not already connected to Git, create a repository in GitHub, then from the project folder run:

```powershell
git init
git add .
git commit -m "Prepare AI Mystery Room for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
```

If `git init` says the repository already exists, skip that command. If the remote is already configured, skip `git remote add`.

## 2. Create the MongoDB Atlas database

1. Create an Atlas project and cluster. Choose AWS Singapore to be near the Render region selected by `render.yaml`; Atlas documents the Render integration and region pairing [here](https://www.mongodb.com/docs/atlas/reference/partner-integrations/render/).
2. In **Database Access**, create a database user for this app. Give it read/write access to the app database; use a unique password.
3. In **Network Access**, allow the Render service to connect. After creating the Render service in step 4, copy the service's outbound IP ranges from **Connect → Outbound** and add those CIDR ranges to Atlas. Atlas rejects connections from addresses not on its IP access list. Avoid leaving `0.0.0.0/0` as a production rule; that allows connections from every IPv4 address.
4. In Atlas, choose **Connect → Drivers** and copy the Node.js connection string. Replace the username/password placeholders, URL-encode special characters in the password, and keep the database name in the URI (for example, `ai-mystery-room`). This value becomes `MONGODB_URI` in Render.

## 3. Prepare provider credentials

1. In [Google AI Studio](https://aistudio.google.com/app/apikey), create or copy a Gemini API key. This stays on the server as `GEMINI_API_KEY`; never put it in a `VITE_` variable. Google's current key guidance is in the [Gemini API key docs](https://ai.google.dev/gemini-api/docs/api-key).
2. For generated evidence images to survive Render restarts and redeploys, create a Cloudinary account. From its Console **Settings → API Keys**, copy the `CLOUDINARY_URL`. The server uploads images through Cloudinary's Node SDK; see [Cloudinary's Node.js configuration docs](https://cloudinary.com/documentation/node_integration).

Cloudinary is optional for a quick preview. Without it, generated image files use the service's local filesystem. Render's filesystem is ephemeral by default, so those local image files can disappear on restart or deploy; MongoDB case records remain stored.

## 4. Create the Render service

1. In Render, choose **New → Blueprint** and connect the GitHub repository.
2. Render reads `render.yaml`. Choose the `ai-mystery-room` web service and confirm the Singapore region.
3. Render asks for the two Blueprint values marked `sync: false`: `MONGODB_URI` and `GEMINI_API_KEY`. Paste the values from the earlier steps. Do not paste either value into a committed file.
4. After the service exists, open its **Environment** page and add `CLOUDINARY_URL` if you want durable generated images. Render generates `SESSION_SECRET` from the Blueprint; keep it private and do not rotate it casually, since it signs anonymous case session cookies.
5. In Render **Connect → Outbound**, copy the listed IP ranges. Add them in Atlas **Network Access** if you have not already done so. If the initial deploy cannot reach Atlas, add these ranges and redeploy.
6. Wait for the deploy to finish. The Blueprint uses `npm ci`, builds `client/dist`, starts the API with `npm start`, and checks `/api/v1/health`.

The equivalent manual Render settings are: **Root Directory** `.`, **Runtime** Node, **Build Command** `npm ci && npm ci --prefix server && npm ci --prefix client && npm run build`, **Start Command** `npm start`, and **Health Check Path** `/api/v1/health`. Add the same environment variables listed in step 4. Render web services must listen on the `PORT` environment variable and bind to `0.0.0.0`; this project does both.

## 5. Verify the live app

1. Open the `onrender.com` URL shown on the service page. The landing page should load from Express.
2. Open `/api/v1/health` on that same host; it should return `{"success":true,"data":{"status":"ok"}}`.
3. Generate a case and open one image exhibit. If Cloudinary is configured and the Gemini image model is available, the image is stored in Cloudinary. Otherwise the UI labels the descriptive fallback.
4. Submit an accusation to confirm the result and saved solution are returned only after submission.
5. Review Render deploy logs for startup, Atlas connectivity, or Gemini credential errors. Confirm no secrets were committed to GitHub.

## 6. Updates and custom domains

Push future changes to the connected branch; Render automatically starts a new deploy. To use a custom domain, add it from the Render service's **Settings → Custom Domains** page and follow the DNS instructions shown there. Render provisions HTTPS for configured custom domains.

## Local production build

After installing the root, server, and client dependencies, run `npm run build`. To serve that build locally, set `NODE_ENV=production` in `server/.env` and run `npm start`; the server serves the compiled React app and API from one origin.
