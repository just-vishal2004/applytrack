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

### Tool: CodeZero

CodeZero was installed in Visual Studio Code and connected to the
ApplyTrack GitHub repository to explore its codebase and development
workflow.

The setup process included:
- Connecting the ApplyTrack repository to CodeZero.
- Selecting the repository for indexing.
- Attempting to configure a compatible coding agent.
- Investigating the agent configuration issue when CodeZero could
  not initialize the configured provider.

The coding-agent configuration was not completed successfully.
Consequently, no application code changes are attributed to CodeZero.

### Development and Verification

ApplyTrack was developed using React, Vite, Node.js, Express,
MongoDB, and Mongoose.

The completed project was verified through:
- Four passing backend API tests using Vitest and Supertest.
- A successful Vite production build.
- Verification of the public GitHub repository and committed changes.
