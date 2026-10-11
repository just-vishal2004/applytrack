# ApplyTrack

ApplyTrack is a job application tracker for keeping a searchable record of applications, follow-ups, and hiring progress.

## Features

- Add, edit, and delete job applications.
- Track company, position, location, application date, follow-up date, job link, notes, and status.
- Search and filter applications, with paginated results.
- View totals and counts by status on the dashboard.
- Validate application fields and provide API health status.

## Technology

- **Frontend:** React 19, Vite, Lucide React, Recharts
- **Backend:** Node.js, Express 5
- **Database:** MongoDB with Mongoose
- **API tests:** Vitest and Supertest

## Requirements

- Node.js 20.19+ or 22.12+
- MongoDB connection string for running the app

## Setup

Install dependencies in each application directory:

```sh
cd server && npm install
cd ../client && npm install
```

Create `server/.env` (keep this file private) with:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/applytrack
PORT=5001
CLIENT_ORIGIN=http://localhost:5173
```

For a hosted MongoDB database, use its connection string as `MONGODB_URI`. Never commit credentials or real environment files.

## Run locally

In one terminal:

```sh
cd server && npm run dev
```

In another terminal:

```sh
cd client && npm run dev
```

Open the Vite URL shown in the client terminal (normally `http://localhost:5173`). The API runs on `http://localhost:5001`; its health endpoint is `/api/health`.

## Verify

Run backend API tests (they mock the Mongoose model and do not connect to or change MongoDB data):

```sh
cd server && npm test
```

Create a production frontend build:

```sh
cd client && npm run build
```

## AI Development Experience

This assessment requires the candidate to use CodeZero or Kiro. Record the tool actually used and the specific work completed with it here before submission. **Do not claim CodeZero or Kiro use unless that work was actually done.** If neither tool has been used yet, this requirement remains incomplete; use the required tool and replace this note with an accurate account of the prompts/tasks and resulting changes.
