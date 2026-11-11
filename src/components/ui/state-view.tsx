import { Pressable, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';

/** Props para la vista de estado (carga, vacío, error con acción). */
type Props = {
  /** Animación Lottie a mostrar. */
  animation?: 'loading' | 'user';
  /** Título principal. */
  title: string;
  /** Texto secundario opcional. */
  description?: string;
  /** Etiqueta del botón de acción opcional. */
  actionLabel?: string;
  /** Handler del botón de acción (requiere `actionLabel`). */
  onAction?: () => void;
};

/** Vista centrada para estados de carga, vacío o error recuperable. */
export function StateView({
  animation = 'user',
  title,
  description,
  actionLabel,
  onAction,
}: Props) {
  const source =
    animation === 'loading'
      ? require('@/assets/lottie/loading.json')
      : require('@/assets/lottie/user.json');

  return (
    <View className="flex-1 items-center justify-center px-8 py-10">
      <View className="h-32 w-32 items-center justify-center rounded-full bg-white">
        <LottieView
          source={source}
          autoPlay
          loop
          style={{ width: 112, height: 112 }}
        />
      </View>

      <Text className="mt-4 text-center text-base font-bold text-tertiary">
        {title}
      </Text>

      {description ? (
        <Text className="mt-1.5 text-center text-sm leading-5 text-neutral">
          {description}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <Pressable
          className="mt-5 min-h-11 items-center justify-center rounded-2xl bg-tertiary px-5 active:opacity-85"
          onPress={onAction}
          accessibilityRole="button"
        >
          <Text className="text-sm font-bold text-white">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
