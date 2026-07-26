# StackScout 🕵️‍♂️

**StackScout** is an autonomous software vendor research and decision-support agent. It allows users to input their software requirements in plain English (e.g., *"We're a 10-person startup and need an uptime monitoring tool under $50/month with EU data residency and Slack alerts"*), parses them into strict specifications, crawls the web for candidate vendors, extracts pricing/features directly from vendor pages, scores fit, and compiles a comprehensive McKinsey-grade comparative decision brief.

This project was built for the **Context.dev Challenge** (Theme: *Transform unstructured public web data into structured, actionable context to solve a meaningful real-world problem*).

---

## 🚀 Key Features

- **Autonomous Agentic Pipeline**: Orchestrates a 9-stage sequence to go from plain-text requirements to comparative summaries:
  1. `Plan`: Translates requirements into Zod-structured criteria.
  2. `Discover`: Finds candidates via sitemaps and organic searches.
  3. `Map`: Identifies correct pricing/feature links.
  4. `Collect`: Scrapes vendor pages with Context.dev markdown engines.
  5. `Extract`: Pulls structural dossiers (prices, compliance, support channels).
  6. `Brand`: Fetches palettes and logos via brand intelligence.
  7. `Score`: Evaluates matching features against specifications.
  8. `Synthesize`: Drafts recommendations, tradeoffs, and a decision matrix.
  9. `Done`: Delivers the finalised report.
- **Price Drift & Watchlist Monitoring**: Allows users to set watches on pricing pages. The backend schedules checks (via `node-cron`) or accepts manual check triggers. It monitors for drift and shows visual before/after price changes.
- **Ground-Truth Source Citations**: Every single pricing tier, compliance certificate, or feature claim links back to a source URL. Clicking a citation opens a right-side **Source Evidence Drawer** displaying the extracted text.
- **Premium Hackathon-Winning UI/UX**: Includes ambient radial mesh blurs, custom dark-grid backgrounds, glowing textarea focus lines, an active scanning radar widget during pipeline execution, and smooth Framer Motion list logs and scorebar loaders.

---

## 🛠️ Technology Stack

### Backend
- **Core**: Node.js 20+, Express 4, TypeScript
- **Database**: SQLite (managed with `better-sqlite3` and set to WAL mode for concurrency)
- **APIs & LLMs**: Google Gemini API via `@google/generative-ai` SDK, Context.dev Scraper API
- **Scheduler**: `node-cron` for automated watch checks
- **Validation**: `Zod` schemas for pipeline inputs and structured data outputs

### Frontend
- **Core**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS for custom dark theme tokens (`#0B0E14` base, `#6C7CFF` accents)
- **Icons**: Lucide Icons
- **Animations**: Framer Motion for premium load-in fades, radar sweeps, and scorebar fill motions
- **State & Routing**: `react-router-dom` v6

---

## 📦 Project Structure

```
d:/Dhrishti
├── package.json         # Workspace package (concurrent dev script config)
├── README.md            # Project documentation (this file)
├── backend/
│   ├── src/
│   │   ├── db/          # SQLite connection and schema setup
│   │   ├── events/      # EventBus for streaming execution steps
│   │   ├── llm/         # LLM configuration (Gemini & Mock provider)
│   │   ├── pipeline/    # 9-stage research runners & structured extractors
│   │   ├── routes/      # Express endpoints (health, research, reports, watches)
│   │   └── index.ts     # Main server entrypoint
│   ├── fixtures/        # Mock scraping pages and brand palettes
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/         # API fetch services & mock generators
    │   ├── components/  # Layouts (Sidebar, Drawer, Toast, Skeleton)
    │   ├── pages/       # Router views (NewResearch, LiveRun, ReportDetail, Watchlist)
    │   ├── App.tsx      # Root container and grid overlay
    │   └── main.tsx
    ├── tailwind.config.js
    └── package.json
```

---

## ⚙️ Environment Configuration

### Backend Setup
Create a file named `backend/.env` containing:

```env
PORT=3001

# API Credentials (required for Live/Online mode)
CONTEXT_DEV_API_KEY=your_context_dev_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# LLM Config
LLM_PROVIDER=gemini

# Mocks Configuration (set to true to run offline without spending credits)
MOCK_CONTEXT=false
MOCK_LLM=false

# cron Watch Scheduling (Default: runs checks every 6 hours)
WATCH_CRON=0 */6 * * *
```

### Frontend Setup
Create a file named `frontend/.env` containing:

```env
VITE_API_BASE=http://localhost:3001
VITE_MOCK=false
```

*Note: Setting `VITE_MOCK=true` makes the frontend run entirely in-memory offline, replaying a pre-recorded mock run.*

---

## 🏁 Getting Started

### 1. Install Workspace Dependencies
From the workspace root directory (`d:\Dhrishti`), run the script to install dependencies for both the frontend and backend projects:
```bash
npm run install:all
```

### 2. Seed the Database
Run the seeder script to reset your SQLite tables and pre-populate them with complete, ready-to-view demo reports and price-monitoring watches (automatically executes in mock-safeguarded mode to protect your API credits):
```bash
npm run seed
```

### 3. Launch Development Servers
Launch both dev servers concurrently from the project root:
```bash
npm run dev
```

This will start:
- **Frontend client** at [http://localhost:5173/](http://localhost:5173/)
- **Backend API server** at [http://localhost:3001/](http://localhost:3001/)

*(If port `5173` is occupied, Vite will automatically select `5174` or `5175`. The backend's dynamic CORS middleware will automatically allow it.)*

---

## 🛡️ Budget & Credit Discipline

To protect your API credits and maintain production discipline, StackScout enforces:
1. **Request Throttling**: A custom rate-limiter enqueues Context.dev scrapes with a maximum concurrency of 2 and a minimum delay of 3000ms.
2. **Scraper Cache (`page_cache` table)**: Raw scraped page contents are cached for **1 day**. Re-running a research query on the same vendor utilizes local cache records instead of spending scrape credits.
3. **Brand Cache (`brand_cache` table)**: Brand palettes, logos, and fonts are cached for **30 days** (since brand guidelines rarely change), saving you 10 credits per domain lookup.
4. **Limits**: Automatically constrains searches to a maximum of 6 candidates and 8 pages scraped per vendor.
5. **Backoff Retries**: Automatically retries Context.dev requests that return `429` (Rate Limited) or `5xx` (Server Error) status codes using exponential backoff.
