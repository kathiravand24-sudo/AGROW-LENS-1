
# AGROW Lens Platform

## Project Structure
This project is a monorepo containing:
- **Frontend** (`agrow-platform/frontend`): Next.js application (Farmer Dashboard).
- **Backend (Node)** (`agrow-platform/backend`): Express.js + TypeScript API (AI Engine & Database).
- **Backend (Python)** (`agrow-platform/py-backend`): Flask API (Plant Disease Identification via AI models).

## 🚀 How to Run Locally

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2a. Start Node Backend
The Node backend handles general platform logic and the database.
```bash
cd agrow-platform/backend
npm install
npm run dev
```
*Port: 3001*

### 2b. Start Python Backend (AI Engine)
The Python backend handles plant disease identification using AI models.
```bash
cd agrow-platform/py-backend
# Use the batch script for easy start
./start_backend.bat
```
*Port: 5000*

### 3. Start Frontend
The frontend is the user interface.
```bash
cd agrow-platform/frontend
npm install
npm run dev
```
*Port: 3000*
*URL: http://localhost:3000*

## ☁️ Deployment Guide

### Frontend (User Interface)
**Platform: Vercel** (Recommended)
1.  Push this code to GitHub.
2.  Import the repository in Vercel.
3.  **Critical Step**: In Vercel Project Settings, set the **Root Directory** to `agrow-platform/frontend`.
4.  Deploy.

### Python Backend (AI Engine)
**Platform: Render / Railway / Hugging Face Spaces**
> **Note**: This backend uses `torch` and `transformers`, which exceed Vercel's size limits.
1.  Deploy to **Render.com** (Web Service).
2.  Set **Root Directory** to `agrow-platform/py-backend`.
3.  **Build Command**: `pip install -r requirements.txt`
4.  **Start Command**: `python app.py` (or `gunicorn app:app`)
5.  Add Environment Variables:
    - `PLANTNET_API_KEY`: [Your PlantNet API Key]

---
© 2026 AGROW Lens Initiative
