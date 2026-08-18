import { api, ApiError } from './api';

export async function recoverAuthSession(): Promise<boolean> {
  try {
    await api('/auth/me');
    return true;
  } catch (e: unknown) {
    const err = e as ApiError;
    if (err?.status === 401) {
      return false;
    }
    return false;
  }
}
