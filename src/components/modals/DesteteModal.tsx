import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Activity, Calendar, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logError } from '@/lib/logger';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DesteteModalProps {
  open: boolean;
  onClose: () => void;
  cerdaId: string;
  cerdaCodigo: string;
  onSuccess?: () => void;
}

interface PartoData {
  nacidos_vivos: number;
  nacidos_muertos?: number;
  muertes?: { fecha: string; cantidad: number }[];
  destetados?: number;
}

export function DesteteModal({ 
  open, 
  onClose, 
  cerdaId, 
  cerdaCodigo,
  onSuccess 
}: DesteteModalProps) {
  const { user } = useAuth();
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [destetados, setDestetados] = useState<number>(0);
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [ultimoParto, setUltimoParto] = useState<{ id: string; fecha: string; datos: PartoData } | null>(null);
  const [loadingParto, setLoadingParto] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUltimoParto();
    }
  }, [open, cerdaId]);

  const fetchUltimoParto = async () => {
    setLoadingParto(true);
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select('id, fecha, datos')
        .eq('cerda_id', cerdaId)
        .eq('tipo_evento', 'parto')
        .order('fecha', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const partoData = data.datos as unknown as PartoData;
        setUltimoParto({
          id: data.id,
          fecha: data.fecha,
          datos: partoData
        });
        
        // Calcular destetados sugeridos (nacidos vivos - muertes)
        const nacidosVivos = partoData?.nacidos_vivos || 0;
        const totalMuertes = partoData?.muertes?.reduce((acc, m) => acc + m.cantidad, 0) || 0;
        setDestetados(Math.max(0, nacidosVivos - totalMuertes));
      } else {
        setUltimoParto(null);
      }
    } catch (error) {
      logError('DesteteModal.fetchUltimoParto', error);
    } finally {
      setLoadingParto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (destetados < 0) {
      toast.error('Los destetados no pueden ser negativos');
      return;
    }

    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    if (!ultimoParto) {
      toast.error('No hay un parto registrado para destetar');
      return;
    }

    setLoading(true);
    
    try {
      // 1. Registrar evento de destete
      const { error: eventoError } = await supabase
        .from('eventos')
        .insert([{
          cerda_id: cerdaId,
          usuario_id: user.id,
          tipo_evento: 'destete' as const,
          fecha,
          datos: { 
            destetados,
            parto_id: ultimoParto.id,
            nacidos_vivos: ultimoParto.datos?.nacidos_vivos || 0
          } as unknown as Record<string, never>,
          notas: notas.trim() || null,
        }]);

      if (eventoError) throw eventoError;

      // 2. Actualizar el evento de parto con los destetados
      const updatedPartoData = {
        ...ultimoParto.datos,
        destetados
      };

      const { error: partoUpdateError } = await supabase
        .from('eventos')
        .update({ datos: updatedPartoData as unknown as Record<string, never> })
        .eq('id', ultimoParto.id);

      if (partoUpdateError) throw partoUpdateError;

      // 3. Obtener datos actuales de la cerda y calcular nuevos medios
      const { data: cerdaData, error: cerdaFetchError } = await supabase
        .from('cerdas')
        .select('paridad, medios_historicos')
        .eq('id', cerdaId)
        .single();

      if (cerdaFetchError) throw cerdaFetchError;

      const paridad = cerdaData?.paridad || 1;
      const currentMedios = cerdaData?.medios_historicos as { 
        nacidos_vivos: number; 
        destetados: number; 
        viabilidad: number 
      } | null;

      const nacidosVivos = ultimoParto.datos?.nacidos_vivos || 0;

      // Calcular nuevos medios históricos (promedio acumulado)
      let nuevoMedioNacidosVivos: number;
      let nuevoMedioDestetados: number;
      let nuevaViabilidad: number;

      if (paridad === 1 || !currentMedios) {
        // Primer parto: usar valores directos
        nuevoMedioNacidosVivos = nacidosVivos;
        nuevoMedioDestetados = destetados;
        nuevaViabilidad = nacidosVivos > 0 ? Math.round((destetados / nacidosVivos) * 100) : 0;
      } else {
        // Calcular promedio acumulado: (anterior * (n-1) + nuevo) / n
        nuevoMedioNacidosVivos = Math.round(
          ((currentMedios.nacidos_vivos * (paridad - 1)) + nacidosVivos) / paridad * 10
        ) / 10;
        nuevoMedioDestetados = Math.round(
          ((currentMedios.destetados * (paridad - 1)) + destetados) / paridad * 10
        ) / 10;
        nuevaViabilidad = nuevoMedioNacidosVivos > 0 
          ? Math.round((nuevoMedioDestetados / nuevoMedioNacidosVivos) * 100) 
          : 0;
      }

      // 4. Actualizar cerda con nuevos medios y estado
      const { error: cerdaError } = await supabase
        .from('cerdas')
        .update({ 
          estado: 'destete' as const,
          medios_historicos: {
            nacidos_vivos: nuevoMedioNacidosVivos,
            destetados: nuevoMedioDestetados,
            viabilidad: nuevaViabilidad
          }
        })
        .eq('id', cerdaId);

      if (cerdaError) throw cerdaError;

      toast.success(`Destete registrado: ${destetados} crías. Viabilidad: ${nuevaViabilidad}%`);
      resetForm();
      onSuccess?.();
      onClose();
    } catch (error) {
      logError('DesteteModal.handleSubmit', error);
      toast.error('Error al registrar el destete');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFecha(format(new Date(), 'yyyy-MM-dd'));
    setDestetados(0);
    setNotas('');
    setUltimoParto(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
      onClose();
    }
  };

  const viabilidadPrevia = ultimoParto?.datos?.nacidos_vivos 
    ? Math.round((destetados / ultimoParto.datos.nacidos_vivos) * 100) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            Registrar Destete
          </DialogTitle>
        </DialogHeader>

        {loadingParto ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : !ultimoParto ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay un parto registrado para esta cerda. Debes registrar un parto antes de poder destetar.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium text-foreground">
                Cerda: <span className="text-primary">{cerdaCodigo}</span>
              </p>
            </div>

            {/* Información del último parto */}
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Datos del último parto</p>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                Fecha: {format(new Date(ultimoParto.fecha), 'dd/MM/yyyy')}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300">
                Nacidos vivos: {ultimoParto.datos?.nacidos_vivos || 0}
              </p>
              {ultimoParto.datos?.muertes && ultimoParto.datos.muertes.length > 0 && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Muertes registradas: {ultimoParto.datos.muertes.reduce((acc, m) => acc + m.cantidad, 0)}
                </p>
              )}
            </div>

            {/* Fecha del destete */}
            <div className="space-y-2">
              <Label htmlFor="fecha" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fecha del Destete
              </Label>
              <Input
                id="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>

            {/* Destetados */}
            <div className="space-y-2">
              <Label htmlFor="destetados">Total Destetados *</Label>
              <Input
                id="destetados"
                type="number"
                min="0"
                max={ultimoParto.datos?.nacidos_vivos || 99}
                value={destetados}
                onChange={(e) => setDestetados(Number(e.target.value) || 0)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Viabilidad de esta camada: <span className={viabilidadPrevia >= 80 ? 'text-green-600' : viabilidadPrevia >= 60 ? 'text-yellow-600' : 'text-red-600'}>{viabilidadPrevia}%</span>
              </p>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notas">Notas (opcional)</Label>
              <Textarea
                id="notas"
                placeholder="Observaciones sobre el destete..."
                value={notas}
                onChange={(e) => setNotas(e.target.value.slice(0, 500))}
                rows={2}
                className="resize-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrar Destete'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {!loadingParto && !ultimoParto && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
