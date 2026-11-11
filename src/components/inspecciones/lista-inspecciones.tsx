import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { FilterChips, type ChipOption } from '@/components/ui/filter-chips';
import { StateView } from '@/components/ui/state-view';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatearFecha } from '@/lib/format';
import {
  diagnosticarInspecciones,
  listarInspecciones,
  type DiagnosticoInspecciones,
} from '@/services/inspecciones';
import {
  ETIQUETAS_ESTADO,
  type FiltroEstado,
  type Inspeccion,
} from '@/types/inspeccion';

const FILTROS: readonly ChipOption<FiltroEstado>[] = (
  ['todas', 'completada', 'validada', 'devuelta'] as const
).map((value) => ({ value, label: ETIQUETAS_ESTADO[value] }));

function InspeccionCard({
  inspeccion,
  onPress,
}: {
  inspeccion: Inspeccion;
  onPress: () => void;
}) {
  const tecnico = inspeccion.tecnico?.nombre ?? 'Técnico no disponible';
  const inicial = tecnico.charAt(0).toUpperCase();

  return (
    <Pressable
      className="rounded-3xl border border-slate-200 bg-white p-4 active:opacity-80"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalle de ${inspeccion.tipo}`}
    >
      <View className="flex-row items-start justify-between gap-3">
        <Text
          className="flex-1 text-base font-bold text-tertiary"
          numberOfLines={1}
        >
          {inspeccion.tipo}
        </Text>
        <StatusBadge estado={inspeccion.estado} />
      </View>

      <Text
        className="mt-1.5 text-sm leading-5 text-neutral"
        numberOfLines={2}
      >
        {inspeccion.descripcion || 'Sin descripción'}
      </Text>

      <View className="mt-3 h-px bg-slate-100" />

      <View className="mt-3 flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-2">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-[#E6FDF3]">
            <Text className="text-[11px] font-bold text-tertiary">
              {inicial}
            </Text>
          </View>
          <Text
            className="flex-1 text-xs font-semibold text-tertiary"
            numberOfLines={1}
          >
            {tecnico}
          </Text>
        </View>
        <Text className="text-[11px] font-medium text-neutral">
          {formatearFecha(inspeccion.created_at)}
        </Text>
      </View>
    </Pressable>
  );
}

function descripcionVacio(
  diagnostico: DiagnosticoInspecciones | null,
  filtro: FiltroEstado,
): string {
  if (!diagnostico) return 'Prueba seleccionando otro filtro.';

  if (!diagnostico.autenticado) {
    return 'Tu sesión no está activa. Vuelve a iniciar sesión.';
  }

  if (diagnostico.totalVisible === 0) {
    return `La base de datos no devolvió inspecciones para tu usuario (rol: ${
      diagnostico.rol ?? 'sin rol'
    }). Revisa las políticas RLS de la tabla inspecciones.`;
  }

  return filtro === 'todas'
    ? 'Aún no hay inspecciones registradas.'
    : 'Prueba seleccionando otro filtro.';
}

export function ListaInspecciones() {
  const [filtro, setFiltro] = useState<FiltroEstado>('todas');
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnostico, setDiagnostico] =
    useState<DiagnosticoInspecciones | null>(null);
  const solicitudRef = useRef(0);
  const navegandoRef = useRef(false);

  const cargar = useCallback(
    async (modo: 'inicial' | 'refresh' = 'inicial') => {
      const solicitud = ++solicitudRef.current;

      if (modo === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const data = await listarInspecciones(
          filtro === 'todas' ? undefined : filtro,
        );
        if (solicitud !== solicitudRef.current) return;
        setInspecciones(data);

        if (data.length === 0) {
          try {
            const info = await diagnosticarInspecciones();
            if (solicitud === solicitudRef.current) setDiagnostico(info);
          } catch {
            if (solicitud === solicitudRef.current) setDiagnostico(null);
          }
        } else {
          setDiagnostico(null);
        }
      } catch (caught) {
        if (solicitud !== solicitudRef.current) return;
        setError(
          caught instanceof Error
            ? caught.message
            : 'No pudimos cargar las inspecciones.',
        );
      } finally {
        if (solicitud === solicitudRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [filtro],
  );

  useFocusEffect(
    useCallback(() => {
      navegandoRef.current = false;
      void cargar('inicial');
    }, [cargar]),
  );

  function abrirDetalle(id: string) {
    if (navegandoRef.current) return;
    navegandoRef.current = true;
    router.push(`/(app)/inspecciones/${id}` as any);
  }

  const mostrarError = Boolean(error) && inspecciones.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <View className="flex-row items-start justify-between gap-3 px-5 pb-4 pt-5">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-tertiary">
            Inspecciones
          </Text>
          <Text className="mt-0.5 text-sm text-neutral">
            Revisa y valida el trabajo de tu equipo
          </Text>
        </View>

        <View className="min-w-11 items-center justify-center rounded-2xl bg-[#E6FDF3] px-3 py-2">
          <Text className="text-lg font-bold text-primary">
            {inspecciones.length}
          </Text>
          <Text className="text-[10px] font-semibold uppercase text-neutral">
            visibles
          </Text>
        </View>
      </View>

      <View className="pb-3">
        <FilterChips options={FILTROS} value={filtro} onChange={setFiltro} />
      </View>

      {loading ? (
        <StateView animation="loading" title="Cargando inspecciones" />
      ) : mostrarError ? (
        <StateView
          title="No pudimos cargar las inspecciones"
          description={error ?? undefined}
          actionLabel="Reintentar"
          onAction={() => void cargar('inicial')}
        />
      ) : (
        <FlatList
          data={inspecciones}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ flexGrow: 1, gap: 12, paddingHorizontal: 20, paddingBottom: 32, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void cargar('refresh')}
              tintColor="#00D166"
              colors={['#00D166']}
            />
          }
          ListHeaderComponent={
            error ? (
              <View className="rounded-2xl bg-[#FEF2F2] p-3">
                <Text className="text-xs text-[#DC2626]">{error}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <StateView
              title="No hay inspecciones con este estado"
              description={descripcionVacio(diagnostico, filtro)}
            />
          }
          renderItem={({ item }) => (
            <InspeccionCard
              inspeccion={item}
              onPress={() => abrirDetalle(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
