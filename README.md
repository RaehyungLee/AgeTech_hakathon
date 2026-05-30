# Kinu — Sensor Alarm Dashboard

A cute, calm mobile-first elder care monitoring app for the Heckathon demo. Docker-ready with React frontend and FastAPI backend.

## Brief plan

| Phase | Goal |
|-------|------|
| **1. Setup** (done) | Docker, repo structure, API + frontend skeleton |
| **2. Design** (next) | Dashboard layout, alarm UI, sensor status cards |
| **3. Data layer** | Connect real sensors or mock event stream |
| **4. Real-time** | WebSocket/SSE for live alarm notifications |
| **5. Demo polish** | Seed data, alert sounds, deploy instructions |

### Architecture (target)

```
Sensors / mock feed  →  Backend API  →  Dashboard UI
                         (FastAPI)      (React)
```

## Quick start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

### Run with Docker

```bash
cp .env.example .env
docker compose up --build
```

| Service  | URL |
|----------|-----|
| Dashboard | http://localhost:5173 (mobile app UI — use phone or narrow browser) |
| API       | http://localhost:8000 |
| API docs  | http://localhost:8000/docs |

### Local development (without Docker)

**Backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

## Project structure

```
.
├── backend/          # FastAPI — sensor & alarm endpoints
├── frontend/         # React + Vite — dashboard UI
├── docker-compose.yml
├── .env.example
└── README.md
```

## GitHub

1. Create a new repository on GitHub.
2. Push this project:

```bash
git init
git add .
git commit -m "Initial project setup for sensor alarm dashboard"
git branch -M main
git remote add origin git@github.com:RaehyungLee/AgeTech_hakathon.git
git push -u origin main
```

## Mobile demo

- Open **http://localhost:5173** on your phone (same Wi‑Fi as your machine)
- Or use Chrome DevTools → device toolbar for a phone preview
- On desktop, Kinu appears inside a phone frame for presentation
- **Add to Home Screen** (PWA) for a full-screen app-like demo

### Tabs

| Tab | Purpose |
|-----|---------|
| **Home** | Calm overview, quick alert preview |
| **Sensors** | All sensors, battery, custom naming |
| **Alerts** | Anomaly feed with acknowledge |
| **Care** | Beauty & wellness — calm score, rest, ambient comfort, daily bloom |

## API

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /api/summary` | Dashboard stats |
| `GET /api/sensors` | List sensors |
| `PATCH /api/sensors/{id}` | Rename a sensor |
| `GET /api/anomalies` | List anomaly alerts |
| `PATCH /api/anomalies/{id}/acknowledge` | Acknowledge alert |
| `GET /api/care` | Care & beauty wellness insights |
| `POST /api/auth/login` | Sign in (demo accounts) |
| `GET /api/auth/me` | Current user & care circle |
| `GET /api/emergency/{anomaly_id}` | Local emergency info for critical alert |
| `POST /api/emergency/{anomaly_id}/call` | Log caregiver emergency call |

## Demo accounts

| Email | Role | Password |
|-------|------|----------|
| `daughter@kinu.demo` | Daughter (caregiver) | `demo123` |
| `father@kinu.demo` | Father (resident) | `demo123` |

Sign in as **Daughter**, open **Anomalies**, and tap **Call local emergency** on a critical alert to dial **911** for Father's San Francisco home location.

## Privacy model (demo)

Shared caregivers only see **critical, unacknowledged** alerts. Sensors, wellness, address, and warning/info alerts stay private until a critical issue is active. Acknowledging the last critical alert returns the app to private mode.
