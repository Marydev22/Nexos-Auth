import { getAuthRedirectUri } from './auth-google';
import { supabase } from './supabase';

export type RecoveryCallback = {
  code?: string;
  tokenHash?: string;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
};

export function getPasswordRecoveryRedirectUri(): string {
  return getAuthRedirectUri('reset-password');
}

export async function sendPasswordRecovery(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordRecoveryRedirectUri(),
  });
}

export async function establishPasswordRecoverySession(
  callback: RecoveryCallback,
): Promise<{ error: Error | null }> {
  if (callback.error) {
    return { error: new Error('El enlace de recuperación no es válido o ya expiró.') };
  }

  if (callback.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(callback.code);
    return { error };
  }

  if (callback.tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: callback.tokenHash,
      type: 'recovery',
    });
    return { error };
  }

  if (callback.accessToken && callback.refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: callback.accessToken,
      refresh_token: callback.refreshToken,
    });
    return { error };
  }

  return { error: new Error('El enlace de recuperación no contiene credenciales.') };
}
