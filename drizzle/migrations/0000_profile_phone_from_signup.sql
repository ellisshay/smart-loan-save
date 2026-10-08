CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, phone)
  VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NULLIF(left(NEW.raw_user_meta_data->>'phone', 30), ''));
  RETURN NEW;
END;
$function$;
UPDATE public.profiles p SET phone = left(u.raw_user_meta_data->>'phone',30)
FROM auth.users u WHERE u.id = p.user_id AND p.phone IS NULL AND COALESCE(u.raw_user_meta_data->>'phone','') <> '';