import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { router } from 'expo-router';
import { signInWithGoogle } from '@/lib/auth-google';

type Props = { onError: (message: string) => void };

export function GoogleButton({ onError }: Props) {
  const [loading, setLoading] = useState(false);

  async function handlePress() {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.cancelled) {
        router.replace('/');
      }
    } catch {
      onError('No se pudo iniciar sessión con Google. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={loading}
    >
      <View style={styles.icon}>
        {loading ? (
          <LottieView
            source={require('../../assets/lottie/loading.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
        ) : (
          <LottieView
            source={require('../../assets/lottie/google.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
        )}
      </View>

      <Text style={styles.text}>
        {loading ? 'Conectando con Google…' : 'Continuar con Google'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  buttonDisabled: { opacity: 0.55 },
  icon: { marginRight: 14 },
  lottie: { width: 32, height: 32 },
  text: { color: '#DC2626', fontSize: 15, fontWeight: '600' },
});