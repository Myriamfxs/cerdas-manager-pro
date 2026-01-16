import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Heart, Calendar, Clock, Beef } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logError } from '@/lib/logger';
import { useQuery } from '@tanstack/react-query';

interface CubricionModalProps {
  open: boolean;
  onClose: () => void;
  cerdaId: string;
  cerdaCodigo: string;
  onSuccess?: () => void;
}

interface Verraco {
  id: string;
  codigo: string;
  nombre: string | null;
  raza: string | null;
  activo: boolean | null;
}

export function CubricionModal({ 
  open, 
  onClose, 
  cerdaId, 
  cerdaCodigo,
  onSuccess 
}: CubricionModalProps) {
  const { user } = useAuth();
  const [verracoId, setVerracoId] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const now = new Date();

  const { data: verracos, isLoading: loadingVerracos } = useQuery({
    queryKey: ['verracos-activos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verracos')
        .select('*')
        .eq('activo', true)
        .order('codigo');
      if (error) throw error;
      return data as Verraco[];
    },
    enabled: open,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verracoId) {
      toast.error('Debes seleccionar un verraco');
      return;
    }

    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    const selectedVerraco = verracos?.find(v => v.id === verracoId);
    
    setLoading(true);
    
    try {
      // Registrar el evento de cubrición
      const { error: eventoError } = await supabase
        .from('eventos')
        .insert({
          cerda_id: cerdaId,
          usuario_id: user.id,
          tipo_evento: 'cubricion',
          fecha: format(now, 'yyyy-MM-dd'),
          datos: {
            verraco_id: verracoId,
            verraco_codigo: selectedVerraco?.codigo,
            verraco_nombre: selectedVerraco?.nombre,
          },
          notas: notas.trim() || null,
        });

      if (eventoError) throw eventoError;

      // Actualizar el estado de la cerda a "cubierta"
      const { error: cerdaError } = await supabase
        .from('cerdas')
        .update({ estado: 'cubierta' })
        .eq('id', cerdaId);

      if (cerdaError) throw cerdaError;

      toast.success('Cubrición registrada correctamente');
      setVerracoId('');
      setNotas('');
      onSuccess?.();
      onClose();
    } catch (error) {
      logError('CubricionModal.handleSubmit', error);
      toast.error('Error al registrar la cubrición');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setVerracoId('');
      setNotas('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Registrar Cubrición
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium text-foreground">
              Cerda: <span className="text-primary">{cerdaCodigo}</span>
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(now, "d 'de' MMMM, yyyy", { locale: es })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {format(now, 'HH:mm')}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verraco" className="flex items-center gap-2">
              <Beef className="w-4 h-4" />
              Verraco
            </Label>
            <Select value={verracoId} onValueChange={setVerracoId}>
              <SelectTrigger id="verraco">
                <SelectValue placeholder={loadingVerracos ? "Cargando..." : "Selecciona un verraco"} />
              </SelectTrigger>
              <SelectContent>
                {verracos?.map((verraco) => (
                  <SelectItem key={verraco.id} value={verraco.id}>
                    <span className="font-medium">{verraco.codigo}</span>
                    {verraco.nombre && <span className="text-muted-foreground ml-2">- {verraco.nombre}</span>}
                    {verraco.raza && <span className="text-muted-foreground ml-1">({verraco.raza})</span>}
                  </SelectItem>
                ))}
                {verracos?.length === 0 && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No hay verracos activos
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Observaciones sobre la cubrición..."
              value={notas}
              onChange={(e) => setNotas(e.target.value.slice(0, 300))}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {notas.length}/300 caracteres
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !verracoId}>
              {loading ? 'Registrando...' : 'Registrar Cubrición'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
