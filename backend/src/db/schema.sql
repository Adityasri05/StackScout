CREATE TABLE IF NOT EXISTS jobs (
  job_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  stage TEXT NOT NULL,
  report_id TEXT,
  error TEXT,
  credit_scrapes INTEGER NOT NULL DEFAULT 0,
  credit_brands INTEGER NOT NULL DEFAULT 0,
  credit_total INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_events (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  ts TEXT NOT NULL,
  stage TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  requirement TEXT NOT NULL, -- JSON string
  vendors TEXT NOT NULL,       -- JSON string
  recommendation TEXT NOT NULL, -- JSON string
  credit_usage TEXT NOT NULL,   -- JSON string
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pages (
  url TEXT PRIMARY KEY,
  vendor_domain TEXT NOT NULL,
  markdown TEXT NOT NULL,
  scraped_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS page_cache (
  url TEXT NOT NULL,
  scraped_date TEXT NOT NULL, -- YYYY-MM-DD
  PRIMARY KEY (url, scraped_date)
);

CREATE TABLE IF NOT EXISTS brand_cache (
  domain TEXT PRIMARY KEY,
  logo_url TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  colors TEXT NOT NULL, -- JSON array
  fonts TEXT NOT NULL,  -- JSON array
  company_metadata TEXT, -- JSON string
  cached_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS watches (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_logo_url TEXT NOT NULL,
  last_checked_at TEXT,
  change_count INTEGER NOT NULL DEFAULT 0,
  report_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS watch_changes (
  id TEXT PRIMARY KEY,
  watch_id TEXT NOT NULL,
  detected_at TEXT NOT NULL,
  summary TEXT NOT NULL,
  before_content TEXT NOT NULL,
  after_content TEXT NOT NULL,
  FOREIGN KEY (watch_id) REFERENCES watches(id) ON DELETE CASCADE
);
