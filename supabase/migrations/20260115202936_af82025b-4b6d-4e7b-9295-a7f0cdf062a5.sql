-- Fix race condition in handle_new_user function by adding table locking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_count INTEGER;
BEGIN
  INSERT INTO public.profiles (id, email, nombre)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'nombre');
  
  -- Lock table for counting to prevent race condition
  LOCK TABLE public.user_roles IN SHARE ROW EXCLUSIVE MODE;
  
  SELECT COUNT(*) INTO role_count FROM public.user_roles;
  
  -- Por defecto, el primer usuario es admin
  IF role_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'tecnico');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;