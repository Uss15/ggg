-- Add GPS coordinates columns to evidence_bags table
ALTER TABLE public.evidence_bags
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;

-- Add GPS coordinates columns to chain_of_custody_log table
ALTER TABLE public.chain_of_custody_log
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;

-- Add index for location queries
CREATE INDEX idx_evidence_bags_coordinates ON public.evidence_bags(latitude, longitude);
CREATE INDEX idx_custody_log_coordinates ON public.chain_of_custody_log(latitude, longitude);