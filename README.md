# 🚀 Lighthouse AI — MERN Stack

A full-stack AI-powered data analytics platform built with **MongoDB, Express, React, and Node.js**.

## Features

| Feature | Description |
|---------|-------------|
| 🔐 Authentication | JWT-based login (prem/p123 or admin/admin123) |
| 📂 File Management | Upload CSV / Excel (.xlsx) / TSV files |
| 🤖 AI Analytics | Ask natural-language questions, get Chart.js visualizations |
| ⚡ Lite Mode | Offline data analysis (no API key needed) |
| 📊 Dashboards | Auto-generated KPI cards + multi-chart dashboards |
| 💡 AI Suggestions | GPT-powered suggested questions per dataset |

## Quick Start

### Option 1 — Windows Batch File
```
Double-click: mern/START.bat
```

### Option 2 — Manual

**Terminal 1 — Backend:**
```bash
cd mern/backend
npm install     # first time only
node server.js  # or: npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd mern/frontend
npm install     # first time only
npm run dev
```

Then open **http://localhost:5173**

## Configuration

### Backend `.env` (`mern/backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai_gpt_db
JWT_SECRET=your_secret_here
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=sk-...        # required for AI mode
OPENAI_MODEL=gpt-4o-mini
```

> **Note:** MongoDB is optional. The app works without it using in-memory storage.
> File uploads and dashboards will persist across restarts only with MongoDB running.

## Tech Stack

### Backend
- **Node.js** + **Express** — REST API
- **MongoDB** + **Mongoose** — Database
- **JWT** + **bcryptjs** — Authentication
- **Multer** — File uploads
- **OpenAI** — AI chart generation
- **csv-parse** + **xlsx** — Data parsing

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** — Styling
- **Chart.js** + **react-chartjs-2** — Chart rendering
- **React Router v6** — Navigation
- **Axios** — HTTP client
- **react-hot-toast** — Notifications

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/files` | List files |
| POST | `/api/files/upload` | Upload file |
| GET | `/api/files/:id` | File detail + preview |
| DELETE | `/api/files/:id` | Delete file |
| POST | `/api/charts/ai/:fileId` | AI chart (OpenAI) |
| POST | `/api/charts/lite` | Lite analysis (offline) |
| GET | `/api/suggestions?fileId=` | Suggested questions |
| POST | `/api/dashboard/create` | Create dashboard |
| GET | `/api/dashboard/:id` | View dashboard |
| GET | `/api/dashboard` | List dashboards |
