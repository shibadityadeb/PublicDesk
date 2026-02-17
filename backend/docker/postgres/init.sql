-- Initialize PublicDesk Database
-- This script runs on first container startup

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
-- Additional indexes will be created by TypeORM

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'PublicDesk database initialized successfully';
END $$;
