import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EstadoBadge } from '@/components/ui/EstadoBadge';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Calendar, MapPin, Heart, AlertTriangle, 
  Baby, Activity, Clock, CheckCircle2, XCircle, Pencil 
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { TIPO_EVENTO_LABELS, TipoEvento } from '@/types/database';
import { useState } from 'react';
import { IncidenciaModal } from '@/components/modals/IncidenciaModal';
import { CubricionModal } from '@/components/modals/CubricionModal';
import { PartoModal } from '@/components/modals/PartoModal';
import { EditarEventoModal } from '@/components/modals/EditarEventoModal';
import { useAuth } from '@/contexts/AuthContext';

export default function FichaCerda() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [incidenciaModal, setIncidenciaModal] = useState(false);
  const [cubricionModal, setCubricionModal] = useState(false);
  const [partoModal, setPartoModal] = useState(false);
  const [editEventoModal, setEditEventoModal] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<{
    id: string;
    tipo_evento: string;
    fecha: string;
    notas: string | null;
    datos: Record<string, unknown> | null;
  } | null>(null);

  const { data: cerda, isLoading: loadingCerda, refetch: refetchCerda } = useQuery({
    queryKey: ['cerda', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cerdas')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: eventos, isLoading: loadingEventos, refetch: refetchEventos } = useQuery({
    queryKey: ['eventos-cerda', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('cerda_id', id!)
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: incidencias, isLoading: loadingIncidencias, refetch: refetchIncidencias } = useQuery({
    queryKey: ['incidencias-cerda', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidencias')
        .select('*, profiles:usuario_id(nombre, email)')
        .eq('cerda_id', id!)
        .order('fecha_hora', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const refetchAll = () => {
    refetchCerda();
    refetchEventos();
    refetchIncidencias();
  };

  if (loadingCerda) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!cerda) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Cerda no encontrada</h2>
          <Button onClick={() => navigate('/cerdas')}>
            <ArrowLeft className="w-4 h-4 mr-2" />Volver a la lista
          </Button>
        </div>
      </MainLayout>
    );
  }

  const medios = cerda.medios_historicos as { nacidos_vivos: number; destetados: number; viabilidad: number } | null;

  const getEventoIcon = (tipo: TipoEvento) => {
    switch (tipo) {
      case 'cubricion': return <Heart className="w-4 h-4 text-pink-500" />;
      case 'parto': return <Baby className="w-4 h-4 text-blue-500" />;
      case 'destete': return <Activity className="w-4 h-4 text-green-500" />;
      case 'ecografia': return <Activity className="w-4 h-4 text-purple-500" />;
      case 'gestacion': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'baja': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/cerdas')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-display font-bold text-primary">{cerda.codigo}</h1>
                <EstadoBadge estado={cerda.estado} />
              </div>
              {cerda.nombre && <p className="text-muted-foreground">{cerda.nombre}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCubricionModal(true)}>
              <Heart className="w-4 h-4 mr-2 text-pink-500" />Cubrición
            </Button>
            <Button variant="outline" onClick={() => setPartoModal(true)}>
              <Baby className="w-4 h-4 mr-2 text-blue-500" />Parto
            </Button>
            <Button variant="outline" onClick={() => setIncidenciaModal(true)}>
              <AlertTriangle className="w-4 h-4 mr-2" />Incidencia
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Baby className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paridad</p>
                  <p className="text-2xl font-bold">{cerda.paridad}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nave</p>
                  <p className="text-2xl font-bold">{cerda.nave || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha Alta</p>
                  <p className="text-lg font-bold">
                    {cerda.fecha_alta ? format(new Date(cerda.fecha_alta), 'dd/MM/yyyy') : '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Origen</p>
                  <p className="text-lg font-bold">{cerda.origen || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medios Históricos */}
        {medios && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Medios Históricos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-primary">{medios.nacidos_vivos}</p>
                  <p className="text-sm text-muted-foreground">Nacidos Vivos (media)</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-600">{medios.destetados}</p>
                  <p className="text-sm text-muted-foreground">Destetados (media)</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">{medios.viabilidad}%</p>
                  <p className="text-sm text-muted-foreground">Viabilidad</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs: Eventos e Incidencias */}
        <Tabs defaultValue="eventos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="eventos">
              Eventos ({eventos?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="incidencias">
              Incidencias ({incidencias?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="eventos" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {loadingEventos ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : eventos?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay eventos registrados</p>
                ) : (
                  <div className="space-y-4">
                    {eventos?.map((evento) => (
                      <div key={evento.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="p-2 rounded-full bg-background shadow-sm">
                          {getEventoIcon(evento.tipo_evento as TipoEvento)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary">
                              {TIPO_EVENTO_LABELS[evento.tipo_evento as TipoEvento] || evento.tipo_evento}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(evento.fecha), "d 'de' MMMM, yyyy", { locale: es })}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setSelectedEvento({
                                  id: evento.id,
                                  tipo_evento: evento.tipo_evento,
                                  fecha: evento.fecha,
                                  notas: evento.notas,
                                  datos: evento.datos as Record<string, unknown> | null,
                                });
                                setEditEventoModal(true);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </div>
                          {evento.notas && (
                            <p className="text-sm mt-1 text-muted-foreground">{evento.notas}</p>
                          )}
                          {evento.datos && Object.keys(evento.datos as object).length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {Object.entries(evento.datos as object).map(([key, value]) => (
                                <span key={key} className="inline-block mr-3">
                                  <span className="font-medium">{key}:</span> {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incidencias" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {loadingIncidencias ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : incidencias?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay incidencias registradas</p>
                ) : (
                  <div className="space-y-4">
                    {incidencias?.map((incidencia) => (
                      <div key={incidencia.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className={`p-2 rounded-full shadow-sm ${incidencia.resuelta ? 'bg-green-100' : 'bg-yellow-100'}`}>
                          {incidencia.resuelta ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={incidencia.resuelta ? 'default' : 'destructive'}>
                              {incidencia.resuelta ? 'Resuelta' : 'Pendiente'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(incidencia.fecha_hora), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                            </span>
                          </div>
                          <p className="mt-2">{incidencia.texto}</p>
                          {incidencia.profiles && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Reportada por: {(incidencia.profiles as any).nombre || (incidencia.profiles as any).email}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <IncidenciaModal
        open={incidenciaModal}
        onClose={() => setIncidenciaModal(false)}
        cerdaId={cerda.id}
        cerdaCodigo={cerda.codigo}
        onSuccess={refetchAll}
      />

      <CubricionModal
        open={cubricionModal}
        onClose={() => setCubricionModal(false)}
        cerdaId={cerda.id}
        cerdaCodigo={cerda.codigo}
        onSuccess={refetchAll}
      />

      <PartoModal
        open={partoModal}
        onClose={() => setPartoModal(false)}
        cerdaId={cerda.id}
        cerdaCodigo={cerda.codigo}
        onSuccess={refetchAll}
      />

      <EditarEventoModal
        open={editEventoModal}
        onClose={() => {
          setEditEventoModal(false);
          setSelectedEvento(null);
        }}
        evento={selectedEvento}
        onSuccess={refetchEventos}
      />
    </MainLayout>
  );
}
