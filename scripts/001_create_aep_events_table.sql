-- Create the main table for storing AEP webhook events
CREATE TABLE IF NOT EXISTS public.aep_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  source_system TEXT NOT NULL,
  payload JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  significance TEXT CHECK (significance IN ('low', 'medium', 'high')) DEFAULT 'medium',
  lineage_assigned BOOLEAN DEFAULT FALSE,
  lineage_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_aep_events_event_type ON public.aep_events(event_type);
CREATE INDEX IF NOT EXISTS idx_aep_events_source_system ON public.aep_events(source_system);
CREATE INDEX IF NOT EXISTS idx_aep_events_timestamp ON public.aep_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_aep_events_significance ON public.aep_events(significance);
CREATE INDEX IF NOT EXISTS idx_aep_events_lineage_assigned ON public.aep_events(lineage_assigned);

-- Enable Row Level Security (RLS) for data protection
ALTER TABLE public.aep_events ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a monitoring tool)
-- In a production environment, you might want to restrict this to specific users
CREATE POLICY "Allow public read access to aep_events" 
  ON public.aep_events FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert access to aep_events" 
  ON public.aep_events FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update access to aep_events" 
  ON public.aep_events FOR UPDATE 
  USING (true);
