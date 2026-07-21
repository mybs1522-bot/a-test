-- Create traffic tracking table
CREATE TABLE IF NOT EXISTS page_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  url TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  country TEXT,
  browser TEXT,
  device_type TEXT,
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  exited_at TIMESTAMP WITH TIME ZONE,
  session_duration_seconds INTEGER,
  page_views INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can access page_visits" ON page_visits;
DROP POLICY IF EXISTS "Allow anon insert page_visits" ON page_visits;

-- Create policies
CREATE POLICY "Service role can access page_visits"
  ON page_visits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon insert page_visits"
  ON page_visits
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_page_visits_session_id ON page_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_entered_at ON page_visits(entered_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_visits_utm_source ON page_visits(utm_source);

-- Function to get traffic stats for admin
CREATE OR REPLACE FUNCTION get_traffic_stats_admin(p_auth_pass TEXT)
RETURNS TABLE (
  total_visits BIGINT,
  unique_sessions BIGINT,
  avg_session_duration_seconds NUMERIC,
  total_page_views BIGINT,
  utm_source_stats JSONB,
  referrer_stats JSONB,
  device_type_stats JSONB,
  recent_visits JSONB
) AS $$
BEGIN
  IF p_auth_pass != 'Robbin#15' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::BIGINT FROM page_visits) as total_visits,
    (SELECT COUNT(DISTINCT session_id)::BIGINT FROM page_visits) as unique_sessions,
    (SELECT COALESCE(AVG(session_duration_seconds), 0)::NUMERIC FROM page_visits WHERE session_duration_seconds IS NOT NULL) as avg_session_duration_seconds,
    (SELECT SUM(page_views)::BIGINT FROM page_visits) as total_page_views,
    (SELECT COALESCE(jsonb_object_agg(utm_source, visit_count), '{}'::jsonb)
     FROM (
       SELECT utm_source, COUNT(*) as visit_count
       FROM page_visits
       WHERE utm_source IS NOT NULL
       GROUP BY utm_source
     ) t) as utm_source_stats,
    (SELECT COALESCE(jsonb_object_agg(referrer, visit_count), '{}'::jsonb)
     FROM (
       SELECT referrer, COUNT(*) as visit_count
       FROM page_visits
       WHERE referrer IS NOT NULL AND referrer != ''
       GROUP BY referrer
     ) t) as referrer_stats,
    (SELECT COALESCE(jsonb_object_agg(device_type, visit_count), '{}'::jsonb)
     FROM (
       SELECT device_type, COUNT(*) as visit_count
       FROM page_visits
       WHERE device_type IS NOT NULL
       GROUP BY device_type
     ) t) as device_type_stats,
    (SELECT COALESCE(jsonb_agg(jsonb_build_object(
       'session_id', session_id,
       'url', url,
       'utm_source', utm_source,
       'referrer', referrer,
       'device_type', device_type,
       'entered_at', entered_at,
       'session_duration_seconds', session_duration_seconds
     )), '[]'::jsonb)
     FROM (
       SELECT session_id, url, utm_source, referrer, device_type, entered_at, session_duration_seconds
       FROM page_visits
       ORDER BY entered_at DESC
       LIMIT 50
     ) t) as recent_visits;
END;
$$ LANGUAGE plpgsql;

-- Function to update session on exit
CREATE OR REPLACE FUNCTION update_session_on_exit(p_session_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE page_visits
  SET 
    exited_at = NOW(),
    session_duration_seconds = EXTRACT(EPOCH FROM (NOW() - entered_at))::INTEGER,
    updated_at = NOW()
  WHERE session_id = p_session_id AND exited_at IS NULL;
END;
$$ LANGUAGE plpgsql;
