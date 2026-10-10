# MindBlow

MindBlow is an AI-powered quiz generation platform that turns uploaded course materials into ready-to-use quizzes. Users upload a document, set quiz parameters, and receive an AI-generated quiz they can review, manage, and revisit later. Admins can moderate users, monitor activity logs, send announcements, and fine-tune the underlying AI prompt that drives quiz generation.

- **Version:** v2.0 (current release: v1.0)
- **Status:** Post-production. The project is deployed.
- **Live site:** https://www.mindblow.online/
- **Repository:** https://github.com/redsaucce/mindblow-test

## Features

- Upload PDF or DOCX files (up to 10 MB).
- Generate multiple choice, true or false, and identification quizzes of 25 to 50 questions.
- Download a single quiz, or several at once as a ZIP (up to 50 per download).
- Sign in with a magic link sent by email. There are no passwords.
- Admin dashboard: stats, user management, activity logs, and the quiz generation prompt.

## Tech stack

| Area | Technology | Host |
|---|---|---|
| Frontend (`client/`) | Next.js 16, React 19, Tailwind CSS v4, TanStack Query, Recharts | Vercel |
| Backend (`server/`) | FastAPI, SQLAlchemy (async), Alembic migrations | Render |
| Database | PostgreSQL | Supabase |
| AI | Google Gemini (quiz generation and embeddings) | Google AI |
| Email | Resend (sign-in emails) | Resend |

## Project structure

```
mind-blow/
├── client/     Next.js frontend
├── server/     FastAPI backend
├── .gitignore
└── README.md
```

## Setup

### Get the code

```bash
git clone https://github.com/redsaucce/mindblow-test.git
cd mindblow-test
```

### Prerequisites

- Node.js and npm
- Python 3.12 or later
- A PostgreSQL database (the project uses Supabase)
- A Gemini API key and a Resend API key

### 1. Backend

From `server/`:

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt   # or requirements.txt for production only
```

Create `server/.env`:

```dotenv
DATABASE_URL=postgresql+asyncpg://db_user:your-db-password@db.example.com:5432/db_name
JWT_SECRET=at-least-32-random-characters
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30
RESEND_API_KEY=re_your_resend_api_key_here
MAIL_FROM=noreply@example.com
GEMINI_API_KEY=your-gemini-api-key-here
FRONTEND_URL=http://localhost:3000
```

Apply the database migrations, then start the server with **one worker**:

```bash
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

The quiz rate limit is kept in memory, so the server must run as a single process. Do not add workers.

### 2. Frontend

From `client/`:

```bash
npm install
```

Create `client/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then run the app:

```bash
npm run dev
```

Open http://localhost:3000.

### Build

```bash
cd client && npm run build
```

## Configuration notes

- `FRONTEND_URL` has no default. The server won't start without it.
- `JWT_SECRET` must be at least 32 characters.
- `NEXT_PUBLIC_API_URL` must be set before the frontend builds. The build fails without it.
- Session cookies use `Secure` and `SameSite=None`, so sign-in works over HTTPS. Local sign-in over plain HTTP depends on the browser.

## Known limitations

- The quiz rate limit (5 per minute app-wide, 2 per user) lives in server memory, so it only works with one server process.
- Each quiz download is capped at 50 quizzes.
- The admin user and activity lists show all rows, with no paging.
- Errors in the root layout show Next.js's default error page.

## Deployment

| Part | Host | Notes |
|---|---|---|
| Frontend (`client/`) | Vercel | Set `NEXT_PUBLIC_API_URL` to the Render API URL. The build fails without it. |
| Backend (`server/`) | Render | Set the `server/.env` variables in Render. Start the service with one worker. |
| Database | Supabase | Use the Supabase PostgreSQL connection string for `DATABASE_URL`. |

Set `FRONTEND_URL` on the backend to `https://www.mindblow.online`. Run `alembic upgrade head` against the production database before deploying a release that changes the models.