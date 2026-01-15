import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface IncidenciaModalProps {
  open: boolean;
  onClose: () => void;
  cerdaId: string;
  cerdaCodigo: string;
  onSuccess?: () => void;
}

export function IncidenciaModal({ 
  open, 
  onClose, 
  cerdaId, 
  cerdaCodigo,
  onSuccess 
}: IncidenciaModalProps) {
  const { user } = useAuth();
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const now = new Date();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!texto.trim()) {
      toast.error('Debes escribir una descripción de la incidencia');
      return;
    }

    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('incidencias')
        .insert({
          cerda_id: cerdaId,
          usuario_id: user.id,
          texto: texto.trim(),
          fecha_hora: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Incidencia registrada correctamente');
      setTexto('');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating incidencia:', error);
      toast.error('Error al registrar la incidencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Nueva Incidencia
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
            <Label htmlFor="texto">Descripción de la incidencia</Label>
            <Textarea
              id="texto"
              placeholder="Describe la incidencia observada..."
              value={texto}
              onChange={(e) => setTexto(e.target.value.slice(0, 400))}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {texto.length}/400 caracteres
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !texto.trim()}>
              {loading ? 'Registrando...' : 'Registrar Incidencia'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
