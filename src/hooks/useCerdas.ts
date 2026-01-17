import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Cerda, EstadoCerda } from '@/types/database';
import { toast } from 'sonner';
import { logError } from '@/lib/logger';

export function useCerdas(filters?: {
  estado?: EstadoCerda;
  search?: string;
  conIncidencias?: boolean;
}) {
  return useQuery({
    queryKey: ['cerdas', filters],
    queryFn: async () => {
      let query = supabase
        .from('cerdas')
        .select('*')
        .eq('activa', true)
        .order('codigo', { ascending: true });

      if (filters?.estado) {
        query = query.eq('estado', filters.estado);
      }

      if (filters?.search) {
        query = query.or(`codigo.ilike.%${filters.search}%,nombre.ilike.%${filters.search}%`);
      }

      if (filters?.conIncidencias) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.gte('ultima_incidencia_fecha', thirtyDaysAgo.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as Cerda[];
    }
  });
}

export function useCerda(id: string) {
  return useQuery({
    queryKey: ['cerda', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cerdas')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Cerda | null;
    },
    enabled: !!id
  });
}

export function useCreateCerda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cerda: { codigo: string; nombre?: string; origen?: string; nave?: string }) => {
      const { data, error } = await supabase
        .from('cerdas')
        .insert([cerda])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cerdas'] });
      toast.success('Cerda registrada correctamente');
    },
    onError: (error: Error & { message?: string }) => {
      logError('useCerdas.createCerda', error);
      if (error.message?.includes('unique')) {
        toast.error('El código de cerda ya existe');
      } else {
        toast.error('Error al registrar la cerda');
      }
    }
  });
}

export function useUpdateCerda() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Cerda> & { id: string }) => {
      const { data, error } = await supabase
        .from('cerdas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cerdas'] });
      queryClient.invalidateQueries({ queryKey: ['cerda', data.id] });
      toast.success('Cerda actualizada correctamente');
    },
    onError: (error) => {
      logError('useCerdas.updateCerda', error);
      toast.error('Error al actualizar la cerda');
    }
  });
}
