import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type {
  DecisionInspeccion,
  EstadoInspeccion,
  Inspeccion,
  Reporte,
  TecnicoResumen,
} from '@/types/inspeccion';

/** Fila cruda de `inspecciones` antes de resolver el técnico. */
type InspeccionRow = Omit<Inspeccion, 'tecnico'>;

type ErrorLike = Partial<PostgrestError> & {
  message?: string;
  status?: number;
};


export function mensajeError(error: unknown): string {
  const err = error as ErrorLike;
  const raw = (err?.message ?? '').toLowerCase();
  const code = err?.code ?? '';

  if (
    code === '42501' ||
    raw.includes('row-level security') ||
    raw.includes('permission denied')
  ) {
    return 'No tienes permisos para realizar esta acción.';
  }

  if (raw.includes('jwt') || raw.includes('token is expired')) {
    return 'Tu sesión expiró. Inicia sesión nuevamente.';
  }

  if (
    raw.includes('network request failed') ||
    raw.includes('failed to fetch') ||
    raw.includes('fetch failed')
  ) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión.';
  }

  if (code === '23503') {
    return 'No se puede completar la operación porque hay datos relacionados.';
  }

  if (code === '23502') {
    return 'Faltan datos obligatorios para completar la operación.';
  }

  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}

async function obtenerTecnicos(
  ids: string[],
): Promise<Map<string, TecnicoResumen>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre')
    .in('id', uniqueIds);

  if (error) throw new Error(mensajeError(error));
  if (!data) return new Map();

  return new Map(
    (data as TecnicoResumen[]).map((perfil) => [perfil.id, perfil]),
  );
}

function mapearInspeccion(
  row: InspeccionRow,
  tecnicos: Map<string, TecnicoResumen>,
): Inspeccion {
  return {
    ...row,
    tecnico: tecnicos.get(row.tecnico_id) ?? null,
  };
}

async function obtenerUsuarioId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
  }

  return data.user.id;
}

/** Resultado de diagnóstico para explicar por qué una lista puede venir vacía. */
export type DiagnosticoInspecciones = {
  autenticado: boolean;
  rol: string | null;
  totalVisible: number;
};

/**
 * Consulta sesión, rol y conteo visible de inspecciones.
 * Útil para diferenciar "sin datos" de un bloqueo por RLS/permisos.
 */
export async function diagnosticarInspecciones(): Promise<DiagnosticoInspecciones> {
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return { autenticado: false, rol: null, totalVisible: 0 };
  }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', authData.user.id)
    .maybeSingle();

  const { count } = await supabase
    .from('inspecciones')
    .select('id', { count: 'exact', head: true });

  return {
    autenticado: true,
    rol: (perfil as { rol?: string } | null)?.rol ?? null,
    totalVisible: count ?? 0,
  };
}

/**
 * Lista inspecciones ordenadas por fecha descendente, con datos del técnico.
 * @param filtroEstado Estado a filtrar; omitir para traer todas.
 */
export async function listarInspecciones(
  filtroEstado?: EstadoInspeccion,
): Promise<Inspeccion[]> {
  await obtenerUsuarioId();

  let query = supabase
    .from('inspecciones')
    .select(
      'id, tecnico_id, tipo, descripcion, estado, observacion, created_at',
    )
    .order('created_at', { ascending: false });

  if (filtroEstado) {
    query = query.eq('estado', filtroEstado);
  }

  const { data, error } = await query;

  if (error) throw new Error(mensajeError(error));

  const rows = (data ?? []) as InspeccionRow[];
  const tecnicos = await obtenerTecnicos(rows.map((row) => row.tecnico_id));

  return rows.map((row) => mapearInspeccion(row, tecnicos));
}

/** Obtiene una inspección por id con los datos del técnico. */
export async function obtenerInspeccion(id: string): Promise<Inspeccion> {
  const { data, error } = await supabase
    .from('inspecciones')
    .select(
      'id, tecnico_id, tipo, descripcion, estado, observacion, created_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(mensajeError(error));

  if (!data) {
    throw new Error('La inspección ya no existe o no tienes acceso a ella.');
  }

  const row = data as InspeccionRow;
  const tecnicos = await obtenerTecnicos([row.tecnico_id]);

  return mapearInspeccion(row, tecnicos);
}

/**
 * Crea un reporte para el supervisor autenticado con el conteo actual.
 * El conteo se calcula con las inspecciones visibles al momento de crear.
 */
export async function crearReporte(
  titulo: string,
  filtroEstado?: EstadoInspeccion,
): Promise<Reporte> {
  const tituloLimpio = titulo.trim();

  if (!tituloLimpio) {
    throw new Error('El título del reporte es obligatorio.');
  }

  const supervisorId = await obtenerUsuarioId();

  let countQuery = supabase
    .from('inspecciones')
    .select('id', { count: 'exact', head: true });

  if (filtroEstado) {
    countQuery = countQuery.eq('estado', filtroEstado);
  }

  const { count, error: countError } = await countQuery;

  if (countError) throw new Error(mensajeError(countError));

  const { data, error } = await supabase
    .from('reportes')
    .insert({
      supervisor_id: supervisorId,
      titulo: tituloLimpio,
      filtro_estado: filtroEstado ?? 'todas',
      total: count ?? 0,
    })
    .select('id, supervisor_id, titulo, filtro_estado, total, created_at')
    .single();

  if (error) throw new Error(mensajeError(error));

  return data as Reporte;
}

/** Lista reportes del supervisor autenticado, ordenados por fecha descendente. */
export async function listarReportes(): Promise<Reporte[]> {
  const supervisorId = await obtenerUsuarioId();

  const { data, error } = await supabase
    .from('reportes')
    .select('id, supervisor_id, titulo, filtro_estado, total, created_at')
    .eq('supervisor_id', supervisorId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(mensajeError(error));

  return (data ?? []) as Reporte[];
}

/**
 * Actualiza el estado de una inspección.
 * Al devolver, exige `observacion` no vacía (validada también en app).
 */
export async function actualizarInspeccion(
  id: string,
  decision: DecisionInspeccion,
  observacion?: string,
): Promise<void> {
  const update: {
    estado: DecisionInspeccion;
    observacion?: string;
  } = { estado: decision };

  if (decision === 'devuelta') {
    const observacionLimpia = observacion?.trim();

    if (!observacionLimpia) {
      throw new Error(
        'La observación es obligatoria para devolver una inspección.',
      );
    }

    update.observacion = observacionLimpia;
  }

  const { data, error } = await supabase
    .from('inspecciones')
    .update(update)
    .eq('id', id)
    .eq('estado', 'completada')
    .select('id')
    .maybeSingle();

  if (error) throw new Error(mensajeError(error));

  if (!data) {
    throw new Error('La inspección ya no existe o no puedes modificarla.');
  }
}

/**
 * Elimina físicamente una inspección devuelta tras confirmación en la UI.
 * La condición `estado=devuelta` actúa como salvaguarda adicional.
 */
export async function eliminarInspeccion(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('inspecciones')
    .delete()
    .eq('id', id)
    .eq('estado', 'devuelta')
    .select('id');

  if (error) throw new Error(mensajeError(error));

  if (!data || data.length === 0) {
    throw new Error('Solo puedes eliminar inspecciones en estado devuelta.');
  }
}
