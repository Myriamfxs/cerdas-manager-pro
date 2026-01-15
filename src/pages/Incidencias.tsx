import { MainLayout } from '@/components/layout/MainLayout';
import { useIncidenciasRecientes, useResolverIncidencia } from '@/hooks/useIncidencias';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Incidencias() {
  const { data: incidencias, isLoading } = useIncidenciasRecientes(90);
  const resolverMutation = useResolverIncidencia();

  const incidenciasActivas = incidencias?.filter((i: any) => !i.resuelta) || [];
  const incidenciasResueltas = incidencias?.filter((i: any) => i.resuelta) || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Incidencias de la Granja</h1>
          <p className="text-muted-foreground">Últimos 90 días - {incidenciasActivas.length} activas</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-5 h-5" />
                  Incidencias Activas ({incidenciasActivas.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {incidenciasActivas.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Sin incidencias activas</p>
                ) : (
                  incidenciasActivas.map((inc: any) => (
                    <div key={inc.id} className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-primary">{inc.cerdas?.codigo}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(inc.fecha_hora), "d MMM, HH:mm", { locale: es })}
                            </span>
                          </div>
                          <p className="text-sm">{inc.texto}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => resolverMutation.mutate({ id: inc.id, resuelta: true })}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-5 h-5" />
                  Resueltas ({incidenciasResueltas.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {incidenciasResueltas.slice(0, 10).map((inc: any) => (
                  <div key={inc.id} className="p-3 bg-muted/50 rounded-lg opacity-75">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{inc.cerdas?.codigo}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(inc.fecha_hora), "d MMM", { locale: es })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{inc.texto}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
