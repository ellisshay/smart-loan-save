
-- Create custom types
CREATE TYPE public.case_type AS ENUM ('new', 'refi');
CREATE TYPE public.case_status AS ENUM (
  'Draft', 'WaitingForPayment', 'PaymentSucceeded', 'WaitingForDocs',
  'InAnalysis', 'ReportGenerated', 'CustomerReview', 'SentToBank',
  'BankOfferReceived', 'Negotiation', 'ClosedWon', 'ClosedLost'
);
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cases table
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_number TEXT NOT NULL UNIQUE DEFAULT 'CASE-' || floor(random() * 90000 + 10000)::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_type public.case_type NOT NULL DEFAULT 'new',
  status public.case_status NOT NULL DEFAULT 'Draft',
  goal TEXT,
  current_step INT NOT NULL DEFAULT 0,
  intake_data JSONB NOT NULL DEFAULT '{}',
  intake_complete BOOLEAN NOT NULL DEFAULT false,
  payment_succeeded BOOLEAN NOT NULL DEFAULT false,
  sla_started_at TIMESTAMPTZ,
  sla_due_at TIMESTAMPTZ,
  selected_mix TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case documents
CREATE TABLE public.case_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case tracks (mortgage tracks for refinance)
CREATE TABLE public.case_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  track_type TEXT NOT NULL,
  principal_balance NUMERIC,
  interest_rate NUMERIC,
  remaining_years NUMERIC,
  remaining_months NUMERIC,
  is_indexed BOOLEAN DEFAULT false,
  exit_date DATE,
  exit_penalty NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Status change log for webhooks
CREATE TABLE public.case_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_events ENABLE ROW LEVEL SECURITY;

-- Helper function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- SLA trigger: when case becomes "full" start 48h SLA
CREATE OR REPLACE FUNCTION public.check_sla_start()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_succeeded = true AND NEW.intake_complete = true AND NEW.sla_started_at IS NULL THEN
    NEW.sla_started_at = now();
    NEW.sla_due_at = now() + interval '48 hours';
    NEW.status = 'WaitingForDocs';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER check_case_sla BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.check_sla_start();

-- RLS Policies: profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- RLS Policies: cases
CREATE POLICY "Users can view own cases" ON public.cases FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can create own cases" ON public.cases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cases" ON public.cases FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Admin can delete cases" ON public.cases FOR DELETE USING (public.is_admin());

-- RLS Policies: case_documents
CREATE POLICY "Users can view own docs" ON public.case_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_documents.case_id AND (cases.user_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY "Users can upload own docs" ON public.case_documents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_documents.case_id AND cases.user_id = auth.uid())
);
CREATE POLICY "Users can delete own docs" ON public.case_documents FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_documents.case_id AND (cases.user_id = auth.uid() OR public.is_admin()))
);

-- RLS Policies: case_tracks
CREATE POLICY "Users can view own tracks" ON public.case_tracks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_tracks.case_id AND (cases.user_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY "Users can insert own tracks" ON public.case_tracks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_tracks.case_id AND cases.user_id = auth.uid())
);
CREATE POLICY "Users can update own tracks" ON public.case_tracks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_tracks.case_id AND (cases.user_id = auth.uid() OR public.is_admin()))
);
CREATE POLICY "Users can delete own tracks" ON public.case_tracks FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_tracks.case_id AND (cases.user_id = auth.uid() OR public.is_admin()))
);

-- RLS Policies: case_events
CREATE POLICY "Admin can view events" ON public.case_events FOR SELECT USING (public.is_admin());
CREATE POLICY "System can insert events" ON public.case_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_events.case_id AND (cases.user_id = auth.uid() OR public.is_admin()))
);

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('case-documents', 'case-documents', false);

-- Storage policies
CREATE POLICY "Users can upload own case docs" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'case-documents' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view own case docs" ON storage.objects FOR SELECT USING (
  bucket_id = 'case-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
);
CREATE POLICY "Users can delete own case docs" ON storage.objects FOR DELETE USING (
  bucket_id = 'case-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
);

-- Generate unique case numbers
CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(case_number FROM 6) AS INT)), 1000) + 1
  INTO next_num
  FROM public.cases;
  NEW.case_number = 'CASE-' || next_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_case_number BEFORE INSERT ON public.cases FOR EACH ROW EXECUTE FUNCTION public.generate_case_number();
