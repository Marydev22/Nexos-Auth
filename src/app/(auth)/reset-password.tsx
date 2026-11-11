import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import LottieView from 'lottie-react-native';

import { NexosLogo } from '@/components/NexosLogo';
import { supabase } from '@/lib/supabase';
import {
  establishPasswordRecoverySession,
  type RecoveryCallback,
} from '@/lib/auth-password';

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseRecoveryUrl(url: string | null): RecoveryCallback {
  if (!url) return {};
  const [beforeHash, hashPart = ''] = url.split('#');
  const queryPart = beforeHash.includes('?') ? beforeHash.split('?')[1] : '';
  const query = new URLSearchParams(queryPart);
  const hash = new URLSearchParams(hashPart);
  const pick = (key: string) => query.get(key) ?? hash.get(key) ?? undefined;

  return {
    code: pick('code'),
    tokenHash: pick('token_hash'),
    accessToken: pick('access_token'),
    refreshToken: pick('refresh_token'),
    error: pick('error_description') ?? pick('error'),
  };
}

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  editable,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  editable: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="gap-2">
      <Text className="text-[13px] font-semibold text-slate-700">{label}</Text>
      <View className="relative">
        <TextInput
          className="rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3.5 pr-20 text-base text-tertiary"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          editable={editable}
        />
        <Pressable
          className="absolute bottom-0 right-2 top-0 justify-center px-3 active:opacity-70"
          onPress={() => setVisible((prev) => !prev)}
          accessibilityRole="button"
        >
          <Text className="text-[13px] font-bold text-secondary">
            {visible ? 'Ocultar' : 'Mostrar'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{
    code?: string | string[];
    token_hash?: string | string[];
    access_token?: string | string[];
    refresh_token?: string | string[];
    error_description?: string | string[];
  }>();
  const receivedUrl = Linking.useURL();
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const [initialUrlLoaded, setInitialUrlLoaded] = useState(false);
  const routeCode = firstParam(params.code);
  const routeTokenHash = firstParam(params.token_hash);
  const routeAccessToken = firstParam(params.access_token);
  const routeRefreshToken = firstParam(params.refresh_token);
  const routeError = firstParam(params.error_description);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    void Linking.getInitialURL()
      .then((url) => {
        if (active) {
          if (url) setInitialUrl(url);
          setInitialUrlLoaded(true);
        }
      })
      .catch(() => {
        // Si la lectura de la URL falla, desbloqueamos la espera para que la
        // pantalla muestre el estado "Enlace no válido" en vez de cargar.
        if (active) setInitialUrlLoaded(true);
      });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (active) setInitialUrl(url);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const urlParams = parseRecoveryUrl(receivedUrl ?? initialUrl);
    const callback: RecoveryCallback = {
      code: routeCode ?? urlParams.code,
      tokenHash: routeTokenHash ?? urlParams.tokenHash,
      accessToken: routeAccessToken ?? urlParams.accessToken,
      refreshToken: routeRefreshToken ?? urlParams.refreshToken,
      error: routeError ?? urlParams.error,
    };

    // Red de seguridad: si la validación del enlace nunca termina (red
    // inestable, verificador ausente, enlace abierto en otro dispositivo),
    // forzamos el estado "Enlace no válido" en vez de cargar para siempre.
    const timeout = setTimeout(() => {
      if (active) {
        setError('No pudimos validar el enlace. Solicita uno nuevo desde tu correo.');
        setRecoveryReady(false);
        setLoading(false);
      }
    }, 10000);

    if (!callback.code && !callback.tokenHash &&
      !(callback.accessToken && callback.refreshToken) &&
      !callback.error && !receivedUrl && !initialUrl && !initialUrlLoaded) {
      return () => {
        active = false;
        clearTimeout(timeout);
      };
    }

    if (
      !callback.code &&
      !callback.tokenHash &&
      !(callback.accessToken && callback.refreshToken) &&
      !callback.error
    ) {
      setError('El enlace de recuperación no es válido o ya expiró.');
      setRecoveryReady(false);
      setLoading(false);
      clearTimeout(timeout);
      return () => {
        active = false;
      };
    }

    void establishPasswordRecoverySession(callback)
      .then(({ error: sessionError }) => {
        if (!active) return;
        clearTimeout(timeout);
        setError(
          sessionError ? 'El enlace de recuperación no es válido o ya expiró.' : null,
        );
        setRecoveryReady(!sessionError);
        setLoading(false);
      })
      .catch(() => {
        // Cualquier rechazo inesperado termina en el estado "Enlace no válido"
        // y nunca en pantalla vacía.
        if (!active) return;
        clearTimeout(timeout);
        setError('El enlace de recuperación no es válido o ya expiró.');
        setRecoveryReady(false);
        setLoading(false);
      });

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [
    initialUrl,
    initialUrlLoaded,
    receivedUrl,
    routeCode,
    routeTokenHash,
    routeAccessToken,
    routeRefreshToken,
    routeError,
  ]);

  const isEmpty = password.length === 0 || confirm.length === 0;
  const passwordsMatch = password === confirm;
  const isLongEnough = password.length >= 8;
  const canSubmit =
    !saving && !success && !isEmpty && passwordsMatch && isLongEnough;

  async function handleSave() {
    setError(null);

    if (!isLongEnough) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (updateError) {
      setError('No se pudo actualizar la contraseña. Inténtalo de nuevo.');
      return;
    }

    setSuccess(true);
    setPassword('');
    setConfirm('');
    setTimeout(() => router.replace('/'), 1800);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-3xl border border-slate-200 bg-white p-6">
            <View className="items-center">
              <NexosLogo size={96} />
            </View>

          {loading ? (
            <View className="items-center py-10">
              <LottieView
                source={require('../../../assets/lottie/loading.json')}
                autoPlay
                loop
                style={{ width: 96, height: 96 }}
              />
              <Text className="mt-4 text-sm font-medium text-neutral">
                Validando enlace de recuperación...
              </Text>
            </View>
          ) : success ? (
            <View className="items-center py-10">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-[#E6FDF3]">
                <Text className="text-4xl font-bold text-primary">✓</Text>
              </View>
              <Text className="mt-5 text-center text-2xl font-bold text-tertiary">
                Contraseña actualizada
              </Text>
              <Text className="mt-2 text-center text-sm text-neutral">
                Ya puedes usar tu nueva contraseña. Te llevaremos al inicio...
              </Text>
            </View>
          ) : !recoveryReady ? (
            <View className="mt-6 rounded-3xl border border-[#FEE2E2] bg-[#FEF2F2] p-6">
              <Text className="text-lg font-bold text-tertiary">
                Enlace no válido
              </Text>
              <Text className="mt-2 text-sm leading-5 text-neutral">
                {error ??
                  'El enlace de recuperación expiró o ya fue utilizado. Solicita uno nuevo desde tu correo.'}
              </Text>
              <Pressable
                className="mt-5 min-h-12 items-center justify-center rounded-2xl bg-tertiary px-5 active:opacity-85"
                onPress={() => router.replace('/(auth)/forgot-password')}
                accessibilityRole="button"
              >
                <Text className="text-base font-bold text-white">
                  Solicitar un nuevo enlace
                </Text>
              </Pressable>
              <Pressable
                className="mt-3 min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 active:opacity-80"
                onPress={() => router.replace('/(auth)/login')}
                accessibilityRole="button"
              >
                <Text className="text-base font-bold text-neutral">
                  Volver a iniciar sesión
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View className="mt-6">
                <Text className="text-3xl font-bold text-tertiary">
                  Nueva contraseña
                </Text>
                <Text className="mt-2 text-[15px] leading-6 text-neutral">
                  Crea una contraseña segura para proteger tu cuenta.
                </Text>
              </View>

              <View className="mt-7 gap-5">
                <PasswordField
                  label="Nueva contraseña"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setError(null);
                  }}
                  placeholder="Mínimo 8 caracteres"
                  editable={!saving && !success}
                />

                <PasswordField
                  label="Confirmar contraseña"
                  value={confirm}
                  onChangeText={(value) => {
                    setConfirm(value);
                    setError(null);
                  }}
                  placeholder="Repite tu contraseña"
                  editable={!saving && !success}
                />
              </View>

              <View className="mt-5 gap-2 rounded-2xl bg-[#F8FAFC] p-4">
                <Text
                  className={`text-xs font-semibold ${
                    isLongEnough ? 'text-primary' : 'text-neutral'
                  }`}
                >
                  {isLongEnough ? '✓' : '•'} Al menos 8 caracteres
                </Text>
                <Text
                  className={`text-xs font-semibold ${
                    confirm.length > 0 && passwordsMatch
                      ? 'text-primary'
                      : 'text-neutral'
                  }`}
                >
                  {confirm.length > 0 && passwordsMatch ? '✓' : '•'} Las
                  contraseñas coinciden
                </Text>
              </View>

              {error ? (
                <View className="mt-4 rounded-2xl bg-[#FEF2F2] p-4">
                  <Text className="text-sm text-[#DC2626]">{error}</Text>
                </View>
              ) : null}

              <Pressable
                className={`mt-6 min-h-12 flex-row items-center justify-center gap-2 rounded-2xl px-5 ${
                  canSubmit ? 'bg-primary active:opacity-85' : 'bg-primary/40'
                }`}
                onPress={() => void handleSave()}
                disabled={!canSubmit}
                accessibilityRole="button"
              >
                {saving ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" />
                    <Text className="text-base font-bold text-white">
                      Guardando...
                    </Text>
                  </>
                ) : (
                  <Text className="text-base font-bold text-white">
                    Guardar contraseña
                  </Text>
                )}
              </Pressable>
            </>
          )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
