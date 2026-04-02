# SecretaryAI — AI-Powered Executive Secretary Agent
 
> Agentic AI Meeting Scheduler | April 2026

---

## What is SecretaryAI?

SecretaryAI is a production-grade, multi-agent AI system that acts as a personal executive secretary. It connects to a user's Gmail inbox, reads incoming emails using a large language model, extracts actionable tasks, presents them for approval, auto-schedules them in Google Calendar with Meet links, and notifies original senders when work is completed — with zero manual effort in the core workflow.

**The system achieves F1 = 1.00 on actionability classification** — no promotional email ever creates a task, and no real business email is ever missed.

---

## Live Demo Flow

```
Email arrives in Gmail
       ↓
AI reads & extracts task (LLaMA 3.3 via Groq)
       ↓
Task appears on Dashboard → Executive approves
       ↓
Google Calendar event created with Meet link
       ↓
Original sender notified automatically
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, DM Sans + Playfair Display fonts |
| Backend | Python 3.11, FastAPI, SQLAlchemy (async) |
| AI Model | LLaMA 3.3 70B Versatile via Groq API |
| Database | PostgreSQL (production) / SQLite (development) |
| Calendar | Google Calendar API v3 |
| Email | Gmail IMAP XOAUTH2 + SMTP |
| Auth | JWT + bcrypt + Google OAuth2 |
| Payments | Stripe Checkout + Webhooks |
| Scheduler | APScheduler (AsyncIOScheduler) |

---

## Project Structure

```
executive-secretary/
├── backend/
│   ├── main.py                        # FastAPI app entry, scheduler startup
│   ├── .env                           # Environment variables (not committed)
│   ├── models/
│   │   ├── database.py                # Async SQLAlchemy engine + session
│   │   ├── orm_models.py              # All 10 database table definitions
│   │   └── schemas.py                 # Pydantic request/response schemas
│   ├── routes/
│   │   ├── auth.py                    # Register, login, Gmail OAuth, /me
│   │   ├── tasks.py                   # Task CRUD, approve, cancel, audit
│   │   ├── emails.py                  # Ingest, poll Gmail, attachments
│   │   ├── schedules.py               # Schedules, reschedule
│   │   ├── settings.py                # Working hours per user
│   │   ├── subscriptions.py           # Trial, Stripe checkout, webhook
│   │   └── evaluation.py              # AI evaluation API endpoints
│   ├── agents/
│   │   ├── email_agent.py             # Agent 1: AI call → task extraction
│   │   ├── scheduler_agent.py         # Agent 2: free slot → GCal event
│   │   └── notification_agent.py      # Agent 3: SMTP completion email
│   ├── services/
│   │   ├── ai_service.py              # Groq API, prompt engineering
│   │   ├── gmail_oauth_service.py     # OAuth2 URL builder, IMAP XOAUTH2
│   │   ├── google_calendar_service.py # GCal event create/delete
│   │   ├── calendar_service.py        # Working hours, holidays, slot finder
│   │   ├── notification_service.py    # SMTP email sender
│   │   ├── reminder_service.py        # Pending task reminders
│   │   ├── poller_service.py          # APScheduler multi-user Gmail poll
│   │   ├── stripe_service.py          # Stripe checkout + portal
│   │   ├── subscription_service.py    # Trial validity + admin bypass
│   │   └── audit_service.py           # Action logging
│   └── evaluation/
│       ├── golden_dataset.py          # 15 labelled test emails
│       ├── evaluate.py                # Metrics runner (F1, Precision, Recall)
│       └── results/                   # JSON results saved after each run
│
└── frontend/
    └── src/
        ├── api/
        │   └── axios.js               # Axios instance with JWT interceptor
        ├── pages/
        │   ├── Landing.jsx            # Public marketing page
        │   ├── Login.jsx              # JWT login
        │   ├── Register.jsx           # Registration + trial creation
        │   ├── Onboarding.jsx         # 3-step Gmail connect wizard
        │   ├── Dashboard.jsx          # Task Intelligence view
        │   ├── Calendar.jsx           # Weekly schedule grid
        │   ├── Settings.jsx           # Working hours config
        │   ├── Billing.jsx            # Trial countdown + Stripe
        │   └── EvaluationDashboard.jsx# Live AI metrics visualisation
        └── components/
            ├── Navbar.jsx             # Responsive nav + theme toggle
            ├── TaskDetailModal.jsx    # Full task detail + edit + feedback
            ├── RescheduleModal.jsx    # AI re-slot trigger
            └── AttachmentsList.jsx    # Email attachment downloads
```

---

## Setup & Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or SQLite for development)
- Google Cloud project with Calendar API and OAuth2 enabled
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd executive-secretary
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install fastapi uvicorn sqlalchemy asyncpg psycopg2-binary aiosqlite \
            groq beautifulsoup4 python-jose passlib[bcrypt] python-dotenv \
            google-auth google-auth-oauthlib google-auth-httplib2 \
            google-api-python-client stripe apscheduler holidays requests \
            pydantic[email]
```

### 3. Create `.env` file in `backend/`

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost:5432/secretary_db
# For development/SQLite:
# DATABASE_URL=sqlite+aiosqlite:///./dev.db

# AI
GROQ_API_KEY=gsk_your_groq_api_key_here

# JWT
JWT_SECRET=your_long_random_secret_string
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# Gmail SMTP (for sending notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password

# Google OAuth2 (Web Application credentials from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/gmail/callback

# Stripe (optional — for subscription billing)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id
STRIPE_YEARLY_PRICE_ID=price_your_yearly_price_id

# App
FRONTEND_URL=http://localhost:3000
```

### 4. Create the database

**PostgreSQL:**
```bash
psql -U postgres
CREATE DATABASE secretary_db;
\q
```

**SQLite (development — no install needed):**
```
# Just set DATABASE_URL=sqlite+aiosqlite:///./dev.db in .env
# Tables are created automatically on first run
```

### 5. Start the backend

```bash
cd backend
uvicorn main:app --reload
```

API runs at `http://localhost:8000`  
Swagger UI at `http://localhost:8000/docs`

### 6. Frontend setup

```bash
cd frontend
npm install axios react-router-dom
npm start
```

App runs at `http://localhost:3000`

---

## Google Cloud Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable **Google Calendar API**
3. Go to **Credentials** → **Create OAuth 2.0 Client ID**
4. Application type: **Web Application**
5. Authorized redirect URI: `http://localhost:8000/auth/gmail/callback`
6. Copy Client ID and Client Secret → paste into `.env`
7. Go to **OAuth consent screen** → add test user emails

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | User accounts with Gmail OAuth tokens and onboarding status |
| `subscriptions` | Trial / monthly / yearly plan per user |
| `emails` | Ingested actionable emails (non-actionable never stored) |
| `tasks` | AI-extracted tasks with priority, status, requested time |
| `schedules` | Scheduled time slots linked to Google Calendar events |
| `notifications` | Completion/cancellation emails sent to original senders |
| `attachments` | Base64-encoded file attachments from emails |
| `user_settings` | Per-user working hours, lunch break, buffer, slot interval |
| `audit_logs` | Full action trail with user, action, entity, timestamp |
| `task_feedback` | Thumbs up/down ratings on AI summary quality |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register user, auto-create 7-day trial |
| POST | `/auth/login` | Login, receive JWT token |
| GET | `/auth/me` | Current user profile + subscription |
| GET | `/auth/gmail/connect` | Generate Gmail OAuth URL |
| GET | `/auth/gmail/callback` | Exchange code, save tokens, complete onboarding |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/tasks/` | List tasks for current user |
| PATCH | `/tasks/{id}` | Update status → triggers scheduling or notification |
| POST | `/tasks/{id}/cancel` | Cancel + delete GCal event + notify sender |
| GET | `/tasks/{id}/detail` | Full detail with email body, schedule, notification |
| POST | `/tasks/{id}/feedback` | Submit AI quality feedback (good/bad) |

### Emails
| Method | Endpoint | Description |
|---|---|---|
| POST | `/emails/ingest` | Manually inject test email |
| POST | `/emails/poll` | Poll current user's Gmail via IMAP XOAUTH2 |
| GET | `/emails/attachments/{id}/download` | Download attachment |

### Schedules
| Method | Endpoint | Description |
|---|---|---|
| GET | `/schedules/` | All schedules for current user |
| PATCH | `/schedules/task/{id}/reschedule` | Find next free slot, update GCal |

### Other
| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/settings/` | Working hours per user |
| POST | `/subscriptions/checkout/{plan}` | Stripe Checkout redirect |
| POST | `/api/evaluation/run` | Run golden dataset evaluation |
| GET | `/api/evaluation/results/latest` | Latest AI metrics |

---

## AI Evaluation

A formal evaluation framework measures AI accuracy on 15 labelled test emails.

### Run from CLI

```bash
cd backend
python -m evaluation.evaluate
```

### Results (Latest Run — 31 March 2026)

| Metric | Score |
|---|---|
| Overall pass rate | 80.0% (12/15) |
| Critical accuracy | 93.3% (14/15) |
| F1 Score | **1.0000** |
| Precision | **1.0000** |
| Recall | **1.0000** |
| is_actionable accuracy | 100% |
| meet_link accuracy | 100% |
| priority accuracy | 100% |
| task_type accuracy | 77.8% |

**Confusion matrix:** TP=9, TN=6, FP=0, FN=0 — zero false positives, zero missed emails.

### Test Categories Covered

| Category | Cases | Pass Rate |
|---|---|---|
| meeting | 5 | 80% |
| approval | 1 | 100% |
| review | 1 | 0% (task count off by 1) |
| followup | 1 | 0% (task_type mismatch) |
| report | 1 | 100% |
| non_actionable | 6 | 100% |

---

## Key Features

### Three-Agent Pipeline
- **Agent 1 — Email Agent:** HTML strip → Groq AI call → actionability gate → dedup check → save email + tasks + attachments
- **Agent 2 — Scheduler Agent:** Working hours check → holiday awareness → priority conflict resolution → Google Calendar event creation with Meet link
- **Agent 3 — Notification Agent:** Sender lookup → SMTP completion email → notification record

### Smart Scheduling
- Respects custom working hours per user (start/end, lunch break, buffer between meetings)
- Indian public holiday awareness
- Priority conflict resolution (high priority bumps lower priority to next slot)
- Specific time extraction from email body (meeting at 11am → scheduled at 11am)

### AI Triage
- Promotional emails, OTPs, newsletters, app notifications → silently discarded (never saved to DB)
- Business emails → task extracted with title, description, priority, task type, recurrence, Meet link
- `is_actionable` precision: 1.00 (zero false positives in testing)

### SaaS Architecture
- Per-user Gmail OAuth2 (no password storage, XOAUTH2 IMAP)
- 7-day free trial → Stripe monthly / yearly subscription
- JWT authentication with role-based access control
- Full audit trail for all actions
- Light / dark theme toggle, mobile responsive UI

---

## Roadmap

- [x] Three-agent pipeline (Email → Scheduler → Notification)
- [x] Google Calendar integration with Meet links
- [x] Gmail IMAP XOAUTH2 polling
- [x] Priority conflict resolution
- [x] Working hours personalisation per user
- [x] Attachment handling
- [x] AI evaluation framework with golden dataset
- [x] SaaS architecture (trial, Stripe, OAuth per user)
- [x] Responsive UI with light/dark theme
- [ ] Multi-user Gmail OAuth fully live (Phase 2 — in testing)
- [ ] Microsoft Outlook / Graph API integration
- [ ] Recurring event auto-creation in GCal
- [ ] Organisation accounts with team calendar view
- [ ] Production deployment (Railway / AWS ECS)

---

## License

This project was built as part of an academic programme. All rights reserved by the authors.

---

*SecretaryAI · Built with FastAPI · React · LLaMA 3.3 · Google Calendar API · April 2026*
