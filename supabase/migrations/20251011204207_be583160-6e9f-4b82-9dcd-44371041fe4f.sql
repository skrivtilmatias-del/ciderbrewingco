-- Fix search_path security issue for update_updated_at_column function
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers that use this function
DROP TRIGGER IF EXISTS update_batches_updated_at ON public.batches;
CREATE TRIGGER update_batches_updated_at
BEFORE UPDATE ON public.batches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_batch_logs_updated_at ON public.batch_logs;
CREATE TRIGGER update_batch_logs_updated_at
BEFORE UPDATE ON public.batch_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fix search_path security issue for log_batch_stage_change function
DROP FUNCTION IF EXISTS public.log_batch_stage_change() CASCADE;

CREATE OR REPLACE FUNCTION public.log_batch_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.current_stage != NEW.current_stage) THEN
    INSERT INTO public.batch_history (batch_id, stage, notes)
    VALUES (NEW.id, NEW.current_stage, 'Stage changed to ' || NEW.current_stage);
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger for log_batch_stage_change
DROP TRIGGER IF EXISTS log_stage_changes ON public.batches;
CREATE TRIGGER log_stage_changes
AFTER UPDATE ON public.batches
FOR EACH ROW
EXECUTE FUNCTION public.log_batch_stage_change();