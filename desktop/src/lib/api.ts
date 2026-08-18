export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let sessionId: string | null = null;

export function getSessionId(): string | null {
  return sessionId;
}

export function setSessionId(id: string | null): void {
  sessionId = id;
}

export function buildStorageUrls(trackId?: unknown, _arg2?: unknown, _arg3?: unknown): string[] {
  return trackId ? [`/api/stream/${trackId}`] : [];
}

export function downloadFallbackUrls(trackId?: unknown, _arg2?: unknown, _arg3?: unknown): string[] {
  return trackId ? [`/api/download/${trackId}`] : [];
}

export function streamFallbackUrls(trackId?: unknown, _arg2?: unknown, _arg3?: unknown): string[] {
  return trackId ? [`/api/stream/${trackId}`] : [];
}

export async function resolveTrackFromStreaming(streamingUrl: string): Promise<unknown> {
  return api(`/tracks/resolve?url=${encodeURIComponent(streamingUrl)}`);
}

export async function fetchWithAuthFallback<T = unknown>(
  url: string,
  options?: RequestInit & { silentStatuses?: number[] },
): Promise<T> {
  return api<T>(url, options);
}

export async function api<T = unknown>(
  url: string,
  options?: RequestInit & { silentStatuses?: number[] },
  timeoutMs?: number,
): Promise<T> {
  const controller = new AbortController();
  const id = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    if (sessionId) {
      headers['X-Session-ID'] = sessionId;
    }

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });

    if (id) clearTimeout(id);

    if (!response.ok) {
      if (!options?.silentStatuses?.includes(response.status)) {
        console.error(`API Error ${response.status} on ${url}`);
      }
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error: unknown) {
    if (id) clearTimeout(id);
    const err = error as { name?: string };
    if (err.name === 'AbortError') {
      throw new ApiError(408, 'Request timeout');
    }
    throw error;
  }
}
