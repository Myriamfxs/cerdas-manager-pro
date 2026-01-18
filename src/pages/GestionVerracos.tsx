import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { logError } from '@/lib/logger';
import { Beef, Plus, Pencil, Trash2 } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Verraco = Tables<'verracos'>;

interface VerracoForm {
  codigo: string;
  nombre: string;
  raza: string;
  activo: boolean;
}

const emptyForm: VerracoForm = {
  codigo: '',
  nombre: '',
  raza: '',
  activo: true,
};

export default function GestionVerracos() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingVerraco, setEditingVerraco] = useState<Verraco | null>(null);
  const [form, setForm] = useState<VerracoForm>(emptyForm);

  const { data: verracos, isLoading } = useQuery({
    queryKey: ['verracos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verracos')
        .select('*')
        .order('codigo');
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: VerracoForm) => {
      const { error } = await supabase.from('verracos').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verracos'] });
      toast.success('Verraco creado correctamente');
      handleClose();
    },
    onError: (error) => {
      logError(error instanceof Error ? error.message : String(error), 'Error al crear verraco');
      toast.error('Error al crear el verraco');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VerracoForm> }) => {
      const { error } = await supabase.from('verracos').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verracos'] });
      toast.success('Verraco actualizado correctamente');
      handleClose();
    },
    onError: (error) => {
      logError(error instanceof Error ? error.message : String(error), 'Error al actualizar verraco');
      toast.error('Error al actualizar el verraco');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('verracos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verracos'] });
      toast.success('Verraco eliminado correctamente');
    },
    onError: (error) => {
      logError(error instanceof Error ? error.message : String(error), 'Error al eliminar verraco');
      toast.error('Error al eliminar el verraco');
    },
  });

  const handleOpen = (verraco?: Verraco) => {
    if (verraco) {
      setEditingVerraco(verraco);
      setForm({
        codigo: verraco.codigo,
        nombre: verraco.nombre || '',
        raza: verraco.raza || '',
        activo: verraco.activo ?? true,
      });
    } else {
      setEditingVerraco(null);
      setForm(emptyForm);
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingVerraco(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo.trim()) {
      toast.error('El código es obligatorio');
      return;
    }
    if (editingVerraco) {
      updateMutation.mutate({ id: editingVerraco.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const toggleActivo = (verraco: Verraco) => {
    updateMutation.mutate({ id: verraco.id, data: { activo: !verraco.activo } });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Beef className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Gestión de Verracos</h1>
              <p className="text-muted-foreground">Administra los verracos de la granja</p>
            </div>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpen()} className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Verraco
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingVerraco ? 'Editar Verraco' : 'Nuevo Verraco'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingVerraco 
                      ? 'Modifica los datos del verraco' 
                      : 'Ingresa los datos del nuevo verraco'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código *</Label>
                    <Input
                      id="codigo"
                      value={form.codigo}
                      onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                      placeholder="V001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      placeholder="Nombre del verraco"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="raza">Raza</Label>
                    <Input
                      id="raza"
                      value={form.raza}
                      onChange={(e) => setForm({ ...form, raza: e.target.value })}
                      placeholder="Duroc, Pietrain, etc."
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="activo">Activo</Label>
                    <Switch
                      id="activo"
                      checked={form.activo}
                      onCheckedChange={(checked) => setForm({ ...form, activo: checked })}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingVerraco ? 'Guardar Cambios' : 'Crear Verraco'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Verracos</CardTitle>
            <CardDescription>
              {verracos?.length || 0} verracos registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : verracos?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay verracos registrados. Crea el primero.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Raza</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verracos?.map((verraco) => (
                    <TableRow key={verraco.id}>
                      <TableCell className="font-mono font-medium">
                        {verraco.codigo}
                      </TableCell>
                      <TableCell>{verraco.nombre || '-'}</TableCell>
                      <TableCell>{verraco.raza || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={verraco.activo ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleActivo(verraco)}
                        >
                          {verraco.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpen(verraco)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm('¿Eliminar este verraco?')) {
                                deleteMutation.mutate(verraco.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
