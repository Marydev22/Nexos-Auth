import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import {
  ETIQUETAS_ROL,
  obtenerPerfil,
  type Perfil,
  type Rol,
} from '@/services/perfiles';

type UserMetadata = {
  first_name?: string;
  last_name?: string;
  role?: string;
};

function getMetadata(user: User | null): UserMetadata {
  return (user?.user_metadata ?? {}) as UserMetadata;
}

function getDisplayName(user: User | null, perfil: Perfil | null): string {
  if (perfil?.nombre?.trim()) return perfil.nombre.trim();
  const metadata = getMetadata(user);
  const name = [metadata.first_name, metadata.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  return name || user?.email || 'Usuario';
}

function getRole(user: User | null, perfil: Perfil | null): Rol {
  const candidates = [perfil?.rol, getMetadata(user).role];
  for (const value of candidates) {
    if (value === 'tecnico' || value === 'supervisor' || value === 'administrador') {
      return value;
    }
  }
  return 'supervisor';
}

function getProviderLabel(user: User | null): string {
  const provider = user?.app_metadata?.provider;
  return provider === 'google' ? 'Google' : 'Correo y contraseña';
}

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!active) return;

      setUser(data.user);

      if (data.user) {
        const perfilData = await obtenerPerfil(data.user.id);
        if (active) setPerfil(perfilData);
      }

      if (active) setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const role = getRole(user, perfil);
  const roleLabel = ETIQUETAS_ROL[role];
  const usesGoogle = user?.app_metadata?.provider === 'google';

  function handleRecoverPassword() {
    if (!user?.email || usesGoogle) return;

    router.push({
      pathname: '/(auth)/forgot-password',
      params: { email: user.email },
    });
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <LottieView
          source={require('../../../assets/lottie/loading.json')}
          autoPlay
          loop
          style={{ width: 72, height: 72 }}
        />
        <Text className="mt-3 text-sm font-medium text-neutral">
          Cargando tu perfil...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, gap: 16, padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-7">
          <View className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[#E6FDF3]" />
          <View className="absolute -left-8 top-20 h-20 w-20 rounded-full bg-[#E8F1FF]" />

          <View className="h-28 w-28 items-center justify-center rounded-full border-4 border-[#E6FDF3] bg-[#F8FAFC]">
            <LottieView
              source={require('../../../assets/lottie/user.json')}
              autoPlay
              loop
              style={{ width: 92, height: 92 }}
            />
          </View>

          <Text className="mt-4 text-center text-2xl font-bold text-tertiary">
            {getDisplayName(user, perfil)}
          </Text>

          <View className="mt-2 flex-row items-center gap-2 rounded-full bg-[#E6FDF3] px-3 py-1">
            <View className="h-2 w-2 rounded-full bg-primary" />
            <Text className="text-xs font-bold uppercase text-tertiary">
              {roleLabel}
            </Text>
          </View>

          <Text className="mt-3 text-center text-sm text-neutral">
            {user?.email ?? 'Sin correo disponible'}
          </Text>
        </View>

        <View className="rounded-3xl border border-slate-200 bg-white p-5">
          <Text className="text-xs font-bold uppercase tracking-wider text-neutral">
            Datos de la cuenta
          </Text>

          <View className="mt-4 gap-4">
            <View className="flex-row items-center justify-between gap-4">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-tertiary">Nombre</Text>
                <Text className="mt-0.5 text-sm text-neutral">
                  {getDisplayName(user, perfil)}
                </Text>
              </View>
            </View>

            <View className="h-px bg-slate-100" />

            <View className="flex-row items-center justify-between gap-4">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-tertiary">Rol</Text>
                <Text className="mt-0.5 text-sm text-neutral">{roleLabel}</Text>
              </View>
              <View className="rounded-full bg-[#E8F1FF] px-3 py-1">
                <Text className="text-[11px] font-bold uppercase text-secondary">
                  {roleLabel}
                </Text>
              </View>
            </View>

            <View className="h-px bg-slate-100" />

            <View>
              <Text className="text-sm font-semibold text-tertiary">
                Método de acceso
              </Text>
              <Text className="mt-0.5 text-sm text-neutral">
                {getProviderLabel(user)}
              </Text>
            </View>
          </View>
        </View>

        <View className="rounded-3xl border border-slate-200 bg-white p-5">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#E6FDF3]">
              <View className="h-6 w-6 items-center justify-end">
                <View className="absolute top-0 h-3.5 w-4 rounded-t-full border-2 border-primary" />
                <View className="h-3.5 w-5 rounded-md bg-primary" />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-tertiary">Seguridad</Text>
              <Text className="text-xs text-neutral">
                Mantén tu cuenta protegida
              </Text>
            </View>
          </View>

          {usesGoogle ? (
            <View className="mt-4 rounded-2xl bg-[#F1F5F9] p-4">
              <Text className="text-sm text-neutral">
                Tu cuenta inició sesión con Google. La contraseña se administra
                desde tu cuenta de Google.
              </Text>
            </View>
          ) : (
            <>
              <Text className="mt-4 text-sm leading-5 text-neutral">
                Te enviaremos un enlace seguro a tu correo para que puedas crear
                una nueva contraseña.
              </Text>

              <Pressable
                className="mt-4 min-h-12 flex-row items-center justify-center rounded-2xl bg-primary px-5 active:opacity-85"
                onPress={handleRecoverPassword}
                accessibilityRole="button"
                accessibilityLabel="Recuperar contraseña"
              >
                <Text className="text-base font-bold text-white">
                  Recuperar contraseña
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
