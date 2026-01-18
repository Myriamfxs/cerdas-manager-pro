import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logError } from '@/lib/logger';

interface DesteteModalProps {
  open: boolean;
  onClose: () => void;
  cerdaId: string;
  cerdaCodigo: string;
  onSuccess?: () => void;
}

export function DesteteModal({ 
  open, 
  onClose, 
  cerdaId, 
  cerdaCodigo,
  onSuccess 
}: DesteteModalProps) {
  const { user } = useAuth();
  const [lechones, setLechones] = useState(0);
  const [pesoMedio, setPesoMedio] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const now = new Date();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    if (lechones < 0) {
      toast.error('El número de lechones no puede ser negativo');
      return;
    }

    setLoading(true);
    
    try {
      // Registrar el evento de destete
      const { error: eventoError } = await supabase
        .from('eventos')
        .insert({
          cerda_id: cerdaId,
          usuario_id: user.id,
          tipo_evento: 'destete',
          fecha: format(now, 'yyyy-MM-dd'),
          datos: {
            lechones_destetados: lechones,
            peso_medio_kg: pesoMedio ? parseFloat(pesoMedio) : null,
          },
          notas: notas.trim() || null,
        });

      if (eventoError) throw eventoError;

      // Actualizar estado de la cerda a "destete" (lista para nueva cubrición)
      const { error: cerdaError } = await supabase
        .from('cerdas')
        .update({ estado: 'destete' })
        .eq('id', cerdaId);

      if (cerdaError) throw cerdaError;

      toast.success('Destete registrado correctamente');
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
    setLechones(0);
    setPesoMedio('');
    setNotas('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            Registrar Destete
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lechones">Lechones Destetados</Label>
              <Input
                id="lechones"
                type="number"
                min={0}
                value={lechones}
                onChange={(e) => setLechones(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pesoMedio">Peso Medio (kg)</Label>
              <Input
                id="pesoMedio"
                type="number"
                step="0.1"
                min={0}
                value={pesoMedio}
                onChange={(e) => setPesoMedio(e.target.value)}
                placeholder="6.5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Observaciones sobre el destete..."
              value={notas}
              onChange={(e) => setNotas(e.target.value.slice(0, 500))}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {notas.length}/500 caracteres
            </p>
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
      </DialogContent>
    </Dialog>
  );
}
