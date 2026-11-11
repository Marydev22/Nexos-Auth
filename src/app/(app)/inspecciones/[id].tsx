import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { StateView } from '@/components/ui/state-view';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatearFecha } from '@/lib/format';
import {
  actualizarInspeccion,
  eliminarInspeccion,
  obtenerInspeccion,
} from '@/services/inspecciones';
import type { Inspeccion } from '@/types/inspeccion';

type Accion = 'validar' | 'devolver' | 'eliminar' | null;

function primeraCadena(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function DetalleInspeccionScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = primeraCadena(params.id);

  const [inspeccion, setInspeccion] = useState<Inspeccion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accion, setAccion] = useState<Accion>(null);
  const [accionError, setAccionError] = useState<string | null>(null);
  const [mostrarDevolver, setMostrarDevolver] = useState(false);
  const [observacion, setObservacion] = useState('');

  const cargar = useCallback(async (idInspeccion: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await obtenerInspeccion(idInspeccion);
      setInspeccion(data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No pudimos cargar la inspección.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) {
      // Si el id aún no está disponible en el primer tick de montaje de Expo Router, no marcamos error de inmediato
      return;
    }
    void cargar(id);
  }, [id, cargar]);

  function volver() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/inspecciones');
    }
  }

  async function handleValidar() {
    if (!inspeccion || accion) return;

    setAccionError(null);
    setAccion('validar');

    try {
      await actualizarInspeccion(inspeccion.id, 'validada');
      volver();
    } catch (caught) {
      setAccionError(
        caught instanceof Error
          ? caught.message
          : 'No pudimos validar la inspección.',
      );
    } finally {
      setAccion(null);
    }
  }

  async function handleDevolver() {
    if (!inspeccion || accion) return;

    if (!observacion.trim()) {
      setAccionError('La observación es obligatoria para devolver una inspección.');
      return;
    }

    setAccionError(null);
    setAccion('devolver');

    try {
      await actualizarInspeccion(inspeccion.id, 'devuelta', observacion);
      volver();
    } catch (caught) {
      setAccionError(
        caught instanceof Error
          ? caught.message
          : 'No pudimos devolver la inspección.',
      );
    } finally {
      setAccion(null);
    }
  }

  function confirmarEliminacion() {
    if (!inspeccion || accion) return;

    Alert.alert(
      'Eliminar inspección',
      'Esta acción es definitiva y no se puede deshacer. ¿Deseas eliminar esta inspección?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => void handleEliminar(),
        },
      ],
    );
  }

  async function handleEliminar() {
    if (!inspeccion) return;

    setAccionError(null);
    setAccion('eliminar');

    try {
      await eliminarInspeccion(inspeccion.id);
      volver();
    } catch (caught) {
      setAccionError(
        caught instanceof Error
          ? caught.message
          : 'No pudimos eliminar la inspección.',
      );
    } finally {
      setAccion(null);
    }
  }

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#F8FAFC' }}
        edges={['bottom', 'left', 'right']}
      >
        <StateView animation="loading" title="Cargando inspección" />
      </SafeAreaView>
    );
  }

  if (error || !inspeccion) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: '#F8FAFC' }}
        edges={['bottom', 'left', 'right']}
      >
        <StateView
          title="No pudimos cargar la inspección"
          description={error ?? undefined}
          actionLabel="Reintentar"
          onAction={() => id && void cargar(id)}
        />
      </SafeAreaView>
    );
  }

  const estado = inspeccion.estado;
  const ocupado = accion !== null;
  const puedeConfirmarDevolucion =
    observacion.trim().length > 0 && !ocupado;
  const tecnico = inspeccion.tecnico?.nombre ?? 'Técnico no disponible';

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      edges={['bottom', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, gap: 16, padding: 20, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-3xl border border-slate-200 bg-white p-5">
            <View className="flex-row items-start justify-between gap-3">
              <Text className="flex-1 text-xl font-bold text-tertiary">
                {inspeccion.tipo}
              </Text>
              <StatusBadge estado={estado} />
            </View>

            <Text className="mt-2 text-sm leading-6 text-neutral">
              {inspeccion.descripcion || 'Sin descripción'}
            </Text>

            <View className="my-4 h-px bg-slate-100" />

            <View className="gap-3">
              <View className="flex-row items-center justify-between gap-3">
                <Text className="text-xs font-semibold uppercase text-neutral">
                  Técnico
                </Text>
                <Text
                  className="flex-1 text-right text-sm font-semibold text-tertiary"
                  numberOfLines={1}
                >
                  {tecnico}
                </Text>
              </View>

              <View className="flex-row items-center justify-between gap-3">
                <Text className="text-xs font-semibold uppercase text-neutral">
                  Fecha
                </Text>
                <Text className="text-right text-sm font-semibold text-tertiary">
                  {formatearFecha(inspeccion.created_at)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between gap-3">
                <Text className="text-xs font-semibold uppercase text-neutral">
                  Estado
                </Text>
                <StatusBadge estado={estado} />
              </View>
            </View>
          </View>

          {estado === 'devuelta' && inspeccion.observacion ? (
            <View className="rounded-3xl border-l-4 border-secondary bg-[#E8F1FF] p-5">
              <Text className="text-xs font-bold uppercase text-secondary">
                Observación
              </Text>
              <Text className="mt-2 text-sm leading-6 text-tertiary">
                {inspeccion.observacion}
              </Text>
            </View>
          ) : null}

          {estado === 'validada' ? (
            <View className="flex-row items-center gap-3 rounded-3xl bg-[#E6FDF3] p-5">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
                <Text className="text-lg font-bold text-primary">✓</Text>
              </View>
              <Text className="flex-1 text-sm font-medium text-tertiary">
                Esta inspección ya fue validada. No requiere más acciones.
              </Text>
            </View>
          ) : null}

          {estado === 'completada' && !mostrarDevolver ? (
            <View className="gap-3">
              <Text className="text-xs font-bold uppercase text-neutral">
                Acciones
              </Text>

              <Pressable
                className={`min-h-12 flex-row items-center justify-center gap-2 rounded-2xl px-5 ${
                  ocupado ? 'bg-primary/60' : 'bg-primary active:opacity-85'
                }`}
                onPress={() => void handleValidar()}
                disabled={ocupado}
                accessibilityRole="button"
              >
                {accion === 'validar' ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : null}
                <Text className="text-base font-bold text-white">Validar</Text>
              </Pressable>

              <Pressable
                className="min-h-12 items-center justify-center rounded-2xl border border-secondary bg-white px-5 active:opacity-80"
                onPress={() => {
                  setAccionError(null);
                  setMostrarDevolver(true);
                }}
                disabled={ocupado}
                accessibilityRole="button"
              >
                <Text className="text-base font-bold text-secondary">
                  Devolver
                </Text>
              </Pressable>
            </View>
          ) : null}

          {estado === 'completada' && mostrarDevolver ? (
            <View className="rounded-3xl border border-slate-200 bg-white p-5">
              <Text className="text-base font-bold text-tertiary">
                Devolver inspección
              </Text>
              <Text className="mt-1 text-sm text-neutral">
                Explica al técnico qué debe corregir.
              </Text>

              <Text className="mt-4 text-[13px] font-semibold text-slate-700">
                Observación <Text className="text-[#DC2626]">*</Text>
              </Text>
              <TextInput
                className="mt-2 min-h-28 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-base text-tertiary"
                value={observacion}
                onChangeText={setObservacion}
                placeholder="Escribe el motivo de la devolución..."
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
                editable={!ocupado}
                maxLength={500}
              />

              <View className="mt-4 flex-row gap-3">
                <Pressable
                  className="min-h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 active:opacity-80"
                  onPress={() => {
                    setMostrarDevolver(false);
                    setObservacion('');
                    setAccionError(null);
                  }}
                  disabled={ocupado}
                  accessibilityRole="button"
                >
                  <Text className="text-sm font-bold text-neutral">
                    Cancelar
                  </Text>
                </Pressable>

                <Pressable
                  className={`min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl px-4 ${
                    puedeConfirmarDevolucion
                      ? 'bg-secondary active:opacity-85'
                      : 'bg-secondary/40'
                  }`}
                  onPress={() => void handleDevolver()}
                  disabled={!puedeConfirmarDevolucion}
                  accessibilityRole="button"
                >
                  {accion === 'devolver' ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : null}
                  <Text className="text-sm font-bold text-white">Confirmar</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {accionError ? (
            <View className="rounded-2xl bg-[#FEF2F2] p-4">
              <Text className="text-sm text-[#DC2626]">{accionError}</Text>
            </View>
          ) : null}

          {estado === 'devuelta' ? (
            <View className="rounded-3xl border border-[#FEE2E2] bg-white p-5">
              <Text className="text-base font-bold text-tertiary">
                Zona de riesgo
              </Text>
              <Text className="mt-1 text-sm text-neutral">
                Eliminar esta inspección es una acción definitiva.
              </Text>

              <Pressable
                className={`mt-4 min-h-12 flex-row items-center justify-center gap-2 rounded-2xl px-5 ${
                  ocupado ? 'bg-[#DC2626]/60' : 'bg-[#DC2626] active:opacity-85'
                }`}
                onPress={confirmarEliminacion}
                disabled={ocupado}
                accessibilityRole="button"
              >
                {accion === 'eliminar' ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : null}
                <Text className="text-base font-bold text-white">
                  Eliminar inspección
                </Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
