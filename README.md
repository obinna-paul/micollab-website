# StageLoop 🚀

A social-first platform for creatives to showcase portfolios, build audiences, and monetize exclusive content.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lucide React, Axios
- **Backend**: Node.js, Express, Prisma ORM, SQLite (Dev)
- **Database**: SQLite (initialized via Prisma)

## Getting Started

### 1. Prerequisites

- Node.js installed

### 2. Backend Setup

```bash
cd server
npm install
npx prisma db push
npx prisma db seed
npm start
```

The server will run on `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

The app will run on `http://localhost:5173`.

## Current Features (MVP Phase 1)

- ✅ **Modern Dark Layout**: Cinematic UI with sidebars.
- ✅ **Dynamic Feed**: Fetches posts from the backend.
- ✅ **Premium Content Handling**: Visual locks on exclusive posts with blur effects.
- ✅ **Trending Creators**: Sidebar showing top creatives based on engagement.
- ✅ **Frictionless Setup**: Pre-seeded with sample data for immediate demo.

## Next Steps

- [ ] JWT Authentication (Register/Login)
- [ ] User Profile Pages
- [ ] Post Creation (Media Uploads)
- [ ] Real-time Notifications
- [ ] Stripe Integration for Subscriptions
