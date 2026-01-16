import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Settings, Bell, Database, Shield, Save } from 'lucide-react';

export default function Configuracion() {
  const [settings, setSettings] = useState({
    nombreGranja: 'Granja Porcina Demo',
    diasGestacion: 114,
    diasLactancia: 21,
    notificacionesEmail: true,
    notificacionesPush: false,
    backupAutomatico: true,
    modoMantenimiento: false,
  });

  const handleSave = () => {
    // En producción, esto guardaría en la base de datos
    toast.success('Configuración guardada correctamente');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Configuración del Sistema</h1>
            <p className="text-muted-foreground">Ajustes generales de la aplicación</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Configuración General */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Configuración General
              </CardTitle>
              <CardDescription>
                Parámetros básicos de la granja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombreGranja">Nombre de la Granja</Label>
                <Input
                  id="nombreGranja"
                  value={settings.nombreGranja}
                  onChange={(e) => setSettings({ ...settings, nombreGranja: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diasGestacion">Días de Gestación (estándar)</Label>
                <Input
                  id="diasGestacion"
                  type="number"
                  value={settings.diasGestacion}
                  onChange={(e) => setSettings({ ...settings, diasGestacion: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diasLactancia">Días de Lactancia (estándar)</Label>
                <Input
                  id="diasLactancia"
                  type="number"
                  value={settings.diasLactancia}
                  onChange={(e) => setSettings({ ...settings, diasLactancia: parseInt(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificaciones
              </CardTitle>
              <CardDescription>
                Configura cómo recibir alertas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe alertas importantes por correo
                  </p>
                </div>
                <Switch
                  checked={settings.notificacionesEmail}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, notificacionesEmail: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones Push</Label>
                  <p className="text-sm text-muted-foreground">
                    Alertas en tiempo real en el navegador
                  </p>
                </div>
                <Switch
                  checked={settings.notificacionesPush}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, notificacionesPush: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Sistema */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Sistema y Seguridad
              </CardTitle>
              <CardDescription>
                Opciones avanzadas del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="space-y-0.5">
                    <Label>Backup Automático</Label>
                    <p className="text-sm text-muted-foreground">
                      Respaldo diario de datos
                    </p>
                  </div>
                  <Switch
                    checked={settings.backupAutomatico}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, backupAutomatico: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20">
                  <div className="space-y-0.5">
                    <Label className="text-destructive">Modo Mantenimiento</Label>
                    <p className="text-sm text-muted-foreground">
                      Bloquea acceso a usuarios
                    </p>
                  </div>
                  <Switch
                    checked={settings.modoMantenimiento}
                    onCheckedChange={(checked) => 
                      setSettings({ ...settings, modoMantenimiento: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Guardar Configuración
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
