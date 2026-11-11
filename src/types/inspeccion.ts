/** Estados operativos de una inspección técnica. */
export type EstadoInspeccion = 'completada' | 'validada' | 'devuelta';

/** Decisión que el supervisor puede aplicar a una inspección. */
export type DecisionInspeccion = 'validada' | 'devuelta';

/** Filtro de listado: un estado concreto o todas las inspecciones. */
export type FiltroEstado = EstadoInspeccion | 'todas';

/** Datos mínimos del técnico asociados a una inspección. */
export type TecnicoResumen = {
  /** Identificador del perfil del técnico (`perfiles.id`). */
  id: string;
  /** Nombre visible del técnico. */
  nombre: string;
};

/**
 * Inspección técnica tal como la consume la app.
 * El campo `tecnico` se resuelve en el servicio a partir de `tecnico_id`.
 */
export type Inspeccion = {
  id: string;
  /** FK hacia `perfiles.id` del técnico responsable. */
  tecnico_id: string;
  /** Tipo o categoría de la inspección. */
  tipo: string;
  /** Descripción del trabajo realizado. */
  descripcion: string;
  estado: EstadoInspeccion;
  /** Observación del supervisor; requerida al devolver. */
  observacion: string | null;
  created_at: string;
  /** Perfil del técnico, o `null` si no está disponible. */
  tecnico: TecnicoResumen | null;
};

/** Reporte generado por un supervisor a partir de un filtro de inspecciones. */
export type Reporte = {
  id: string;
  /** FK hacia el perfil del supervisor que creó el reporte. */
  supervisor_id: string;
  titulo: string;
  /** Filtro usado al generar el reporte (`todas` si no se filtró). */
  filtro_estado: FiltroEstado;
  /** Cantidad de inspecciones incluidas al momento de crear el reporte. */
  total: number;
  created_at: string;
};

export const ETIQUETAS_ESTADO: Record<FiltroEstado, string> = {
  todas: 'Todas',
  completada: 'Completada',
  validada: 'Validada',
  devuelta: 'Devuelta',
};
