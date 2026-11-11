import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#0F172A',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="login"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="register"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="reset-password"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}