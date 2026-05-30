# Sensor Alarm Dashboard

Detection sensor alarm dashboard for the Heckathon demo. Docker-ready monorepo with a React frontend and FastAPI backend.

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
| Dashboard | http://localhost:5173 |
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

## API (placeholder)

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /api/sensors` | List sensors (stub) |
| `GET /api/alarms` | List alarms (stub) |

These will be wired to real data in a later phase.
