-- Crear enum para roles de usuario
CREATE TYPE public.app_role AS ENUM ('admin', 'tecnico');

-- Crear enum para estados de cerdas
CREATE TYPE public.estado_cerda AS ENUM ('en_servicio', 'seca', 'cubierta', 'gestante', 'parto', 'destete', 'baja');

-- Crear enum para tipos de evento
CREATE TYPE public.tipo_evento AS ENUM ('cubricion', 'gestacion', 'parto', 'destete', 'baja', 'ecografia');

-- Tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nombre TEXT,
  nave_asignada TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de roles de usuario
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'tecnico',
  UNIQUE (user_id, role)
);

-- Tabla de cerdas
CREATE TABLE public.cerdas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT,
  estado estado_cerda DEFAULT 'en_servicio',
  fecha_alta DATE DEFAULT CURRENT_DATE,
  fecha_nacimiento DATE,
  paridad INTEGER DEFAULT 0,
  origen TEXT,
  nave TEXT,
  medios_historicos JSONB DEFAULT '{"nacidos_vivos": 0, "destetados": 0, "viabilidad": 0}'::jsonb,
  ultima_incidencia_fecha TIMESTAMPTZ,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabla de incidencias
CREATE TABLE public.incidencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cerda_id UUID REFERENCES public.cerdas(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) NOT NULL,
  fecha_hora TIMESTAMPTZ DEFAULT NOW(),
  texto TEXT NOT NULL CHECK (char_length(texto) <= 400),
  resuelta BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de eventos reproductivos
CREATE TABLE public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cerda_id UUID REFERENCES public.cerdas(id) ON DELETE CASCADE NOT NULL,
  tipo_evento tipo_evento NOT NULL,
  fecha DATE DEFAULT CURRENT_DATE,
  datos JSONB DEFAULT '{}'::jsonb,
  notas TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de verracos
CREATE TABLE public.verracos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT,
  raza TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función para verificar rol
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Función para obtener rol del usuario
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cerdas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verracos ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios pueden actualizar su perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins pueden ver todos los perfiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para user_roles
CREATE POLICY "Usuarios pueden ver su rol" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins pueden gestionar roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para cerdas
CREATE POLICY "Admins ven todas las cerdas" ON public.cerdas
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tecnicos ven cerdas de su nave" ON public.cerdas
  FOR SELECT USING (
    public.has_role(auth.uid(), 'tecnico') AND
    nave = (SELECT nave_asignada FROM public.profiles WHERE id = auth.uid())
  );
CREATE POLICY "Admins pueden insertar cerdas" ON public.cerdas
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins pueden actualizar cerdas" ON public.cerdas
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tecnicos pueden actualizar cerdas de su nave" ON public.cerdas
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'tecnico') AND
    nave = (SELECT nave_asignada FROM public.profiles WHERE id = auth.uid())
  );

-- Políticas para incidencias
CREATE POLICY "Admins ven todas las incidencias" ON public.incidencias
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tecnicos ven incidencias de cerdas de su nave" ON public.incidencias
  FOR SELECT USING (
    public.has_role(auth.uid(), 'tecnico') AND
    cerda_id IN (
      SELECT id FROM public.cerdas 
      WHERE nave = (SELECT nave_asignada FROM public.profiles WHERE id = auth.uid())
    )
  );
CREATE POLICY "Usuarios autenticados pueden crear incidencias" ON public.incidencias
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY "Usuarios pueden editar sus incidencias" ON public.incidencias
  FOR UPDATE USING (auth.uid() = usuario_id);
CREATE POLICY "Admins pueden eliminar incidencias" ON public.incidencias
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para eventos
CREATE POLICY "Admins ven todos los eventos" ON public.eventos
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Tecnicos ven eventos de cerdas de su nave" ON public.eventos
  FOR SELECT USING (
    public.has_role(auth.uid(), 'tecnico') AND
    cerda_id IN (
      SELECT id FROM public.cerdas 
      WHERE nave = (SELECT nave_asignada FROM public.profiles WHERE id = auth.uid())
    )
  );
CREATE POLICY "Usuarios autenticados pueden crear eventos" ON public.eventos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Políticas para verracos
CREATE POLICY "Todos los autenticados ven verracos" ON public.verracos
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins gestionan verracos" ON public.verracos
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'nombre');
  
  -- Por defecto, el primer usuario es admin
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'tecnico');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cerdas_updated_at
  BEFORE UPDATE ON public.cerdas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para actualizar última incidencia en cerda
CREATE OR REPLACE FUNCTION public.update_cerda_ultima_incidencia()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.cerdas 
  SET ultima_incidencia_fecha = NEW.fecha_hora
  WHERE id = NEW.cerda_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_incidencia_created
  AFTER INSERT ON public.incidencias
  FOR EACH ROW EXECUTE FUNCTION public.update_cerda_ultima_incidencia();

-- Habilitar realtime para tablas principales
ALTER PUBLICATION supabase_realtime ADD TABLE public.cerdas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidencias;
ALTER PUBLICATION supabase_realtime ADD TABLE public.eventos;