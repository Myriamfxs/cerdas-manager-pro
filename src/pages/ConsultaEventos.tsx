import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Heart, Baby, Search, AlertCircle } from 'lucide-react';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { EstadoBadge } from '@/components/ui/EstadoBadge';
import type { EstadoCerda } from '@/types/database';

// Días de gestación estándar para cerdos
const DIAS_GESTACION = 114;
// Días entre cubrición y confirmación (ecografía)
const DIAS_CONFIRMACION = 21;

export default function ConsultaEventos() {
  const [fechaConsulta, setFechaConsulta] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Obtener cerdas cubiertas para calcular fechas de parto esperado
  const { data: cerdasCubiertas, isLoading: loadingCubiertas } = useQuery({
    queryKey: ['cerdas-cubiertas-eventos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cerdas')
        .select('*')
        .in('estado', ['cubierta', 'gestante'])
        .eq('activa', true);
      if (error) throw error;
      return data;
    },
  });

  // Obtener eventos de cubrición para calcular fechas
  const { data: eventosCubricion, isLoading: loadingEventos } = useQuery({
    queryKey: ['eventos-cubricion-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('*, cerdas!inner(codigo, nombre, estado, activa)')
        .eq('tipo_evento', 'cubricion')
        .eq('cerdas.activa', true)
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Obtener cerdas en servicio (disponibles para cubrir)
  const { data: cerdasEnServicio, isLoading: loadingServicio } = useQuery({
    queryKey: ['cerdas-en-servicio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cerdas')
        .select('*')
        .eq('estado', 'en_servicio')
        .eq('activa', true);
      if (error) throw error;
      return data;
    },
  });

  // Obtener cerdas en parto/lactancia para destete
  const { data: cerdasParto, isLoading: loadingParto } = useQuery({
    queryKey: ['cerdas-parto'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cerdas')
        .select('*')
        .eq('estado', 'parto')
        .eq('activa', true);
      if (error) throw error;
      return data;
    },
  });

  const fechaSeleccionada = parseISO(fechaConsulta);

  // Calcular cerdas con parto esperado en la fecha seleccionada
  const cerdasPartoEsperado = eventosCubricion?.filter((evento) => {
    const fechaCubricion = parseISO(evento.fecha);
    const fechaPartoEsperado = addDays(fechaCubricion, DIAS_GESTACION);
    const diferencia = Math.abs(differenceInDays(fechaPartoEsperado, fechaSeleccionada));
    return diferencia <= 3; // ±3 días
  }).map((evento) => ({
    ...evento,
    fechaPartoEsperado: addDays(parseISO(evento.fecha), DIAS_GESTACION),
  })) || [];

  // Calcular cerdas que necesitan ecografía en la fecha seleccionada
  const cerdasEcografia = eventosCubricion?.filter((evento) => {
    const cerda = evento.cerdas as { estado: string };
    if (cerda.estado !== 'cubierta') return false;
    
    const fechaCubricion = parseISO(evento.fecha);
    const fechaEcografia = addDays(fechaCubricion, DIAS_CONFIRMACION);
    const diferencia = Math.abs(differenceInDays(fechaEcografia, fechaSeleccionada));
    return diferencia <= 2; // ±2 días
  }).map((evento) => ({
    ...evento,
    fechaEcografiaEsperada: addDays(parseISO(evento.fecha), DIAS_CONFIRMACION),
  })) || [];

  const isLoading = loadingCubiertas || loadingEventos || loadingServicio || loadingParto;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Consulta de Eventos</h1>
              <p className="text-muted-foreground">Consulta eventos programados por fecha</p>
            </div>
          </div>
        </div>

        {/* Selector de fecha */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="fecha" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Fecha de consulta
                </Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fechaConsulta}
                  onChange={(e) => setFechaConsulta(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <div className="text-lg font-medium text-primary">
                {format(fechaSeleccionada, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="partos" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="partos" className="flex items-center gap-2">
                <Baby className="w-4 h-4" />
                Partos ({cerdasPartoEsperado.length})
              </TabsTrigger>
              <TabsTrigger value="ecografias" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Ecografías ({cerdasEcografia.length})
              </TabsTrigger>
              <TabsTrigger value="cubrir" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                A Cubrir ({cerdasEnServicio?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="destete">
                Destete ({cerdasParto?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Partos esperados */}
            <TabsContent value="partos" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Baby className="w-5 h-5 text-blue-500" />
                    Partos esperados para esta fecha (±3 días)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cerdasPartoEsperado.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay partos esperados para esta fecha
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {cerdasPartoEsperado.map((evento) => {
                        const cerda = evento.cerdas as { codigo: string; nombre: string | null; estado: string };
                        return (
                          <Link
                            key={evento.id}
                            to={`/cerda/${evento.cerda_id}`}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-primary">{cerda.codigo}</span>
                                {cerda.nombre && <span className="text-muted-foreground">- {cerda.nombre}</span>}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Cubrición: {format(parseISO(evento.fecha), 'dd/MM/yyyy')}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                Parto: {format(evento.fechaPartoEsperado, 'dd/MM/yyyy')}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {differenceInDays(evento.fechaPartoEsperado, fechaSeleccionada) === 0
                                  ? 'Hoy'
                                  : differenceInDays(evento.fechaPartoEsperado, fechaSeleccionada) > 0
                                  ? `En ${differenceInDays(evento.fechaPartoEsperado, fechaSeleccionada)} días`
                                  : `Hace ${Math.abs(differenceInDays(evento.fechaPartoEsperado, fechaSeleccionada))} días`}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ecografías pendientes */}
            <TabsContent value="ecografias" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-purple-500" />
                    Ecografías programadas (±2 días)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cerdasEcografia.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay ecografías programadas para esta fecha
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {cerdasEcografia.map((evento) => {
                        const cerda = evento.cerdas as { codigo: string; nombre: string | null; estado: string };
                        return (
                          <Link
                            key={evento.id}
                            to={`/cerda/${evento.cerda_id}`}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-primary">{cerda.codigo}</span>
                                {cerda.nombre && <span className="text-muted-foreground">- {cerda.nombre}</span>}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Cubrición: {format(parseISO(evento.fecha), 'dd/MM/yyyy')}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                                Ecografía: {format(evento.fechaEcografiaEsperada, 'dd/MM/yyyy')}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                Día {DIAS_CONFIRMACION} post-cubrición
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cerdas a cubrir */}
            <TabsContent value="cubrir" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500" />
                    Cerdas disponibles para cubrir (En Servicio)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cerdasEnServicio?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay cerdas en servicio actualmente
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {cerdasEnServicio?.map((cerda) => (
                        <Link
                          key={cerda.id}
                          to={`/cerda/${cerda.id}`}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-primary">{cerda.codigo}</span>
                              {cerda.nombre && <span className="text-muted-foreground">- {cerda.nombre}</span>}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Paridad: {cerda.paridad} | Nave: {cerda.nave || '-'}
                            </p>
                          </div>
                          <EstadoBadge estado={cerda.estado as EstadoCerda} />
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Destete */}
            <TabsContent value="destete" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Cerdas en lactancia (pendientes de destete)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cerdasParto?.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No hay cerdas en lactancia actualmente
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {cerdasParto?.map((cerda) => (
                        <Link
                          key={cerda.id}
                          to={`/cerda/${cerda.id}`}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-primary">{cerda.codigo}</span>
                              {cerda.nombre && <span className="text-muted-foreground">- {cerda.nombre}</span>}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Paridad: {cerda.paridad} | Nave: {cerda.nave || '-'}
                            </p>
                          </div>
                          <EstadoBadge estado={cerda.estado as EstadoCerda} />
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MainLayout>
  );
}
