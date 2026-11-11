import type { Session } from "@supabase/supabase-js";
import type { Href } from "expo-router";
import {
  DefaultTheme, Slot, ThemeProvider, useRootNavigationState,
  useRouter,
  useSegments
} from "expo-router";
import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, LogBox, View } from "react-native";
import "../global.css";

import { supabase } from "@/lib/supabase";

LogBox.ignoreLogs([
  "WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256.",
]);

SplashScreen.preventAutoHideAsync();

function esUrlRecuperacion(url: string): boolean {
  return url.includes('reset-password') || url.includes('type=recovery');
}

function obtenerParametrosRecuperacion(url: string): Record<string, string> {
  const [beforeHash, hashPart = ''] = url.split('#');
  const queryPart = beforeHash.includes('?')
    ? beforeHash.slice(beforeHash.indexOf('?') + 1)
    : '';
  const query = new URLSearchParams(queryPart);
  const hash = new URLSearchParams(hashPart);
  const params: Record<string, string> = {};

  for (const key of [
    'code',
    'token_hash',
    'access_token',
    'refresh_token',
    'error',
    'error_description',
  ]) {
    const value = query.get(key) ?? hash.get(key);
    if (value) params[key] = value;
  }

  return params;
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [recoveryUrl, setRecoveryUrl] = useState<string | null>(null);
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  // 1.1 Detectar enlaces de recuperación antes de que el router decida la ruta
  useEffect(() => {
    let mounted = true;

    void Linking.getInitialURL().then((url) => {
      if (mounted && url && esUrlRecuperacion(url)) {
        setRecoveryUrl(url);
      }
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (esUrlRecuperacion(url)) {
        setRecoveryUrl(url);
        // Si la app ya está abierta y en segundo plano, forzar la navegación directa a reset-password
        router.replace({
          pathname: "/(auth)/reset-password",
          params: obtenerParametrosRecuperacion(url),
        } as Href);
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [router]);

  // 1. Leer la sesión guardada y escuchar cambios (login, logout, confirmación)
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      },
    );

    let mounted = true;

    async function restoreSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!data.session) {
          if (mounted) setSession(null);
          return;
        }

        const { data: userData, error: userError } =
          await supabase.auth.getUser();
        if (userError || !userData.user) {
          await supabase.auth.signOut({ scope: "local" });
          if (mounted) setSession(null);
          return;
        }

        const { data: currentSession } = await supabase.auth.getSession();
        if (mounted) setSession(currentSession.session);
      } catch (error) {
        console.error("No se pudo restaurar la sesión de Supabase.", error);
        if (mounted) setSession(null);
      } finally {
        if (mounted) setReady(true);
        void SplashScreen.hideAsync();
      }
    }

    void restoreSession();

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // 2. Decidir a dónde puede ir el usuario según tenga o no sesión (RF-01, RF-06)
  const inAuthGroup = segments[0] === "(auth)";
  const inPasswordReset = inAuthGroup && segments[1] === "reset-password";
  const inPasswordRecovery = inAuthGroup &&
    (segments[1] === "reset-password" || segments[1] === "forgot-password");

  useEffect(() => {
    if (inPasswordReset) setRecoveryUrl(null);
  }, [inPasswordReset]);

  useEffect(() => {
    if (!ready || !navigationState?.key) return;

    if (recoveryUrl && !inPasswordReset) {
      router.replace({
        pathname: "/(auth)/reset-password",
        params: obtenerParametrosRecuperacion(recoveryUrl),
      } as Href);
      return;
    }

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login" as Href);
    } else if (session && inAuthGroup && !inPasswordRecovery) {
      router.replace("/" as Href);
    }
  }, [
    session,
    ready,
    segments,
    navigationState?.key,
    router,
    recoveryUrl,
    inAuthGroup,
    inPasswordReset,
    inPasswordRecovery,
  ]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar style="dark" />
      <Slot />
    </ThemeProvider>
  );
}
