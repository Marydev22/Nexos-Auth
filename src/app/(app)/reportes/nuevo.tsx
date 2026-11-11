import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { formatearFecha } from '@/lib/format';
import { crearReporte } from '@/services/inspecciones';
import {
  ETIQUETAS_ESTADO,
  type FiltroEstado,
  type Reporte,
} from '@/types/inspeccion';

const FILTROS: readonly FiltroEstado[] = [
  'todas',
  'completada',
  'validada',
  'devuelta',
];

export default function NuevoReporteScreen() {
  const [titulo, setTitulo] = useState('');
  const [filtro, setFiltro] = useState<FiltroEstado>('todas');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reporte, setReporte] = useState<Reporte | null>(null);

  const puedeGuardar = titulo.trim().length > 0 && !guardando;

  async function handleGuardar() {
    if (!titulo.trim()) {
      setError('El título del reporte es obligatorio.');
      return;
    }

    setError(null);
    setGuardando(true);

    try {
      const data = await crearReporte(
        titulo,
        filtro === 'todas' ? undefined : filtro,
      );
      setReporte(data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No pudimos crear el reporte.',
      );
    } finally {
      setGuardando(false);
    }
  }

  function reiniciar() {
    setReporte(null);
    setTitulo('');
    setFiltro('todas');
    setError(null);
  }

  if (reporte) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: 16, padding: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center rounded-3xl border border-slate-200 bg-white p-6">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-[#E6FDF3]">
              <Text className="text-4xl font-bold text-primary">✓</Text>
            </View>

            <Text className="mt-4 text-xl font-bold text-tertiary">
              Resumen generado
            </Text>
            <Text className="mt-1 text-center text-sm text-neutral">
              El reporte se guardó correctamente.
            </Text>

            <View className="mt-5 w-full rounded-2xl bg-[#F8FAFC] p-4">
              <Text className="text-[11px] font-bold uppercase text-neutral">
                Título
              </Text>
              <Text className="mt-0.5 text-base font-bold text-tertiary">
                {reporte.titulo}
              </Text>

              <View className="my-3 h-px bg-slate-200" />

              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-[11px] font-bold uppercase text-neutral">
                    Filtro
                  </Text>
                  <Text className="mt-0.5 text-sm font-semibold text-secondary">
                    {ETIQUETAS_ESTADO[reporte.filtro_estado]}
                  </Text>
                </View>

                <View className="items-end">
                  <Text className="text-[11px] font-bold uppercase text-neutral">
                    Total
                  </Text>
                  <Text className="text-3xl font-bold text-primary">
                    {reporte.total}
                  </Text>
                </View>
              </View>

              <View className="my-3 h-px bg-slate-200" />

              <Text className="text-[11px] font-bold uppercase text-neutral">
                Fecha
              </Text>
              <Text className="mt-0.5 text-sm font-semibold text-tertiary">
                {formatearFecha(reporte.created_at)}
              </Text>
            </View>
          </View>

          <Pressable
            className="min-h-12 items-center justify-center rounded-2xl bg-primary px-5 active:opacity-85"
            onPress={reiniciar}
            accessibilityRole="button"
          >
            <Text className="text-base font-bold text-white">
              Crear otro reporte
            </Text>
          </Pressable>

          <Pressable
            className="min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 active:opacity-80"
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <Text className="text-base font-bold text-neutral">
              Volver a reportes
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, gap: 16, padding: 20, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-3xl border border-slate-200 bg-white p-5">
            <Text className="text-lg font-bold text-tertiary">
              Nuevo reporte
            </Text>
            <Text className="mt-1 text-sm leading-5 text-neutral">
              Genera un resumen con el total de inspecciones que coincidan con
              el estado seleccionado. No se descarga ningún archivo.
            </Text>

            <Text className="mt-5 text-[13px] font-semibold text-slate-700">
              Título <Text className="text-[#DC2626]">*</Text>
            </Text>
            <TextInput
              className="mt-2 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3.5 text-base text-tertiary"
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Ej. Inspecciones de la semana"
              placeholderTextColor="#94A3B8"
              editable={!guardando}
              maxLength={120}
            />

            <Text className="mt-5 text-[13px] font-semibold text-slate-700">
              Filtrar por estado
            </Text>

            <View className="mt-2 flex-row flex-wrap gap-2">
              {FILTROS.map((opcion) => {
                const active = filtro === opcion;

                return (
                  <Pressable
                    key={opcion}
                    className={`rounded-full px-4 py-2 ${
                      active
                        ? 'bg-primary active:opacity-85'
                        : 'border border-slate-200 bg-white active:opacity-70'
                    }`}
                    onPress={() => setFiltro(opcion)}
                    disabled={guardando}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        active ? 'text-white' : 'text-neutral'
                      }`}
                    >
                      {ETIQUETAS_ESTADO[opcion]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="mt-5 rounded-2xl bg-[#E8F1FF] p-4">
              <Text className="text-xs leading-5 text-secondary">
                El total se calcula al guardar y queda registrado junto con la
                fecha de creación.
              </Text>
            </View>
          </View>

          {error ? (
            <View className="rounded-2xl bg-[#FEF2F2] p-4">
              <Text className="text-sm text-[#DC2626]">{error}</Text>
            </View>
          ) : null}

          <Pressable
            className={`min-h-12 flex-row items-center justify-center gap-2 rounded-2xl px-5 ${
              puedeGuardar ? 'bg-primary active:opacity-85' : 'bg-primary/40'
            }`}
            onPress={() => void handleGuardar()}
            disabled={!puedeGuardar}
            accessibilityRole="button"
          >
            {guardando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : null}
            <Text className="text-base font-bold text-white">
              {guardando ? 'Guardando...' : 'Guardar reporte'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
