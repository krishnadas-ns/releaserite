# ReleaseRite UI (Next.js + TypeScript)

This is a simple Next.js + React + TypeScript UI that talks to your FastAPI backend.

## Assumptions

- FastAPI exposes these endpoints:

  - `POST /api/v1/auth/login` — returns JSON with `access_token`
  - `GET /api/v1/auth/me` — returns info about the current user
  - `GET /api/v1/users` — list all users (requires Bearer token)
  - `POST /api/v1/users` — create a user (requires Bearer token)

Update the endpoint paths or request bodies as needed to match your backend.

## Setup

```bash
npm install
npm run dev
```

Make sure you have your FastAPI server running, and set:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` to point to your FastAPI URL.

## Environment

- `NEXT_PUBLIC_API_BASE_URL` — base URL of your FastAPI API
