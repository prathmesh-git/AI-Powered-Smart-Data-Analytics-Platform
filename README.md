# Smart Data Analytics Platform

A full-stack AI-powered data analytics platform built with **MongoDB, Express, React, and Node.js**.

## Features

| Feature | Description |
|---------|-------------|
| Authentication | JWT-based login and registration with bcrypt password hashing |
| File Management | Upload CSV / Excel (.xlsx) files, per-user isolated storage |
| Data Sources | Import from CSV, Google Sheets, SharePoint, MySQL, PostgreSQL, Oracle |
| AI Analytics | Ask natural-language questions, get AI-generated chart suggestions |
| Lite Mode | Offline data analysis without an API key |
| Dashboards | 20 dashboard templates with KPI cards and multi-chart views |
| AI Suggestions | GPT-powered suggested questions per dataset |
| Themes | Light and dark mode with persistent preference |

## Quick Start

**Terminal 1 — Backend:**
```bash
cd backend
npm install       # first time only
node server.js
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install       # first time only
npm run dev
```

Then open **http://localhost:5173**

Demo account: `admin / admin123`

## Configuration

### Backend `.env` (`backend/.env`)
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

## Project Structure

```
├── backend/
│   ├── models/          # Mongoose schemas (User, DataFile, Dashboard)
│   ├── routes/          # Express routes (auth, files, charts, dashboard, suggestions)
│   ├── middleware/       # JWT auth middleware
│   ├── uploads/         # Per-user file storage (<username>/<file>)
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/  # Layout, Navbar, Sidebar, ChartRenderer, KPICard
    │   ├── contexts/    # AuthContext, ThemeContext
    │   └── pages/       # Login, Register, Home, Import, FileDetail, Chart, Dashboard
    └── vite.config.ts
```

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
| POST | `/api/auth/register` | Register new user → JWT |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/files` | List files for logged-in user |
| POST | `/api/files/upload` | Upload CSV/Excel file |
| POST | `/api/files/import-source` | Import from Google Sheets, SharePoint, or DB |
| GET | `/api/files/:id` | File detail + data preview |
| DELETE | `/api/files/:id` | Delete file |
| POST | `/api/charts/ai/:fileId` | AI chart generation (OpenAI) |
| POST | `/api/charts/lite` | Lite analysis (offline) |
| GET | `/api/suggestions?fileId=` | GPT-suggested questions |
| POST | `/api/dashboard/create` | Create dashboard |
| GET | `/api/dashboard` | List dashboards |
| GET | `/api/dashboard/:id` | View dashboard |
