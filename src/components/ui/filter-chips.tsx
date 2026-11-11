import { Pressable, ScrollView, Text } from 'react-native';

/** Opción seleccionable para un grupo de chips/filtros. */
export type ChipOption<T extends string> = {
  /** Valor estable usado para comparar selección y notificar cambios. */
  value: T;
  /** Texto visible del chip. */
  label: string;
};

/** Props del componente `FilterChips`. */
type Props<T extends string> = {
  /** Opciones a renderizar, en orden. */
  options: readonly ChipOption<T>[];
  /** Valor actualmente seleccionado. */
  value: T;
  /** Callback al seleccionar un chip. */
  onChange: (value: T) => void;
};

/** Lista horizontal de chips de selección única. */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-5"
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <Pressable
            key={option.value}
            className={`rounded-full px-4 py-2 ${
              active
                ? 'bg-primary active:opacity-85'
                : 'border border-slate-200 bg-white active:opacity-70'
            }`}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              className={`text-sm font-semibold ${
                active ? 'text-white' : 'text-neutral'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
