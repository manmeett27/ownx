# OWNX Project Run Commands Cheatsheet

A complete reference for running all services, microservices, frontend, seed scripts, and tests across the OWNX ecosystem.

---

## 🚀 Quick Reference: Service & Port Mapping

| Service | Port | Directory | Direct Command | Batch Script |
| :--- | :--- | :--- | :--- | :--- |
| **All Services (Master)** | Multiple | Root | `run_all.bat` | `.\run_all.bat` |
| **Frontend (React + Vite)** | `3000` (or 3001/3002 if in use) | `frontend/` | `npm run dev` | — |
| **Node.js Express Backend** | `5000` | Root | `node server.js` | `.\run_backend.bat` |
| **Content Moderation AI** | `5001` | Root / `content_moderator/` | `python content_moderator/main.py` | `.\run_moderator.bat` |
| **Feed Recommendation API** | `5002` | Root / `feed_recommendation_system/` | `python feed_recommendation_system/main.py` | `.\run_feed.bat` |
| **ALS Recommendation Engine**| `5003` | Root / `recommendation_engine/` | `python recommendation_engine/main.py` | `.\run_recommender.bat` |

---

## ⚡ 1. Master Startup (All-in-One)

To launch all backend microservices simultaneously in separate console windows:

```bash
# Windows Command Prompt / PowerShell (from root directory)
.\run_all.bat
```

> **Note:** To start the frontend alongside the backend services, open a new terminal tab and run `npm run dev` inside `frontend/`.

---

## 💻 2. Frontend (React + Vite)

Located in `frontend/`.

### Installation
```bash
cd frontend
npm install
```

### Run Development Server
```bash
cd frontend
npm run dev
```

> The frontend UI will be available at [http://localhost:3000](http://localhost:3000).
> If port 3000 is in use, Vite will auto-select 3001 or 3002 — check the terminal output.

### Build for Production
```bash
cd frontend
npm run build
```

### Preview Production Build
```bash
cd frontend
npm run preview
```

---

## 🖥️ 3. Node.js Express Backend (Port 5000)

Located in the project root. Uses in-memory MockDbPool when PostgreSQL is not available.

### Installation
```bash
npm install
```

### Run Backend Server
```bash
# Option A: Using batch script
.\run_backend.bat

# Option B: Direct Node command
node server.js
```

> Backend API will be active at [http://127.0.0.1:5000](http://127.0.0.1:5000).

### API Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | No | Health check |
| `POST` | `/api/users/register` | No | Register → returns `{ token, user }` |
| `POST` | `/api/users/login` | No | Login → returns `{ token, user }` |
| `GET` | `/api/users/me` | JWT | Get current user profile |
| `GET` | `/api/users/:id` | No | Get user by ID |
| `PUT` | `/api/users/:id` | JWT | Update profile fields |
| `PUT` | `/api/users/profile/photo` | JWT | Upload profile photo to Cloudinary |
| `GET` | `/api/posts` | No | Get all posts (populated with author) |
| `POST` | `/api/posts` | JWT | Create post (multipart, author from JWT) |
| `GET` | `/api/posts/:id/comments` | No | Get post comments |
| `POST` | `/api/posts/:id/comments` | JWT | Add comment |

### Database Strategy
- If PostgreSQL (port 5432) is available → uses real SQL database
- If PostgreSQL is NOT available → automatically falls back to **in-memory MockDbPool** (data resets on restart)

### Seed Database (Optional, requires PostgreSQL)
```bash
node seed_supabase.js
```

### Cloudinary Configuration (.env)
Cloudinary is configured for **server-side secure uploads** only. The API secret is never exposed to the frontend.

Required `.env` entries:
```env
CLOUDINARY_CLOUD_NAME=ownx
CLOUDINARY_API_KEY=129472512876116
CLOUDINARY_API_SECRET=<your_secret_here>
```

> **Security Note:** `CLOUDINARY_API_SECRET` remains strictly server-side in Node.js and is NEVER exposed to the frontend browser.

---

## 🔐 4. Authentication Flow

OWNX uses **JWT-based authentication** (HS256, 7-day expiry).

| Step | Action | Details |
| :--- | :--- | :--- |
| 1 | Register (`POST /api/users/register`) | Returns `{ message, token, user }` |
| 2 | Login (`POST /api/users/login`) | Returns `{ message, token, user }` |
| 3 | Store token | Frontend stores JWT in `localStorage` as `ownx_token` |
| 4 | Authenticated requests | `Authorization: Bearer <token>` header |
| 5 | Post creation | Author is always derived from JWT, never from request body |

---

## 🤖 5. AI & Python Microservices

### 5.1 Content Moderation AI Service (Port 5001)

Performs NLP text moderation and CNN computer vision moderation.

#### Install Dependencies
```bash
pip install -r content_moderator/requirements.txt
```

#### Train / Re-train Model Weights (Optional)
```bash
python content_moderator/train.py
```

#### Run Content Moderator
```bash
# Option A: Using batch script (automatically trains if weights missing)
.\run_moderator.bat

# Option B: Direct Python command
python content_moderator/main.py
```

> API will be active at [http://127.0.0.1:5001](http://127.0.0.1:5001). Interactive docs: [http://127.0.0.1:5001/docs](http://127.0.0.1:5001/docs).

---

### 5.2 Feed Recommendation System (Port 5002)

FastAPI service computing multi-factor candidate scoring and feeds.

#### Run Feed System
```bash
# Option A: Using batch script
.\run_feed.bat

# Option B: Direct Python command
python feed_recommendation_system/main.py
```

> API will be active at [http://127.0.0.1:5002](http://127.0.0.1:5002). Interactive docs: [http://127.0.0.1:5002/docs](http://127.0.0.1:5002/docs).

---

### 5.3 Implicit ALS Recommendation Engine (Port 5003)

Collaborative filtering and implicit feedback recommendation engine.

#### Install Dependencies
```bash
pip install -r recommendation_engine/requirements.txt
```

#### Run Recommendation Engine
```bash
# Option A: Using batch script
.\run_recommender.bat

# Option B: Direct Python command
python recommendation_engine/main.py
```

> API will be active at [http://127.0.0.1:5003](http://127.0.0.1:5003). Interactive docs: [http://127.0.0.1:5003/docs](http://127.0.0.1:5003/docs).

---

## 🧪 6. Testing & Verification

### Full Service Integration Test
```bash
python test_all_services.py
```

### Quick API Health Check (PowerShell)
```powershell
# Node.js Backend
Invoke-WebRequest -Uri "http://127.0.0.1:5000/" -UseBasicParsing | Select-Object -ExpandProperty Content

# Content Moderation API
Invoke-WebRequest -Uri "http://127.0.0.1:5001/" -UseBasicParsing | Select-Object -ExpandProperty Content

# Feed Recommendation API
Invoke-WebRequest -Uri "http://127.0.0.1:5002/" -UseBasicParsing | Select-Object -ExpandProperty Content

# ALS Recommender Engine API
Invoke-WebRequest -Uri "http://127.0.0.1:5003/" -UseBasicParsing | Select-Object -ExpandProperty Content
```

---

## ✅ Production Readiness Status

| Feature | Status | Notes |
| :--- | :--- | :--- |
| User Registration | ✅ Working | Returns JWT token + user object |
| User Login | ✅ Working | bcrypt password verification |
| JWT Authentication | ✅ Working | 7-day expiry, Bearer token |
| Create Post (text) | ✅ Working | Author from JWT (never "Anonymous") |
| Create Post (image/video) | ✅ Working | Multipart → Cloudinary upload |
| Author Population in Feed | ✅ Working | `author.name` correctly resolved |
| Profile Photo Upload | ✅ Working | Cloudinary with server-side credentials |
| Profile Update | ✅ Working | Name, bio, location, etc. |
| Comment Creation | ✅ Working | Username from JWT on backend |
| Cloudinary Integration | ✅ Configured | Cloud name: `ownx`, server-side only |
| PostgreSQL | ⚠️ Optional | Falls back to MockDbPool if unavailable |

