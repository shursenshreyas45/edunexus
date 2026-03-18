# EduNexus

A cross-platform ecosystem for students to buy, sell, and discuss academic resources — a circular economy for study materials.

## What it does

- **Marketplace** — List and discover textbooks, notes, bundles, and tech gear from fellow students
- **War Rooms** — Community discussion boards organized by exam tags (#JEE, #NEET, #UPSC, etc.)
- **Directory** — Find and connect with seniors and mentors at your school
- **Profiles** — Build a student identity with school, batch year, tier, and bio

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Expo (React Native) — iOS, Android, Web |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL via Supabase |
| Storage | Supabase Storage (listing images) |
| Navigation | Expo Router (file-based) |
| Auth | Session tokens stored in Supabase `sessions` table |

## Project Structure

```
edunexus/
├── apps/
│   ├── api/          # Express REST API
│   └── client/       # Expo React Native app
└── packages/
    └── shared/       # Shared TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with PostgreSQL

### 1. Clone and install

```bash
git clone https://github.com/shursenshreyas45/edunexus.git
cd edunexus
npm install
```

### 2. Set up the database

Run the schema files against your Supabase project (SQL Editor or `psql`):

```bash
# Apply in this order
apps/api/schema_listings.sql
apps/api/schema_profiles.sql
apps/api/schema_posts.sql

# If upgrading an existing DB
apps/api/migrate_add_image_url.sql
```

Create a **public** Storage bucket named `listings` in your Supabase dashboard.

### 3. Configure environment variables

**`apps/api/.env`**
```env
PORT=3000
DATABASE_URL=your_supabase_postgres_connection_string
JWT_SECRET=your_secret_key
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**`apps/client/.env`**
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 4. Run

```bash
# Run API + client together
npm run dev

# Or individually
cd apps/api && npm run dev
cd apps/client && npx expo start
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Create account |
| POST | `/login` | — | Login, returns session token |
| GET | `/profile/me` | ✓ | Get own profile |
| PUT | `/profile/me` | ✓ | Create or update profile |
| GET | `/profiles/search` | ✓ | Search users by name/school/tier |
| GET | `/listings` | ✓ | Paginated listings feed |
| POST | `/listings` | ✓ | Create listing (supports Base64 image) |
| GET | `/listings/:id` | ✓ | Get single listing |
| GET | `/posts` | ✓ | Paginated posts feed (filterable by tag) |
| POST | `/posts` | ✓ | Create post |
| GET | `/posts/:id` | ✓ | Get post with comments |
| POST | `/posts/:id/comments` | ✓ | Add comment |

## Image Uploads

Listing images are uploaded as Base64 strings from the client. The API decodes them, uploads to the Supabase `listings` storage bucket, and stores the public URL in the database. The Express JSON limit is set to 50 MB to accommodate this.

## User Tiers

Users register with one of three tiers:

- **Junior** — Students currently studying
- **Senior** — Students who have completed the exam/course
- **Mentor** — Experienced guides available for outreach
