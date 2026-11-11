import { Text, View } from 'react-native';

import { ETIQUETAS_ESTADO, type EstadoInspeccion } from '@/types/inspeccion';

const ESTILOS: Record<
  EstadoInspeccion,
  { contenedor: string; texto: string; punto: string }
> = {
  completada: {
    contenedor: 'bg-[#F1F5F9]',
    texto: 'text-neutral',
    punto: 'bg-neutral',
  },
  validada: {
    contenedor: 'bg-[#E6FDF3]',
    texto: 'text-primary',
    punto: 'bg-primary',
  },
  devuelta: {
    contenedor: 'bg-[#E8F1FF]',
    texto: 'text-secondary',
    punto: 'bg-secondary',
  },
};

/** Badge visual del estado de una inspección. */
export function StatusBadge({ estado }: { estado: EstadoInspeccion }) {
  const estilos = ESTILOS[estado];

  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1 ${estilos.contenedor}`}
    >
      <View className={`h-1.5 w-1.5 rounded-full ${estilos.punto}`} />
      <Text className={`text-[11px] font-bold ${estilos.texto}`}>
        {ETIQUETAS_ESTADO[estado]}
      </Text>
    </View>
  );
}
