# Vigil — AI-Powered Risk Intelligence Platform

> Monitor your brand's digital presence for reputational, security, and compliance risks — powered by Google Gemini AI.

Vigil is a full-stack web application that continuously scans URLs you care about, runs the scraped content through an AI risk analysis engine, and surfaces actionable incidents on a clean dashboard. It also passively monitors your primary website's SSL certificate health.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Configure the Server](#2-configure-the-server)
  - [3. Run the Server](#3-run-the-server)
  - [4. Run the Client](#4-run-the-client)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Live Demo](#live-demo)

---

## Features

- **AI Risk Analysis** — Leverages Google Gemini (with OpenAI as an alternative) to classify content as a _Reputational_, _Security_, or _Compliance_ risk, and assigns a severity level (High / Medium / Low).
- **On-Demand Scanning** — Trigger intelligent scans of your monitored URLs at any time from the dashboard.
- **SSL Certificate Monitor** — Automatically checks the SSL certificate expiry for your primary website and warns when renewal is approaching.
- **Risk Incident Feed** — Paginated, filterable list of all detected risk incidents with AI-generated justifications and mitigation strategies.
- **Risk Distribution Chart** — Bar chart visualising incident counts broken down by risk category.
- **Secure Auth** — JWT-based authentication with bcrypt password hashing. All sensitive routes are protected.
- **Company Profile Management** — Each account stores a monitoring profile (company name, industry, monitored URLs, compliance regulations) that scopes the AI analysis.
- **Multi-Provider AI** — Backend supports Gemini, OpenAI, and Perplexity AI services; provider can be selected per-request via the `x-ai-provider` header.

---

## Tech Stack

### Frontend (`/client`)
| Technology | Purpose |
|---|---|
| React 19 + Vite | UI framework and build tool |
| React Router v7 | Client-side routing |
| Tailwind CSS v3 | Utility-first styling |
| Recharts | Risk distribution bar chart |
| Axios | HTTP client with JWT interceptors |

### Backend (`/server`)
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose | Database and ODM |
| Google Generative AI (`@google/generative-ai`) | Gemini AI risk analysis |
| OpenAI SDK | Alternative AI provider |
| Cheerio + Axios | Web scraping |
| `ssl-checker` | SSL certificate inspection |
| JWT + bcryptjs | Authentication |
| Helmet + express-rate-limit | Security hardening |
| express-validator | Request validation |

---

## Project Structure

```
vigil/
├── client/                         # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx       # Dashboard page component
│   │   │   └── Login.jsx           # Login page component
│   │   ├── context/                # React context providers
│   │   ├── App.jsx                 # Root component, routing, auth context
│   │   ├── main.jsx                # React entry point
│   │   └── mock-data.js            # Development mock data
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                         # Express + MongoDB backend
│   ├── controllers/
│   │   ├── auth.controller.js      # Register / Login logic
│   │   ├── profile.controller.js   # Client profile CRUD
│   │   └── scan.controller.js      # Scan orchestration
│   ├── middleware/                 # Auth middleware (JWT verification)
│   ├── models/
│   │   ├── user.model.js           # User schema
│   │   ├── clientProfile.model.js  # Company monitoring profile schema
│   │   └── riskIncident.model.js   # Risk incident schema
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── scan.routes.js
│   │   ├── incidents.routes.js
│   │   └── profile.routes.js
│   ├── services/
│   │   ├── ai.service.js           # Gemini AI integration
│   │   ├── openai.service.js       # OpenAI integration
│   │   ├── perplexity.service.js   # Perplexity AI integration
│   │   └── ssl.service.js          # SSL certificate checking
│   ├── utils/
│   ├── server.js                   # Express app entry point
│   └── .env                        # Environment variables (see below)
│
├── RISK_ANALYSIS_API_DOCUMENTATION.md
├── Vigil_AI_Postman_Collection.json
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **MongoDB** (local instance or MongoDB Atlas connection string)
- A **Google Gemini API key** — get one at [aistudio.google.com](https://aistudio.google.com/)

---

### 1. Clone the Repository

```bash
git clone https://github.com/Tanmay-Palshikar/vigil.git
cd vigil
```

---

### 2. Configure the Server

Create a `.env` file inside the `server/` directory:

```bash
cd server
cp .env.example .env   # or create it manually
```

Populate it with your values (see [Environment Variables](#environment-variables) for the full list).

Install server dependencies:

```bash
npm install
```

---

### 3. Run the Server

```bash
# from the server/ directory
node server.js
```

The API will be available at `http://localhost:5001`.

---

### 4. Run the Client

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

> **Note:** The client's `api` base URL is hard-coded to the deployed Render backend (`https://vigil-ai-backend2.onrender.com`). For local development, update the `baseURL` in `client/src/App.jsx` (line ~9) to `http://localhost:5001`.

---

## API Reference

A full Postman collection is included at `Vigil_AI_Postman_Collection.json`. Import it into Postman and set the following environment variables:

| Variable | Value |
|---|---|
| `base_url` | `http://localhost:5001` |
| `auth_token` | JWT token obtained from `/api/auth/login` |

### Auth Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register a new user and create a monitoring profile |
| `POST` | `/api/auth/login` | ❌ | Login and receive a JWT token |

### Scan Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/scan/start` | ✅ | Trigger an AI risk scan for all monitored URLs |
| `POST` | `/api/scan/check-ssl` | ✅ | Check SSL certificate status for a given URL |
| `GET` | `/api/scan/history` | ✅ | Retrieve past scan incidents |

### Incident Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/incidents` | ✅ | List all incidents (paginated, filterable) |
| `GET` | `/api/incidents/:id` | ✅ | Get a specific incident |
| `GET` | `/api/incidents/stats/summary` | ✅ | Get risk statistics summary |

### Profile Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/profile` | ✅ | Get the current user's monitoring profile |
| `POST` | `/api/profile` | ✅ | Create or update the monitoring profile |

### Health Check

```
GET /health
```

Returns server uptime and timestamp. No authentication required.

---

### AI Analysis Schema

Every risk incident includes an `aiAnalysis` object with the following shape:

```json
{
  "isRisk": true,
  "riskCategory": "Reputational | Security | Compliance | None",
  "riskLevel": "High | Medium | Low | None",
  "justification": "Detailed explanation of why this is a risk.",
  "mitigationStrategy": "Recommended steps to address the risk."
}
```

---

## Environment Variables

Create `server/.env` with the following keys:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/vigil-ai

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-here

# OpenAI (optional, for alternative AI provider)
OPENAI_API_KEY=your-openai-api-key-here

# Server
PORT=5001
NODE_ENV=development
```

---

## Live Demo

| Service | URL |
|---|---|
| Frontend | [https://vigil-s8vc.vercel.app](https://vigil-s8vc.vercel.app) |
| Backend API | [https://vigil-ai-backend2.onrender.com](https://vigil-ai-backend2.onrender.com) |

---

## How It Works

1. **Register** — Create an account with your company name, primary website URL (for SSL monitoring), and a list of trusted URLs to watch (news sources, social mentions, etc.).
2. **Scan** — Click "Start Intelligent Scan" on the dashboard. The backend scrapes each monitored URL, feeds the content to Gemini AI, and classifies any risks.
3. **Review** — Detected incidents appear in the feed with a severity badge, category tag, AI justification, and a recommended mitigation strategy.
4. **Monitor** — The SSL widget shows days remaining on your primary site's certificate, colour-coded green → yellow → red as expiry approaches.
5. **Iterate** — Edit your monitoring profile at any time to add/remove URLs or compliance regulations.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

*Built by [Tanmay Palshikar](https://github.com/Tanmay-Palshikar)*
