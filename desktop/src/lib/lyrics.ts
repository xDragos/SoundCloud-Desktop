import { api } from './api';

export interface LyricLine {
  text: string;
  timestamp?: number;
}

export interface LyricsSource {
  id: string;
  name: string;
}

export type LyricMode = 'text' | 'semantic' | 'auto';

export interface LyricHit {
  track: any;
  matchedLine: string | null;
  score: number;
}

export async function fetchLyricsByTrack(trackUrn: string): Promise<any> {
  return api(`/tracks/${encodeURIComponent(trackUrn)}/lyrics`, undefined, 10000);
}

export async function getLyricsByTrack(trackUrn: string): Promise<any> {
  return fetchLyricsByTrack(trackUrn);
}

export async function fetchLyricsTimed(trackUrn: string): Promise<any> {
  return api(`/tracks/${encodeURIComponent(trackUrn)}/lyrics/timed`, undefined, 10000);
}

export async function searchLyricsManual(query: string, trackUrn?: string): Promise<LyricHit[]> {
  return api(`/search/lyrics/manual?q=${encodeURIComponent(query)}${trackUrn ? `&track_urn=${encodeURIComponent(trackUrn)}` : ''}`);
}
