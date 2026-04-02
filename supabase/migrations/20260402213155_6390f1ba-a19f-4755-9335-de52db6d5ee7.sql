
ALTER TABLE public.case_documents ADD COLUMN IF NOT EXISTS ai_extracted_data jsonb DEFAULT NULL;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS ai_analysis jsonb DEFAULT NULL;
