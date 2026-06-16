# Avatar Exercise Buddy

AI-powered exercise coaching platform. Demonstrate any exercise to train the AI, then get real-time corrective feedback — via on-screen text, color-coded skeleton, and voice — while you work out.

## How it works

1. **Training Mode** — Perform an exercise in front of your webcam. The AI records your joint angles, timing, range of motion, and movement speed. Nothing is hardcoded — all thresholds are learned from your demonstration.
2. **Coach Mode** — Perform the same exercise. The AI compares your live movement against the recording and gives real-time feedback. Joint colours update every 500 ms; corrective voice messages fire at most every 5 seconds.

### Exercise modes

| Mode | Categories | How reps/holds are counted |
|------|------------|---------------------------|
| **Reps** | strength, cardio, martial arts, dance, custom | Midpoint-crossing on the dominant joint |
| **Hold** | stretching | Stable-position detection |
| **Sequence** | yoga, boxing | Multiple distinct poses/steps detected and clustered automatically |

---

## Quick start (two commands)

```bash
# terminal 1 — backend
cd backend && npm install && npm run dev

# terminal 2 — frontend
cd frontend && npm install && npm run dev
```

Open **http://localhost:3000**.

---

## Detailed installation guide

### Requirements

| Tool | Minimum version |
|------|----------------|
| Node.js | 18 or higher |
| npm | 9 or higher |

No database setup needed — SQLite is embedded and the file is created automatically on first run.

---

### 1. Clone the repository

```bash
git clone <repo-url>
cd temp_avatar
```

---

### 2. Backend

```bash
cd backend
```

**2a. Install dependencies**

```bash
npm install
```

**2b. Create the environment file**

```bash
cp .env.example .env
```

The defaults work out of the box for local development. The relevant values:

```
PORT=4000                          # port the API listens on
FRONTEND_URL=http://localhost:3000 # used for CORS
DB_PATH=./data/avatar_buddy.db     # SQLite file location (auto-created)
```

**2c. Start the backend**

```bash
npm run dev      # development — auto-restarts on file changes (nodemon)
# or
npm start        # production
```

The backend starts on **http://localhost:4000**. On first start it creates the SQLite database and seeds the default exercises automatically — no manual migration step required.

---

### 3. Frontend

Open a second terminal:

```bash
cd frontend
```

**3a. Install dependencies**

```bash
npm install
```

**3b. Create the environment file**

Create a file called `.env.local` in the `frontend/` directory:

```bash
# frontend/.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

If the backend runs on a different port or host, update this value.

**3c. Start the frontend**

```bash
npm run dev      # development with hot-reload
# or
npm run build && npm start   # production build
```

The frontend starts on **http://localhost:3000**.

---

### 4. Verify everything is running

| Service | URL | Expected response |
|---------|-----|-------------------|
| Frontend | http://localhost:3000 | Exercise selection screen |
| Backend API | http://localhost:4000/api/exercises | JSON list of exercises |
| WebSocket | ws://localhost:4000 | Connected automatically by the browser |

---

## Usage flow

1. Open **http://localhost:3000**
2. Click **+ New Exercise** to add your own, or select one of the seeded exercises
3. Click **Training Mode** → wait for the 3-second countdown → perform the exercise → **Stop & Save**
4. Go back → click **Coach Mode** → watch the avatar demonstrate your recorded movement → begin exercising and follow the real-time feedback

### Tips for good training data

- **Strength / reps** — perform 5–8 slow, controlled reps; keep form consistent
- **Yoga / sequence** — hold each pose for 3–5 seconds before moving to the next
- **Boxing / sequence** — perform the combination at moderate speed; pause briefly in the guard position between punches
- **Stretching / hold** — hold the target position for at least 5 seconds

---

## Feedback thresholds

### Reps mode

| Joint deviation | Status |
|----------------|--------|
| ≤ 10% of ROM | Good job |
| 10–15% of ROM | (silent) |
| 15–30% of ROM | Warning |
| > 30% of ROM | Error |

### Hold / Sequence mode (yoga, boxing, stretching)

Thresholds are adaptive — based on the standard deviation (σ) measured from your training data.

| Deviation | Status |
|-----------|--------|
| ≤ 1.5 σ | Good job |
| 1.5 – 3 σ | Warning |
| > 3 σ | Error |

---

## Project structure

```
temp_avatar/
├── backend/
│   ├── src/
│   │   ├── routes/           REST API (exercises, sessions)
│   │   ├── sockets/          WebSocket handlers (training & coaching events)
│   │   ├── services/
│   │   │   ├── trainingEngine.js   Learns exercise from demonstration
│   │   │   └── coachingEngine.js   Real-time form analysis
│   │   └── db/               SQLite schema + seed data
│   ├── data/                 SQLite database file (auto-created)
│   └── .env.example
├── frontend/
│   └── src/
│       ├── app/              Next.js pages
│       ├── components/
│       │   ├── Avatar/       Skeleton canvas renderer
│       │   └── Dashboard/    Home, Training, Coach views + Feedback panel
│       ├── hooks/            useSocket, useVoiceCoach
│       ├── lib/pose/         MoveNet pose detector (runs locally in browser)
│       └── store/            Zustand global state
├── shared/                   TypeScript types shared between frontend and backend
└── README.md
```

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TailwindCSS, Canvas 2D |
| Pose detection | MoveNet Lightning via TensorFlow.js (runs in browser, no video uploaded) |
| Backend | Node.js, Express, Socket.IO |
| Database | SQLite via better-sqlite3 |
| Realtime | WebSockets (Socket.IO) |

---

## Design principles

- **Zero hardcoded thresholds** — all angle limits, speed tolerances, ROM ranges, and pose targets come entirely from the training demonstration
- **Browser-side inference** — pose detection runs in the browser via WebGL; no video data ever leaves the device
- **Adaptive rep detection** — primary joint is identified automatically by variance; reps counted via midpoint-crossing; yoga/boxing positions clustered automatically
- **Decoupled feedback rates** — joint colour map updates every 500 ms; voice/text messages respect a 5-second cooldown to avoid noise
