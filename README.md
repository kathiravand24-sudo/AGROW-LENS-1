
# AGROW Lens Platform

## Project Structure
This project is a monorepo containing:
- **Frontend** (`agrow-platform/frontend`): Next.js application (Farmer Dashboard).
- **Backend** (`agrow-platform/backend`): Express.js + TypeScript API (AI Engine & Database).

## 🚀 How to Run Locally

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Start Backend
The backend handles the AI diagnostics and database (local JSON file).
```bash
cd agrow-platform/backend
npm install
npm run dev
```
*Port: 3001*

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

### Backend (API)
**Platform: Render / Railway / Heroku**
> **Note**: The backend uses a local file-based database (`data/db.json`). While this works perfect locally, on serverless platforms (like Vercel), the data will reset periodically. For production, you should connect to a cloud database (MongoDB/Postgres).

For a simple deployment (Database will reset on restart):
1.  Deploy to **Render.com** (Web Service).
2.  Set **Root Directory** to `agrow-platform/backend`.
3.  **Build Command**: `npm install && npm run build`
4.  **Start Command**: `npm start`
5.  Add Environment Variables:
    - `GEMINI_API_KEY`: [Your Google Gemini Key]
    - `PORT`: 3001 (or default)

---
© 2026 AGROW Lens Initiative
