import { Stack } from 'expo-router';

export default function ReportesLayout() {
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
      <Stack.Screen name="nuevo" options={{ title: 'Nuevo reporte' }} />
    </Stack>
  );
}
