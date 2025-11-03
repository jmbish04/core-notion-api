-- Migration: Initialize database schema for Notion Proxy Worker
-- Created: 2025-11-03

-- Table for logging all API requests
CREATE TABLE IF NOT EXISTS request_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  status INTEGER,
  user_agent TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  duration_ms INTEGER
);

-- Table for tracking flow execution runs
CREATE TABLE IF NOT EXISTS flow_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flow_name TEXT NOT NULL,
  status TEXT NOT NULL,
  input_data TEXT,
  output_data TEXT,
  error_message TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- Index for faster querying of recent requests
CREATE INDEX IF NOT EXISTS idx_request_logs_timestamp ON request_logs(timestamp DESC);

-- Index for faster querying of flow runs by status
CREATE INDEX IF NOT EXISTS idx_flow_runs_status ON flow_runs(status, started_at DESC);
