import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/ui/StatCard';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useIncidenciasRecientes } from '@/hooks/useIncidencias';
import { PiggyBank, AlertTriangle, Baby, Heart, Activity, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ESTADO_LABELS } from '@/types/database';
import { EstadoBadge } from '@/components/ui/EstadoBadge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: incidenciasRecientes } = useIncidenciasRecientes(7);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Resumen de tu granja porcina</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Cerdas" value={stats?.totalCerdas || 0} icon={<PiggyBank className="w-5 h-5" />} variant="primary" />
          <StatCard title="Incidencias Activas" value={stats?.incidenciasActivas || 0} icon={<AlertTriangle className="w-5 h-5" />} variant={stats?.incidenciasActivas ? 'warning' : 'default'} />
          <StatCard title="Media Nacidos Vivos" value={stats?.mediaNacidosVivos || 0} icon={<Baby className="w-5 h-5" />} variant="success" />
          <StatCard title="Media Destetados" value={stats?.mediaDestetados || 0} icon={<Heart className="w-5 h-5" />} variant="default" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Estado del Rebaño
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(stats?.cerdasPorEstado || {}).map(([estado, count]) => (
                  <div key={estado} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <EstadoBadge estado={estado as any} />
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-warning" />
                Incidencias Recientes
              </CardTitle>
              <Link to="/incidencias">
                <Button variant="outline" size="sm">Ver todas</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {incidenciasRecientes?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Sin incidencias recientes</p>
              ) : (
                <div className="space-y-3">
                  {incidenciasRecientes?.slice(0, 5).map((inc: any) => (
                    <div key={inc.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-primary">{inc.cerdas?.codigo}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(inc.fecha_hora), "d MMM, HH:mm", { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{inc.texto}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
