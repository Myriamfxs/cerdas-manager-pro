import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Incidencia } from '@/types/database';
import { toast } from 'sonner';

export function useIncidencias(cerdaId?: string) {
  return useQuery({
    queryKey: ['incidencias', cerdaId],
    queryFn: async () => {
      let query = supabase
        .from('incidencias')
        .select(`
          *,
          cerdas (codigo, nombre)
        `)
        .order('fecha_hora', { ascending: false });

      if (cerdaId) {
        query = query.eq('cerda_id', cerdaId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    }
  });
}

export function useIncidenciasRecientes(dias: number = 30) {
  return useQuery({
    queryKey: ['incidencias-recientes', dias],
    queryFn: async () => {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - dias);

      const { data, error } = await supabase
        .from('incidencias')
        .select(`
          *,
          cerdas (codigo, nombre)
        `)
        .gte('fecha_hora', fechaLimite.toISOString())
        .order('fecha_hora', { ascending: false });

      if (error) throw error;
      return data;
    }
  });
}

export function useResolverIncidencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, resuelta }: { id: string; resuelta: boolean }) => {
      const { error } = await supabase
        .from('incidencias')
        .update({ resuelta })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidencias'] });
      queryClient.invalidateQueries({ queryKey: ['incidencias-recientes'] });
      toast.success('Incidencia actualizada');
    }
  });
}

export function useDeleteIncidencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('incidencias')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidencias'] });
      queryClient.invalidateQueries({ queryKey: ['incidencias-recientes'] });
      toast.success('Incidencia eliminada');
    }
  });
}
