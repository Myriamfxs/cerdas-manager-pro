-- Corregir funciones con search_path mutable
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_cerda_ultima_incidencia()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.cerdas 
  SET ultima_incidencia_fecha = NEW.fecha_hora
  WHERE id = NEW.cerda_id;
  RETURN NEW;
END;
$$;