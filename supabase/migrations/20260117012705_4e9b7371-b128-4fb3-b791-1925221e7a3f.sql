-- Add fecha_baja to cerdas
ALTER TABLE public.cerdas ADD COLUMN IF NOT EXISTS fecha_baja date DEFAULT NULL;

-- Add fecha_baja to verracos
ALTER TABLE public.verracos ADD COLUMN IF NOT EXISTS fecha_baja date DEFAULT NULL;

-- Update eventos table to support parto details
-- The 'datos' jsonb column will store:
-- For parto: { nacidos_vivos, nacidos_muertos, muy_buenos, buenos, aceptables, pequenos, muertes: [{fecha, cantidad}], destetados }
-- For cubricion: { verraco_id, verraco_codigo }

-- Allow updating eventos (for editing dates)
CREATE POLICY "Usuarios pueden actualizar sus eventos" 
ON public.eventos 
FOR UPDATE 
USING (auth.uid() = usuario_id);

-- Allow admins to update any evento
CREATE POLICY "Admins pueden actualizar eventos" 
ON public.eventos 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));