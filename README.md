# Taba Foundation Donation Management System (Starter Template)

Full-stack starter template with a reusable architecture for donation tracking.

## Stack

- Frontend: React 19 + TypeScript + Vite + Tailwind CSS + Recharts + jsPDF + Lucide + date-fns
- Backend: Node.js + Express + TypeScript + MongoDB (Mongoose) + JWT + bcryptjs + Nodemailer + express-validator + express-rate-limit
- Auth UI: Not included (as requested)

## Project Structure

```text
tfms/
  client/   # React app
  server/   # Express API
```

## Run Locally

1. Configure environment files:
   - Copy `client/.env.example` to `client/.env`
   - Copy `server/.env.example` to `server/.env`
2. Start backend:
   - `cd server`
   - `npm run dev`
3. Start frontend:
   - `cd client`
   - `npm run dev`

## Build

- Frontend: `cd client && npm run build`
- Backend: `cd server && npm run build`

## API Highlights

- `GET /api/health`
- `POST /api/auth/token` (passcode-based token issue for admin APIs)
- `GET /api/donations`
- `GET /api/donations/stats`
- `POST /api/donations`
- `POST /api/donations/:id/receipt/email`
- `DELETE /api/donations/:id` (JWT protected)

## Notes

- Theme is navy blue + white.
- Code is split into reusable components/services/hooks/data files.
- Receipt PDF generation is handled on frontend with jsPDF.
- Receipt email sending is handled on backend with Nodemailer.

## Deploy to Vercel (Beginner Friendly)

Use **two Vercel projects** from the same GitHub repository:

1. **Backend project**
   - Import repo in Vercel
   - Set **Root Directory** to `server`
   - Vercel config is already included in `server/vercel.json`
   - Add Environment Variables:
     - `NODE_ENV=production`
     - `MONGODB_URI=<your mongo connection string>`
     - `CLIENT_URL=<your frontend vercel url>`
     - `JWT_SECRET=<strong secret>`
     - `JWT_EXPIRES_IN=1d`
     - `ADMIN_PASSCODE=<your admin passcode>`
     - `EMAIL_FROM=<optional>`
     - `SMTP_HOST=<optional>`
     - `SMTP_PORT=587` (or your value)
     - `SMTP_SECURE=false` (or true)
     - `SMTP_USER=<optional>`
     - `SMTP_PASS=<optional>`
   - Deploy and copy URL, e.g. `https://your-api.vercel.app`

2. **Frontend project**
   - Import same repo in Vercel again
   - Set **Root Directory** to `client`
   - Add Environment Variable:
     - `VITE_API_URL=https://your-api.vercel.app/api`
   - Deploy and copy frontend URL

3. **Final CORS step**
   - Go back to backend project environment variable `CLIENT_URL`
   - Set it to the deployed frontend URL
   - Redeploy backend

4. **Quick test**
   - Open: `https://your-api.vercel.app/api/health`
   - Open frontend and verify: create contributor, add donation, reports, settings export/import
