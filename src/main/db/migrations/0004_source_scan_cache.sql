create table if not exists source_scan_cache (
  source_type text not null,
  locator text not null,
  parser_version text not null,
  size_bytes integer not null,
  mtime_ms real not null,
  summary_json text not null,
  turns_json text not null,
  updated_at text not null,
  primary key (source_type, locator)
);
