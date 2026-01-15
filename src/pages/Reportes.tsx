import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, PiggyBank, AlertTriangle, BarChart3 } from 'lucide-react';

export default function Reportes() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Reportes</h1>
          <p className="text-muted-foreground">Exporta datos de tu granja</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-primary" />
                Listado de Cerdas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Exporta el listado completo de cerdas con sus estados y datos reproductivos.</p>
              <Button className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />Exportar CSV
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Historial Incidencias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Descarga todas las incidencias registradas con fechas y detalles.</p>
              <Button className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />Exportar CSV
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-success" />
                KPIs Productivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Resumen de indicadores: nacidos vivos, destetados, viabilidad.</p>
              <Button className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />Exportar PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
