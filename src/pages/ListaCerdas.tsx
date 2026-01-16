import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCerdas } from '@/hooks/useCerdas';
import { EstadoBadge } from '@/components/ui/EstadoBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, AlertTriangle, Eye, Heart } from 'lucide-react';
import { ESTADO_LABELS, EstadoCerda } from '@/types/database';
import { Link } from 'react-router-dom';
import { IncidenciaModal } from '@/components/modals/IncidenciaModal';
import { CubricionModal } from '@/components/modals/CubricionModal';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export default function ListaCerdas() {
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [incidenciaModal, setIncidenciaModal] = useState<{ open: boolean; cerda: any | null }>({ open: false, cerda: null });
  const [cubricionModal, setCubricionModal] = useState<{ open: boolean; cerda: any | null }>({ open: false, cerda: null });
  const { isAdmin } = useAuth();

  const { data: cerdas, isLoading, refetch } = useCerdas({
    search: search || undefined,
    estado: estadoFilter !== 'all' ? estadoFilter as EstadoCerda : undefined
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Lista de Cerdas</h1>
            <p className="text-muted-foreground">{cerdas?.length || 0} cerdas registradas</p>
          </div>
          {isAdmin && (
            <Link to="/nueva-cerda">
              <Button><Plus className="w-4 h-4 mr-2" />Nueva Cerda</Button>
            </Link>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por código o nombre..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.entries(ESTADO_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="card-farm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-farm">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Estado</th>
                    <th>Paridad</th>
                    <th>Nave</th>
                    <th>Última Incidencia</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cerdas?.map((cerda) => (
                    <tr key={cerda.id}>
                      <td className="font-medium text-primary">{cerda.codigo}</td>
                      <td>{cerda.nombre || '-'}</td>
                      <td><EstadoBadge estado={cerda.estado} /></td>
                      <td>{cerda.paridad}</td>
                      <td>{cerda.nave || '-'}</td>
                      <td className="text-sm text-muted-foreground">
                        {cerda.ultima_incidencia_fecha ? format(new Date(cerda.ultima_incidencia_fecha), 'dd/MM/yy HH:mm') : '-'}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setCubricionModal({ open: true, cerda })}
                            title="Registrar cubrición"
                          >
                            <Heart className="w-4 h-4 text-pink-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setIncidenciaModal({ open: true, cerda })}
                            title="Registrar incidencia"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                          <Link to={`/cerda/${cerda.id}`}>
                            <Button variant="ghost" size="sm" title="Ver ficha"><Eye className="w-4 h-4" /></Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {cerdas?.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No se encontraron cerdas</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {incidenciaModal.cerda && (
        <IncidenciaModal
          open={incidenciaModal.open}
          onClose={() => setIncidenciaModal({ open: false, cerda: null })}
          cerdaId={incidenciaModal.cerda.id}
          cerdaCodigo={incidenciaModal.cerda.codigo}
          onSuccess={() => refetch()}
        />
      )}

      {cubricionModal.cerda && (
        <CubricionModal
          open={cubricionModal.open}
          onClose={() => setCubricionModal({ open: false, cerda: null })}
          cerdaId={cubricionModal.cerda.id}
          cerdaCodigo={cubricionModal.cerda.codigo}
          onSuccess={() => refetch()}
        />
      )}
    </MainLayout>
  );
}
