
-- Function: auto-create a lead when intake_complete flips to true
CREATE OR REPLACE FUNCTION public.auto_create_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when intake_complete changes from false to true
  IF NEW.intake_complete = true AND (OLD.intake_complete IS NULL OR OLD.intake_complete = false) THEN
    -- Check if a lead already exists for this case
    IF NOT EXISTS (SELECT 1 FROM public.leads WHERE case_id = NEW.id) THEN
      INSERT INTO public.leads (
        client_id,
        case_id,
        property_area,
        property_price_range,
        purpose,
        income_range,
        equity_range,
        status
      ) VALUES (
        NEW.user_id,
        NEW.id,
        COALESCE(NEW.intake_data->>'property_area', NEW.intake_data->'property'->>'area', ''),
        COALESCE(NEW.intake_data->>'property_value', NEW.intake_data->'property'->>'value', ''),
        COALESCE(NEW.goal, NEW.intake_data->>'goal', NEW.case_type::text),
        COALESCE(NEW.intake_data->>'monthly_income', NEW.intake_data->'income'->>'monthly_income', ''),
        COALESCE(NEW.intake_data->>'equity', NEW.intake_data->'property'->>'equity', ''),
        'open'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on cases table
CREATE TRIGGER trg_auto_create_lead
  AFTER UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_lead();
