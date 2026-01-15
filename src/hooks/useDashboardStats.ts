import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalCerdas: number;
  cerdasPorEstado: Record<string, number>;
  incidenciasActivas: number;
  incidenciasUltimas24h: number;
  mediaDestetados: number;
  mediaNacidosVivos: number;
  mediaViabilidad: number;
  cerdasSecasProlongadas: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const [cerdasRes, incidenciasRes, incidencias24hRes] = await Promise.all([
        supabase.from('cerdas').select('*').eq('activa', true),
        supabase.from('incidencias').select('id').eq('resuelta', false),
        supabase.from('incidencias')
          .select('id')
          .eq('resuelta', false)
          .gte('fecha_hora', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      const cerdas = cerdasRes.data || [];
      
      const cerdasPorEstado: Record<string, number> = {};
      let totalNacidosVivos = 0;
      let totalDestetados = 0;
      let totalViabilidad = 0;
      let cerdasConMedios = 0;
      let cerdasSecasProlongadas = 0;

      const sessentaDiasAtras = new Date();
      sessentaDiasAtras.setDate(sessentaDiasAtras.getDate() - 60);

      cerdas.forEach(cerda => {
        const estado = cerda.estado || 'en_servicio';
        cerdasPorEstado[estado] = (cerdasPorEstado[estado] || 0) + 1;

        if (cerda.medios_historicos) {
          const medios = cerda.medios_historicos as any;
          if (medios.nacidos_vivos > 0) {
            totalNacidosVivos += medios.nacidos_vivos;
            totalDestetados += medios.destetados || 0;
            totalViabilidad += medios.viabilidad || 0;
            cerdasConMedios++;
          }
        }

        if (estado === 'seca' && cerda.updated_at) {
          const fechaEstado = new Date(cerda.updated_at);
          if (fechaEstado < sessentaDiasAtras) {
            cerdasSecasProlongadas++;
          }
        }
      });

      return {
        totalCerdas: cerdas.length,
        cerdasPorEstado,
        incidenciasActivas: incidenciasRes.data?.length || 0,
        incidenciasUltimas24h: incidencias24hRes.data?.length || 0,
        mediaDestetados: cerdasConMedios > 0 ? +(totalDestetados / cerdasConMedios).toFixed(1) : 0,
        mediaNacidosVivos: cerdasConMedios > 0 ? +(totalNacidosVivos / cerdasConMedios).toFixed(1) : 0,
        mediaViabilidad: cerdasConMedios > 0 ? +(totalViabilidad / cerdasConMedios).toFixed(1) : 0,
        cerdasSecasProlongadas
      };
    },
    refetchInterval: 30000 // Refrescar cada 30 segundos
  });
}
