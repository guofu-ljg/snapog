-- SnapOG D1 Schema
-- Migration 0002: demo mode IP 日配额（无 key 试用）

CREATE TABLE IF NOT EXISTS demo_quota (
  ip_hash TEXT NOT NULL,
  day     TEXT NOT NULL,  -- YYYY-MM-DD UTC
  count   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, day)
);

CREATE INDEX IF NOT EXISTS idx_demo_quota_day ON demo_quota(day);
