import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Baby, Calendar, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logError } from '@/lib/logger';

interface PartoModalProps {
  open: boolean;
  onClose: () => void;
  cerdaId: string;
  cerdaCodigo: string;
  onSuccess?: () => void;
}

interface MuerteCria {
  fecha: string;
  cantidad: number;
}

export function PartoModal({ 
  open, 
  onClose, 
  cerdaId, 
  cerdaCodigo,
  onSuccess 
}: PartoModalProps) {
  const { user } = useAuth();
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [nacidosVivos, setNacidosVivos] = useState<number>(0);
  const [nacidosMuertos, setNacidosMuertos] = useState<number>(0);
  const [muyBuenos, setMuyBuenos] = useState<number | ''>('');
  const [buenos, setBuenos] = useState<number | ''>('');
  const [aceptables, setAceptables] = useState<number | ''>('');
  const [pequenos, setPequenos] = useState<number | ''>('');
  const [muertes, setMuertes] = useState<MuerteCria[]>([]);
  const [destetados, setDestetados] = useState<number | ''>('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddMuerte = () => {
    setMuertes([...muertes, { fecha: format(new Date(), 'yyyy-MM-dd'), cantidad: 1 }]);
  };

  const handleRemoveMuerte = (index: number) => {
    setMuertes(muertes.filter((_, i) => i !== index));
  };

  const handleMuerteChange = (index: number, field: keyof MuerteCria, value: string | number) => {
    const updated = [...muertes];
    if (field === 'fecha') {
      updated[index].fecha = value as string;
    } else {
      updated[index].cantidad = Number(value) || 0;
    }
    setMuertes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (nacidosVivos < 0) {
      toast.error('Los nacidos vivos no pueden ser negativos');
      return;
    }

    if (!user) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setLoading(true);
    
    try {
      const datos: Record<string, unknown> = {
        nacidos_vivos: nacidosVivos,
        nacidos_muertos: nacidosMuertos,
        muy_buenos: muyBuenos === '' ? null : muyBuenos,
        buenos: buenos === '' ? null : buenos,
        aceptables: aceptables === '' ? null : aceptables,
        pequenos: pequenos === '' ? null : pequenos,
        muertes: muertes.length > 0 ? muertes.map(m => ({ fecha: m.fecha, cantidad: m.cantidad })) : null,
        destetados: destetados === '' ? null : destetados,
      };

      const { error: eventoError } = await supabase
        .from('eventos')
        .insert([{
          cerda_id: cerdaId,
          usuario_id: user.id,
          tipo_evento: 'parto' as const,
          fecha,
          datos: datos as unknown as Record<string, never>,
          notas: notas.trim() || null,
        }]);

      if (eventoError) throw eventoError;

      // Obtener paridad actual
      const { data: cerdaData } = await supabase
        .from('cerdas')
        .select('paridad')
        .eq('id', cerdaId)
        .single();

      // Actualizar el estado de la cerda a "parto" e incrementar paridad
      const { error: cerdaError } = await supabase
        .from('cerdas')
        .update({ 
          estado: 'parto' as const,
          paridad: (cerdaData?.paridad || 0) + 1
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
    setFecha(format(new Date(), 'yyyy-MM-dd'));
    setNacidosVivos(0);
    setNacidosMuertos(0);
    setMuyBuenos('');
    setBuenos('');
    setAceptables('');
    setPequenos('');
    setMuertes([]);
    setDestetados('');
    setNotas('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
      onClose();
    }
  };

  const totalMuertes = muertes.reduce((acc, m) => acc + m.cantidad, 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
            </p>
          </div>

          {/* Fecha del parto */}
          <div className="space-y-2">
            <Label htmlFor="fecha" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha del Parto
            </Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>

          {/* Nacidos vivos y muertos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nacidosVivos">Nacidos Vivos *</Label>
              <Input
                id="nacidosVivos"
                type="number"
                min="0"
                value={nacidosVivos}
                onChange={(e) => setNacidosVivos(Number(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nacidosMuertos">Nacidos Muertos</Label>
              <Input
                id="nacidosMuertos"
                type="number"
                min="0"
                value={nacidosMuertos}
                onChange={(e) => setNacidosMuertos(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Clasificación de crías */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Clasificación de crías (opcional)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="muyBuenos" className="text-xs text-muted-foreground">Muy buenos</Label>
                <Input
                  id="muyBuenos"
                  type="number"
                  min="0"
                  value={muyBuenos}
                  onChange={(e) => setMuyBuenos(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="buenos" className="text-xs text-muted-foreground">Buenos</Label>
                <Input
                  id="buenos"
                  type="number"
                  min="0"
                  value={buenos}
                  onChange={(e) => setBuenos(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="aceptables" className="text-xs text-muted-foreground">Aceptables</Label>
                <Input
                  id="aceptables"
                  type="number"
                  min="0"
                  value={aceptables}
                  onChange={(e) => setAceptables(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pequenos" className="text-xs text-muted-foreground">Pequeños</Label>
                <Input
                  id="pequenos"
                  type="number"
                  min="0"
                  value={pequenos}
                  onChange={(e) => setPequenos(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Muertes de crías */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Muertes de crías</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddMuerte}>
                <Plus className="w-4 h-4 mr-1" />
                Añadir
              </Button>
            </div>
            {muertes.length > 0 && (
              <div className="space-y-2">
                {muertes.map((muerte, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={muerte.fecha}
                      onChange={(e) => handleMuerteChange(index, 'fecha', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min="1"
                      value={muerte.cantidad}
                      onChange={(e) => handleMuerteChange(index, 'cantidad', e.target.value)}
                      className="w-20"
                      placeholder="Cant."
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMuerte(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Total muertes registradas: {totalMuertes}
                </p>
              </div>
            )}
          </div>

          {/* Destetados */}
          <div className="space-y-2">
            <Label htmlFor="destetados">Total Destetados</Label>
            <Input
              id="destetados"
              type="number"
              min="0"
              value={destetados}
              onChange={(e) => setDestetados(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Se puede rellenar después"
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Observaciones sobre el parto..."
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
              {loading ? 'Registrando...' : 'Registrar Parto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
