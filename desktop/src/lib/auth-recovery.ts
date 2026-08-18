import { api } from './api';

export async function recoverAuthSession(): Promise<boolean> {
  try {
    await api('/auth/me');
    return true;
  } catch (_e: unknown) {
    return false;
  }
}

export async function completeReauth(code?: string): Promise<boolean> {
  try {
    await api('/auth/reauth', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return true;
  } catch {
    return false;
  }
}

export async function retryRenew(): Promise<boolean> {
  try {
    await api('/auth/renew', { method: 'POST' });
    return true;
  } catch {
    return false;
  }
}

export function noteAuthGap(): void {
  console.warn('Auth gap detected');
}

export function noteRateLimit(): void {
  console.warn('Rate limit hit');
}

export function noteSuccess(): void {
  // Reset failure metrics
}
