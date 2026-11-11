import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';

import { NexosLogo } from '@/components/NexosLogo';
import { sendPasswordRecovery } from '@/lib/auth-password';

export default function ForgotPasswordScreen() {
  const { email: initialEmail } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(initialEmail ?? '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    const value = email.trim();
    if (!value.includes('@')) {
      setError('Ingresa un correo válido.');
      return;
    }

    setError(null);
    setLoading(true);
    const { error: resetError } = await sendPasswordRecovery(value);
    setLoading(false);

    if (resetError) {
      setError('No se pudo enviar el enlace. Inténtalo de nuevo.');
      return;
    }

    setSent(true);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 32 }}>
        <View style={{ alignItems: 'center', marginBottom: 36 }}>
          <NexosLogo size={120} />
        </View>

        <View style={{ gap: 16 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155' }}>
              Correo
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 12,
                backgroundColor: '#F8FAFC',
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 16,
                color: '#0F172A',
              }}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError(null);
                setSent(false);
              }}
              placeholder="nombre@empresa.com"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!loading}
              autoFocus={!email}
            />
          </View>

          {error ? (
            <View style={{ borderRadius: 12, backgroundColor: '#FEF2F2', padding: 14 }}>
              <Text style={{ fontSize: 13, color: '#DC2626' }}>{error}</Text>
            </View>
          ) : null}

          {sent ? (
            <View style={{ borderRadius: 12, backgroundColor: '#E6FDF3', padding: 14 }}>
              <Text style={{ fontSize: 13, lineHeight: 20, color: '#0F172A' }}>
                Revisa tu correo para continuar. Si no lo encuentras, revisa también la carpeta de spam.
              </Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => ({
              backgroundColor: '#00D166',
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 20,
              minHeight: 52,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: loading ? 0.7 : pressed ? 0.88 : 1,
              marginTop: 8,
            })}
            onPress={() => void handleSubmit()}
            disabled={loading}
            accessibilityRole="button"
          >
            <LottieView
              source={require('../../../assets/lottie/loading.json')}
              autoPlay
              loop
              style={{ width: 26, height: 26 }}
            />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
              {loading ? 'Enviando enlace...' : 'Enviar enlace de recuperación'}
            </Text>
          </Pressable>

          <Pressable
            style={{ marginTop: 12, alignItems: 'center', paddingVertical: 8 }}
            onPress={() => router.replace('/(auth)/login')}
            disabled={loading}
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#007BFF' }}>
              Volver a iniciar sesión
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
