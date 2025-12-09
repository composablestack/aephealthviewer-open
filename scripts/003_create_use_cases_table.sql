-- Create use cases table for storing MCP service configurations
CREATE TABLE IF NOT EXISTS use_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    configuration JSONB NOT NULL DEFAULT '{}',
    lineage JSONB DEFAULT '{}',
    expected_behavior TEXT,
    functions_used TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active'
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_use_cases_name ON use_cases(name);
CREATE INDEX IF NOT EXISTS idx_use_cases_status ON use_cases(status);
CREATE INDEX IF NOT EXISTS idx_use_cases_functions ON use_cases USING GIN(functions_used);
CREATE INDEX IF NOT EXISTS idx_use_cases_created_at ON use_cases(created_at);

-- Enable RLS
ALTER TABLE use_cases ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on use_cases" ON use_cases FOR ALL USING (true);
