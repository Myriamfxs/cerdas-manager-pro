import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError } from '@/lib/logger';
import type { Tables } from '@/integrations/supabase/types';
import { Constants } from '@/integrations/supabase/types';

type Cerda = Tables<'cerdas'>;

interface EditarCerdaModalProps {
  open: boolean;
  onClose: () => void;
  cerda: Cerda;
  onSuccess?: () => void;
}

const ESTADO_LABELS: Record<string, string> = {
  en_servicio: 'En Servicio',
  seca: 'Seca',
  cubierta: 'Cubierta',
  gestante: 'Gestante',
  parto: 'Parto',
  destete: 'Destete',
  baja: 'Baja',
};

export function EditarCerdaModal({ open, onClose, cerda, onSuccess }: EditarCerdaModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    nave: '',
    origen: '',
    paridad: 0,
    estado: 'en_servicio' as string,
    activa: true,
  });

  useEffect(() => {
    if (cerda && open) {
      setForm({
        codigo: cerda.codigo,
        nombre: cerda.nombre || '',
        nave: cerda.nave || '',
        origen: cerda.origen || '',
        paridad: cerda.paridad || 0,
        estado: cerda.estado || 'en_servicio',
        activa: cerda.activa ?? true,
      });
    }
  }, [cerda, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.codigo.trim()) {
      toast.error('El código es obligatorio');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('cerdas')
        .update({
          codigo: form.codigo.trim(),
          nombre: form.nombre.trim() || null,
          nave: form.nave.trim() || null,
          origen: form.origen.trim() || null,
          paridad: form.paridad,
          estado: form.estado as any,
          activa: form.activa,
        })
        .eq('id', cerda.id);

      if (error) throw error;

      toast.success('Cerda actualizada correctamente');
      onSuccess?.();
      onClose();
    } catch (error) {
      logError('EditarCerdaModal.handleSubmit', error);
      toast.error('Error al actualizar la cerda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Editar Cerda
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                placeholder="C001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Nombre"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nave">Nave</Label>
              <Input
                id="nave"
                value={form.nave}
                onChange={(e) => setForm({ ...form, nave: e.target.value })}
                placeholder="Nave 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="origen">Origen</Label>
              <Input
                id="origen"
                value={form.origen}
                onChange={(e) => setForm({ ...form, origen: e.target.value })}
                placeholder="Granja propia"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paridad">Paridad</Label>
              <Input
                id="paridad"
                type="number"
                min={0}
                value={form.paridad}
                onChange={(e) => setForm({ ...form, paridad: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                <SelectTrigger id="estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.estado_cerda.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {ESTADO_LABELS[estado] || estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="activa">Activa</Label>
            <Switch
              id="activa"
              checked={form.activa}
              onCheckedChange={(checked) => setForm({ ...form, activa: checked })}
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
