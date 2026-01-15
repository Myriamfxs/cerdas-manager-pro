import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCreateCerda } from '@/hooks/useCerdas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function NuevaCerda() {
  const navigate = useNavigate();
  const createCerda = useCreateCerda();
  const [formData, setFormData] = useState({ codigo: '', nombre: '', origen: '', nave: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo.trim()) {
      toast.error('El código es obligatorio');
      return;
    }
    try {
      await createCerda.mutateAsync({
        codigo: formData.codigo.trim(),
        nombre: formData.nombre.trim() || undefined,
        origen: formData.origen.trim() || undefined,
        nave: formData.nave.trim() || undefined
      });
      navigate('/cerdas');
    } catch (error) {}
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Registrar Nueva Cerda</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código *</Label>
                  <Input id="codigo" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} placeholder="Ej: CERDA-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Nombre opcional" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origen">Origen</Label>
                  <Input id="origen" value={formData.origen} onChange={(e) => setFormData({ ...formData, origen: e.target.value })} placeholder="Procedencia" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nave">Nave</Label>
                  <Input id="nave" value={formData.nave} onChange={(e) => setFormData({ ...formData, nave: e.target.value })} placeholder="Nave asignada" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createCerda.isPending}>
                <Save className="w-4 h-4 mr-2" />{createCerda.isPending ? 'Guardando...' : 'Guardar Cerda'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
