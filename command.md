# OWNX Project Run Commands Cheatsheet

A complete reference for running all services, microservices, frontend, seed scripts, and tests across the OWNX ecosystem.

---

## 🚀 Quick Reference: Service & Port Mapping

| Service | Port | Directory | Direct Command | Batch Script |
| :--- | :--- | :--- | :--- | :--- |
| **All Services (Master)** | Multiple | Root | `run_all.bat` | `.\run_all.bat` |
| **Frontend (React + Vite)** | `3000` | `frontend/` | `npm run dev` | — |
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

### Run Development Server (Port 3000)
```bash
cd frontend
npm run dev
```
> The frontend UI will be available at [http://localhost:3000](http://localhost:3000).

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

Located in the project root. Connects to Supabase / PostgreSQL (with automatic in-memory mock fallback).

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

### Seed Database (Optional)
```bash
node seed_supabase.js
```

---

## 🤖 4. AI & Python Microservices

### 4.1 Content Moderation AI Service (Port 5001)

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

### 4.2 Feed Recommendation System (Port 5002)

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

### 4.3 Implicit ALS Recommendation Engine (Port 5003)

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

## 🧪 5. Testing & Verification

### Run Full Integration Test Suite
Spins up all microservices and runs end-to-end tests across all endpoints:

```bash
python test_all_services.py
```

### Health Check Commands (cURL / PowerShell)

```bash
# Node.js Backend
curl http://127.0.0.1:5000/

# Content Moderation API
curl http://127.0.0.1:5001/

# Feed Recommendation API
curl http://127.0.0.1:5002/

# ALS Recommender Engine API
curl http://127.0.0.1:5003/
```
