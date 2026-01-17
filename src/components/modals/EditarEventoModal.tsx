import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { Calendar, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError } from '@/lib/logger';
import { TIPO_EVENTO_LABELS, TipoEvento } from '@/types/database';

interface Evento {
  id: string;
  tipo_evento: string;
  fecha: string;
  notas: string | null;
  datos: Record<string, unknown> | null;
}

interface EditarEventoModalProps {
  open: boolean;
  onClose: () => void;
  evento: Evento | null;
  onSuccess?: () => void;
}

export function EditarEventoModal({ 
  open, 
  onClose, 
  evento,
  onSuccess 
}: EditarEventoModalProps) {
  const [fecha, setFecha] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (evento) {
      setFecha(evento.fecha);
      setNotas(evento.notas || '');
    }
  }, [evento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!evento) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('eventos')
        .update({
          fecha,
          notas: notas.trim() || null,
        })
        .eq('id', evento.id);

      if (error) throw error;

      toast.success('Evento actualizado correctamente');
      onSuccess?.();
      onClose();
    } catch (error) {
      logError('EditarEventoModal.handleSubmit', error);
      toast.error('Error al actualizar el evento');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  if (!evento) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-primary" />
            Editar Evento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium text-foreground">
              Tipo: <span className="text-primary">
                {TIPO_EVENTO_LABELS[evento.tipo_evento as TipoEvento] || evento.tipo_evento}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fecha" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha
            </Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              placeholder="Observaciones..."
              value={notas}
              onChange={(e) => setNotas(e.target.value.slice(0, 500))}
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
