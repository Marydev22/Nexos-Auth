import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { NexosLogo } from '@/components/NexosLogo';
import { supabase } from '@/lib/supabase';
import { GoogleButton } from '../../components/GoogleButton';

function PasswordInput({
  label,
  placeholder,
  value,
  onChangeText,
  editable = true,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  editable?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordWrapper}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={!visible}
          autoComplete="password"
          textContentType="password"
          value={value}
          onChangeText={onChangeText}
          editable={editable}
        />
        <Pressable
          style={styles.eyeButton}
          onPress={() => setVisible((prev) => !prev)}
        >
          <Text style={styles.eyeText}>{visible ? 'Ocultar' : 'Mostrar'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    const value = email.trim();

    if (!value.includes('@')) {
      setError('Ingresa un correo válido.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: value,
      password,
    });
    setLoading(false);

    if (authError) {
      setError(
        authError.message === 'Email not confirmed'
          ? 'Confirma tu correo antes de iniciar sessión.'
          : 'Correo o contraseña incorrectos.',
      );
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.brand}>
            <NexosLogo size={120} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>Inicia sesión en Nexos para continuar</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Correo</Text>
              <TextInput
                style={styles.input}
                placeholder="nombre@empresa.com"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <PasswordInput
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                loading && styles.buttonDisabled,
                pressed && !loading && styles.buttonPressed,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Iniciar sesión</Text>
              )}
            </Pressable>

            <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotLink}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </Pressable>

            <View style={styles.separator}>
              <View style={styles.line} />
              <Text style={styles.separatorText}>o</Text>
              <View style={styles.line} />
            </View>

            <GoogleButton onError={setError} />

          </View>

          <Pressable onPress={() => router.push('/(auth)/register')} style={styles.footer}>
            <Text style={styles.footerText}>
              ¿No tienes cuenta? <Text style={styles.footerLink}> Crear cuenta</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  brand: { alignItems: 'center', marginBottom: 28, gap: 10 },
  appName: { fontSize: 18, fontWeight: '600', color: '#0F172A', letterSpacing: 0.3 },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#64748B' },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155' },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 14, default: 12 }),
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 64 },
  eyeButton: {
    position: 'absolute',
    right: 10,
    top: Platform.select({ ios: 14, default: 12 }),
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  eyeText: { color: '#2563EB', fontSize: 13, fontWeight: '600' },
  error: { color: '#DC2626', fontSize: 13 },
  button: {
    backgroundColor: '#00D166',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonPressed: { opacity: 0.88 },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  footer: { marginTop: 24, alignItems: 'center' },
  footerText: { fontSize: 14, color: '#64748B' },
  footerLink: { color: '#007BFF', fontWeight: '600' },
  forgotLink: { marginTop: 12, alignItems: 'center' },
  forgotText: { color: '#2563EB', fontSize: 14, fontWeight: '600' },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: { flex: 1, height: 1, backgroundColor: '#CBD5E1' },
  separatorText: { marginHorizontal: 12, color: '#64748B', fontSize: 13 },
});