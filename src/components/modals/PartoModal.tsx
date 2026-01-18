import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Baby, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logError } from '@/lib/logger';

interface PartoModalProps {
  open: boolean;
  onClose: () => void;
  cerdaId: string;
  cerdaCodigo: string;
  paridad: number;
  onSuccess?: () => void;
}

export function PartoModal({ 
  open, 
  onClose, 
  cerdaId, 
  cerdaCodigo,
  paridad,
  onSuccess 
}: PartoModalProps) {
  const { user } = useAuth();
  const [nacidosVivos, setNacidosVivos] = useState(0);
  const [nacidosMuertos, setNacidosMuertos] = useState(0);
  const [momificados, setMomificados] = useState(0);
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const now = new Date();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    if (nacidosVivos < 0 || nacidosMuertos < 0 || momificados < 0) {
      toast.error('Los valores no pueden ser negativos');
      return;
    }

    setLoading(true);
    
    try {
      // Registrar el evento de parto
      const { error: eventoError } = await supabase
        .from('eventos')
        .insert({
          cerda_id: cerdaId,
          usuario_id: user.id,
          tipo_evento: 'parto',
          fecha: format(now, 'yyyy-MM-dd'),
          datos: {
            nacidos_vivos: nacidosVivos,
            nacidos_muertos: nacidosMuertos,
            momificados: momificados,
            total: nacidosVivos + nacidosMuertos + momificados,
          },
          notas: notas.trim() || null,
        });

      if (eventoError) throw eventoError;

      // Actualizar estado de la cerda a "parto" e incrementar paridad
      const { error: cerdaError } = await supabase
        .from('cerdas')
        .update({ 
          estado: 'parto',
          paridad: paridad + 1,
        })
        .eq('id', cerdaId);

      if (cerdaError) throw cerdaError;

      toast.success('Parto registrado correctamente');
      resetForm();
      onSuccess?.();
      onClose();
    } catch (error) {
      logError('PartoModal.handleSubmit', error);
      toast.error('Error al registrar el parto');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNacidosVivos(0);
    setNacidosMuertos(0);
    setMomificados(0);
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
            <Baby className="w-5 h-5 text-blue-500" />
            Registrar Parto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium text-foreground">
              Cerda: <span className="text-primary">{cerdaCodigo}</span>
              <span className="text-muted-foreground ml-2">(Paridad actual: {paridad})</span>
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

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="nacidosVivos">Nacidos Vivos</Label>
              <Input
                id="nacidosVivos"
                type="number"
                min={0}
                value={nacidosVivos}
                onChange={(e) => setNacidosVivos(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nacidosMuertos">Nacidos Muertos</Label>
              <Input
                id="nacidosMuertos"
                type="number"
                min={0}
                value={nacidosMuertos}
                onChange={(e) => setNacidosMuertos(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="momificados">Momificados</Label>
              <Input
                id="momificados"
                type="number"
                min={0}
                value={momificados}
                onChange={(e) => setMomificados(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">Total camada</p>
            <p className="text-2xl font-bold text-primary">
              {nacidosVivos + nacidosMuertos + momificados}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Observaciones sobre el parto..."
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
              {loading ? 'Registrando...' : 'Registrar Parto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
