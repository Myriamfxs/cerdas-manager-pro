// Tipos personalizados para la aplicación

export type EstadoCerda = 'en_servicio' | 'seca' | 'cubierta' | 'gestante' | 'parto' | 'destete' | 'baja';
export type TipoEvento = 'cubricion' | 'gestacion' | 'parto' | 'destete' | 'baja' | 'ecografia';
export type AppRole = 'admin' | 'tecnico';

export interface Profile {
  id: string;
  email: string | null;
  nombre: string | null;
  nave_asignada: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Cerda {
  id: string;
  codigo: string;
  nombre: string | null;
  estado: EstadoCerda;
  fecha_alta: string | null;
  fecha_nacimiento: string | null;
  paridad: number;
  origen: string | null;
  nave: string | null;
  medios_historicos: {
    nacidos_vivos: number;
    destetados: number;
    viabilidad: number;
  };
  ultima_incidencia_fecha: string | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Incidencia {
  id: string;
  cerda_id: string;
  usuario_id: string;
  fecha_hora: string;
  texto: string;
  resuelta: boolean;
  created_at: string;
  usuario?: Profile;
}

export interface Evento {
  id: string;
  cerda_id: string;
  tipo_evento: TipoEvento;
  fecha: string;
  datos: Record<string, unknown>;
  notas: string | null;
  usuario_id: string | null;
  created_at: string;
}

export interface Verraco {
  id: string;
  codigo: string;
  nombre: string | null;
  raza: string | null;
  activo: boolean;
  created_at: string;
}

export const ESTADO_LABELS: Record<EstadoCerda, string> = {
  en_servicio: 'En Servicio',
  seca: 'Seca',
  cubierta: 'Cubierta',
  gestante: 'Gestante',
  parto: 'Parto',
  destete: 'Destete',
  baja: 'Baja'
};

export const ESTADO_COLORS: Record<EstadoCerda, string> = {
  en_servicio: 'bg-estado-servicio text-white',
  seca: 'bg-estado-seca text-white',
  cubierta: 'bg-estado-cubierta text-white',
  gestante: 'bg-estado-gestante text-white',
  parto: 'bg-estado-parto text-white',
  destete: 'bg-estado-destete text-white',
  baja: 'bg-estado-baja text-white'
};

export const TIPO_EVENTO_LABELS: Record<TipoEvento, string> = {
  cubricion: 'Cubrición',
  gestacion: 'Gestación',
  parto: 'Parto',
  destete: 'Destete',
  baja: 'Baja',
  ecografia: 'Ecografía'
};
