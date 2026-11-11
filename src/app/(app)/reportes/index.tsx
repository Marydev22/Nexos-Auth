import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, type Href } from 'expo-router';

import { StateView } from '@/components/ui/state-view';
import { formatearFecha } from '@/lib/format';
import { listarReportes } from '@/services/inspecciones';
import { ETIQUETAS_ESTADO, type Reporte } from '@/types/inspeccion';

function ReporteCard({ reporte }: { reporte: Reporte }) {
  return (
    <View className="rounded-3xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-start justify-between gap-3">
        <Text
          className="flex-1 text-base font-bold text-tertiary"
          numberOfLines={2}
        >
          {reporte.titulo}
        </Text>
        <View className="rounded-full bg-[#E8F1FF] px-2.5 py-1">
          <Text className="text-[11px] font-bold text-secondary">
            {ETIQUETAS_ESTADO[reporte.filtro_estado]}
          </Text>
        </View>
      </View>

      <View className="mt-3 h-px bg-slate-100" />

      <View className="mt-3 flex-row items-end justify-between gap-3">
        <View>
          <Text className="text-[11px] font-bold uppercase text-neutral">
            Total
          </Text>
          <Text className="text-3xl font-bold text-tertiary">
            {reporte.total}
          </Text>
        </View>
        <Text className="text-[11px] font-medium text-neutral">
          {formatearFecha(reporte.created_at)}
        </Text>
      </View>
    </View>
  );
}

export default function ReportesScreen() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(
    async (modo: 'inicial' | 'refresh' = 'inicial') => {
      if (modo === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const data = await listarReportes();
        setReportes(data);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'No pudimos cargar los reportes.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      void cargar('inicial');
    }, [cargar]),
  );

  const mostrarError = Boolean(error) && reportes.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <View className="px-5 pb-4 pt-5">
        <Text className="text-2xl font-bold text-tertiary">Reportes</Text>
        <Text className="mt-0.5 text-sm text-neutral">
          Resúmenes generados a partir de tus filtros
        </Text>

        <Pressable
          className="mt-4 min-h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-primary px-5 active:opacity-85"
          onPress={() => router.push('/reportes/nuevo' as Href)}
          accessibilityRole="button"
        >
          <Text className="text-lg font-bold text-white">+</Text>
          <Text className="text-base font-bold text-white">Nuevo reporte</Text>
        </Pressable>
      </View>

      {loading ? (
        <StateView animation="loading" title="Cargando reportes" />
      ) : mostrarError ? (
        <StateView
          title="No pudimos cargar los reportes"
          description={error ?? undefined}
          actionLabel="Reintentar"
          onAction={() => void cargar('inicial')}
        />
      ) : (
        <FlatList
          data={reportes}
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
              title="Aún no tienes reportes"
              description="Crea tu primer resumen con el botón Nuevo reporte."
            />
          }
          renderItem={({ item }) => <ReporteCard reporte={item} />}
        />
      )}
    </SafeAreaView>
  );
}
