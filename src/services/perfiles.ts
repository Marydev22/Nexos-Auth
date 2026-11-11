import { supabase } from '@/lib/supabase';

/** Roles admitidos por la app para perfiles. */
export type Rol = 'tecnico' | 'supervisor' | 'administrador';

/** Perfil de usuario almacenado en la tabla `perfiles`. */
export type Perfil = {
  /** Identificador del usuario (coincide con `auth.users.id`). */
  id: string;
  /** Nombre visible del usuario. */
  nombre: string;
  /** Rol funcional dentro de la app. */
  rol: Rol;
};

/** Etiquetas en español para mostrar roles en la UI. */
export const ETIQUETAS_ROL: Record<Rol, string> = {
  tecnico: 'Técnico',
  supervisor: 'Supervisor',
  administrador: 'Administrador',
};

/** Obtiene el perfil por id; devuelve `null` si no existe o no hay acceso. */
export async function obtenerPerfil(id: string): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, rol')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return data as Perfil;
}
