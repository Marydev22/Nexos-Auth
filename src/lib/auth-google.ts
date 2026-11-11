import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

export function getAuthRedirectUri(path?: string): string {
  return makeRedirectUri({ scheme: "exps", ...(path ? { path } : {}) });
}

// Lee los parámetros de la URL de retorno (?code=... o #access_token=...)
function parseReturnUrl(url: string) {
  const query = url.includes("?") ? url.split("?")[1].split("#")[0] : "";
  const hash = url.includes("#") ? url.split("#")[1] : "";
  return { query: new URLSearchParams(query), hash: new URLSearchParams(hash) };
}

export async function signInWithGoogle(): Promise<{ cancelled: boolean }> {
  const redirectTo = getAuthRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data.url)
    throw error ?? new Error("Supabase no devolvió la URL de Google");

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success") {
    return { cancelled: true };
  }

  const { query, hash } = parseReturnUrl(result.url);

  const code = query.get("code");
  if (code) {
    const { error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (sessionError) throw sessionError;
    return { cancelled: false };
  }

  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (sessionError) throw sessionError;
    return { cancelled: false };
  }

  throw new Error("La respuesta de Google no trajo credenciales");
}
