-- Create table for manual lineage assignments
CREATE TABLE IF NOT EXISTS public.lineage_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.aep_events(id) ON DELETE CASCADE,
  upstream_system TEXT NOT NULL,
  downstream_system TEXT NOT NULL,
  data_flow_description TEXT,
  assigned_by TEXT, -- Could be user email or system identifier
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lineage_assignments_event_id ON public.lineage_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_lineage_assignments_upstream ON public.lineage_assignments(upstream_system);
CREATE INDEX IF NOT EXISTS idx_lineage_assignments_downstream ON public.lineage_assignments(downstream_system);

-- Enable RLS
ALTER TABLE public.lineage_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access to lineage_assignments" 
  ON public.lineage_assignments FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert access to lineage_assignments" 
  ON public.lineage_assignments FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update access to lineage_assignments" 
  ON public.lineage_assignments FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public delete access to lineage_assignments" 
  ON public.lineage_assignments FOR DELETE 
  USING (true);
