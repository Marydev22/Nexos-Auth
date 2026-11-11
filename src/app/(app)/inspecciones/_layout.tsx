import { Stack } from 'expo-router';

export default function InspeccionesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F8FAFC' },
        headerTintColor: '#0F172A',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[id]"
        getId={({ params }) =>
          Array.isArray(params?.id) ? params?.id[0] : params?.id
        }
        options={{
          title: 'Detalle de inspección',
          headerBackTitle: 'Volver',
        }}
      />
    </Stack>
  );
}
