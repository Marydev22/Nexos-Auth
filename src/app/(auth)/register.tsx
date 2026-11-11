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
import { getAuthRedirectUri } from '@/lib/auth-google';

const redirectTo = getAuthRedirectUri();

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
          autoComplete="new-password"
          textContentType="newPassword"
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

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError(null);
    setInfo(null);
    // RF-02 y RF-05: validación local antes de llamar a Supabase
    const value = email.trim();
    const first = firstName.trim();
    const last = lastName.trim();

    if (!first || !last) {
      setError('Ingresa tu nombre y apellido.');
      return;
    }
    if (!value.includes('@')) {
      setError('Ingresa un correo válido.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email: value,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          first_name: first,
          last_name: last,
          role: 'supervisor',
        },
      },
    });
    setLoading(false);

    if (authError) {
      const msg = authError.message.toLowerCase();

      if (authError.status === 429 || msg.includes('rate limit')) {
        setError('Se alcanzó el límite de correos por ahora. Intenta de nuevo en unos minutos.');
      } else if (msg.includes('already registered')) {
        setError('Ya existe una cuenta con ese correo.');
      } else {
        setError('No se pudo crear la cuenta. Intenta de nuevo.');
      }
      return;
    }

    // Con confirmación activa, no hay sesión todavía: el usuario debe confirmar su correo.
    if (!data.session) {
      setInfo('Te enviamos un correo de confirmación. Ábrelo para activar tu cuenta.');
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
            <NexosLogo size={100} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Regístrate para comenzar</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Juan"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  autoComplete="given-name"
                  textContentType="name"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.label}>Apellido</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Pérez"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  autoComplete="family-name"
                  textContentType="name"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

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
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChangeText={setPassword}
            />

            <PasswordInput
              label="Confirmar contraseña"
              placeholder="Repite tu contraseña"
              value={confirm}
              onChangeText={setConfirm}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {info ? <Text style={styles.info}>{info}</Text> : null}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                loading && styles.buttonDisabled,
                pressed && !loading && styles.buttonPressed,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Crear cuenta</Text>
              )}
            </Pressable>
          </View>

          <Pressable onPress={() => router.back()} style={styles.footer}>
            <Text style={styles.footerText}>
              ¿Ya tienes cuenta? <Text style={styles.footerLink}>Iniciar sesión</Text>
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
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#64748B' },
  form: { gap: 16 },
  row: { flexDirection: 'row', gap: 12 },
  field: { gap: 6 },
  halfField: { flex: 1 },
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
  info: { color: '#007BFF', fontSize: 13 },
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
});
