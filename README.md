# StackScout 🕵️‍♂️ — Autonomous Software Procurement & Decision Agent


**StackScout** is an autonomous vendor-research and decision-support agent built for the **Context.dev Challenge**. 

Describe your software needs in plain English — *"We're a 10-person startup and need an uptime monitoring tool under $50/month with EU data residency and Slack alerts"* — and StackScout dispatches an autonomous multi-stage agent pipeline that crawls public web pages, extracts structured vendor dossiers, validates feature compliance, and compiles a McKinsey-grade comparative decision brief.

---

## 🏛️ System Architecture & Data Flow

StackScout is built around a decoupled architecture separating a real-time event-driven Node.js backend from a reactive React single-page dashboard.

```mermaid
flowchart TD
    %% User input flow
    A[User Request / Plain English Query] -->|POST /api/research| B[Express API Router]
    B -->|Create Job| C[(Database Cache)]
    B -->|Spawn Background Runner| D[Autonomous Pipeline runner]
    
    %% Pipeline Stages
    subgraph Pipeline [9-Stage Research Pipeline]
        D --> Stage1[1. Plan: LLM parses specs]
        Stage1 --> Stage2[2. Discover: Google search / sitemaps]
        Stage2 --> Stage3[3. Map: Filter pricing/feature links]
        Stage3 --> Stage4[4. Collect: Context.dev crawler]
        Stage4 --> Stage5[5. Extract: LLM parses structured dossier]
        Stage5 --> Stage6[6. Brand: Fetch logo & colors]
        Stage6 --> Stage7[7. Score: Compute compliance vs must-haves]
        Stage7 --> Stage8[8. Synthesize: Final recommendation matrix]
        Stage8 --> Stage9[9. Done: Persistence & completion]
    end

    %% Storage and LLM dependencies
    Stage4 -.->|Check 1d Cache| C
    Stage6 -.->|Check 30d Cache| C
    Stage5 -.->|Validate Zod Schema| LLM[Gemini 2.5 Flash Lite API]
    
    %% SSE Logs Streaming
    D -->|Publish PipelineEvent| Bus[Event Bus]
    Bus -->|Server-Sent Events SSE| Front[Framer-Motion Console UI]
```

### 1. The 9-Stage Agent Pipeline
*   **Plan**: Gemini translates raw request text into structured criteria specifications (Must Haves, Nice to Haves, Constraints, Budget).
*   **Discover**: Searches the web to identify 4–6 candidate vendor domains.
*   **Map**: Scrapes site navigation to isolate pricing and feature URLs.
*   **Collect**: Scrapes candidate pages to Markdown using rate-limited `Context.dev` crawl endpoints.
*   **Extract**: LLM parses scraped Markdown into structured dossiers, forcing grounded **evidence source citations** for every single data point.
*   **Brand**: Fetches logos and primary brand palette colors.
*   **Score**: Automatically calculates scores (Fit, Pricing, Compliance, Documentation) based on extracted claims.
*   **Synthesize**: Drafts the final tech advisory board recommendations, pros, cons, and tradeoffs.
*   **Done**: Saves the briefing to database caches and terminates.

### 2. Hybrid SQLite / PostgreSQL Adapter (Worker Threads)
To support both zero-config local runs and standard cloud database deployments (Render, Supabase) without altering backend queries, StackScout features a custom **synchronous database adapter** in `db.ts`:
*   **SQLite Mode**: Uses `better-sqlite3` in WAL (Write-Ahead Logging) mode for concurrent read/write speed.
*   **PostgreSQL Mode**: Boots a background Node.js **Worker Thread** (`worker.ts`) and utilizes `SharedArrayBuffer` with `Atomics.wait` to bridge asynchronous pg queries into a synchronous API matching the sqlite `.prepare(sql).run() / .get() / .all()` syntax.
*   **Automatic Query Mapping**: Remaps SQLite SQL statements (like `INSERT OR REPLACE`) into standard PostgreSQL `ON CONFLICT DO UPDATE` queries dynamically.

---

## 🎨 UI/UX Design System (Dashboard Layout)

The UI is inspired by modern real-time crypto dashboards, offering a light-themed, high-contrast, data-rich interface built with Tailwind CSS and Framer Motion:

*   **Header Navigation**: A glassmorphic top bar containing pill tabs (Overview, Reports, Watchlist), notifications bell with pulsing indicators, and a Premium profile badge.
*   **Sparkline Widgets**: Four top statistics cards displaying **Total Crawler Runs**, **Live Watchlist Targets**, **Average Latency**, and **Credit Efficiency** with custom SVG trendline graphs and percentage indicators.
*   **Procurement Donut Gauge**: A half-circle gauge displaying the grounded crawl quality index (percentage of vendor claims with validated URLs) using an animated pointer needle.
*   **Git-Style Pricing Deltas**: The watchlist page uses line-by-line red (`-` deleted) and green (`+` added) diff blocks to visualize pricing drift on watched pages.
*   **Evidence Drawer**: Clicking citation icons slide out a right-side drawer containing the exact raw web text extracted from source URLs to guarantee grounded validation.

---

## ⚙️ Environment Configuration

### Backend Setup (`backend/.env`)
Create a file named `backend/.env` with the following parameters:

```env
PORT=3001

# API Credentials (required for live crawls)
CONTEXT_DEV_API_KEY=your_context_dev_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# LLM Selection
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash-lite

# Mocks (set to true to run offline without spending credits)
MOCK_CONTEXT=false
MOCK_LLM=false

# Chron Watch Scheduler (default: runs checks every 6 hours)
WATCH_CRON=0 */6 * * *

# Database Mode (sqlite or postgres)
DB_MODE=sqlite

# If DB_MODE=postgres:
# DATABASE_URL=postgresql://username:password@localhost:5432/stackscout
# Or individual fields:
# PGHOST=localhost
# PGPORT=5432
# PGUSER=postgres
# PGPASSWORD=postgres
# PGDATABASE=stackscout
```

### Frontend Setup (`frontend/.env`)
Create a file named `frontend/.env` with:

```env
VITE_API_BASE=http://localhost:3001
VITE_MOCK=false
```

---

## 🏁 Getting Started

### 1. Install Dependencies
From the workspace root directory, install npm packages for both sub-projects:
```bash
npm run install:all
```

### 2. Seed Demo Data
Pre-populate your database with pre-recorded reports, logs, and watchlist subscriptions (automatically forces mocks to safeguard your API credits):
```bash
npm run seed
```

### 3. Launch Development Servers
Start both the Express API and Vite React server concurrently:
```bash
npm run dev
```
- **Frontend Panel**: [http://localhost:5173/](http://localhost:5173/)
- **Backend API**: [http://localhost:3001/](http://localhost:3001/)

---

## 🛡️ API Credit Discipline & Optimizations

StackScout is built to be extremely credit-efficient, using cache tables to avoid redundant web scraping fees:
*   **Scraper Cache (`page_cache`)**: Raw scraped page Markdowns are cached for **1 day**. Re-running searches on the same candidates pulls from the database instead of triggering a new crawl.
*   **Brand Cache (`brand_cache`)**: Log urls, palettes, and typography guidelines are cached for **30 days** (since brand guidelines rarely change).
*   **Rate Limiter**: Limits Context.dev requests to a maximum concurrency of 2 and applies a 3000ms delay between fetches to prevent rate-limiting bans.
*   **Exponential Backoff**: Automatically handles `429` (Too Many Requests) or `5xx` errors by retrying queries with backoff intervals.

---

## ⚡ Vercel Deployment (Frontend)

To deploy the StackScout frontend onto **Vercel** as a high-speed Edge CDN application, follow these simple steps:

1. **Import the Project**: Link your GitHub repository (`Adityasri05/StackScout`) to your Vercel Account.
2. **Configure Settings**:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Framework Preset**: `Vite`
3. **Add Environment Variables**:
   - `VITE_API_BASE`: Set this to your deployed backend URL (e.g., `https://stackscout-production.up.railway.app` or your Render service domain).
   - `VITE_MOCK`: `false`
4. **Deploy**: Click **Deploy**. Vercel will build the frontend assets, and our preconfigured `frontend/vercel.json` will handle SPA redirects on page reloads automatically!
