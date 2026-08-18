// src/lib/api.ts

export async function api<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const baseUrl = import.meta.env?.VITE_API_URL || '';
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  let retries = 3;
  let delay = 500;

  while (retries > 0) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      // Dacă serverul dă 502 (Bad Gateway), așteptăm și reîncercăm
      if (response.status === 502) {
        throw new Error('Server error (502)');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      retries--;
      if (retries === 0) {
        throw err;
      }
      // Pauză crescătoare între încercări (500ms, 1000ms...)
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  throw new Error('Server error (502)');
}
