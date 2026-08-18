import { api, pagedUrl, SEARCH_CACHE_MS, SEARCH_DB_LIMIT, SEARCH_DB_MAX_PAGES, usePagedQuery } from './hooks';

export type LyricMode = 'text' | 'semantic' | 'auto';

export interface LyricHit {
  track: any;
  matchedLine: string | null;
  score: number;
}

export function useLyricSearch(q: string, mode: LyricMode = 'auto') {
  const query = usePagedQuery<LyricHit>({
    queryKey: ['search', 'lyrics', q, mode],
    url: (page, limit) =>
      pagedUrl('/search/lyrics', page, limit, `q=${encodeURIComponent(q)}&mode=${mode}`),
    limit: SEARCH_DB_LIMIT,
    staleTime: SEARCH_CACHE_MS,
    maxPages: SEARCH_DB_MAX_PAGES,
    enabled: q.trim().length >= 2,
    dedupe: (h) => h.track.urn,
  });
  return { hits: query.items, ...query };
}

export async function fetchLyricsByTrack(trackUrn: string): Promise<any> {
  return api(`/tracks/${encodeURIComponent(trackUrn)}/lyrics`, undefined, 10000);
}

export async function fetchLyricsTimed(trackUrn: string): Promise<any> {
  return api(`/tracks/${encodeURIComponent(trackUrn)}/lyrics/timed`, undefined, 10000);
}
