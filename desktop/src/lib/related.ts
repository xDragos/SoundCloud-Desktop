import { api, ApiError } from './api';

export interface TrackPage {
  collection: any[];
  page: number;
  page_size: number;
  has_more: boolean;
}

export async function fetchRelatedTracks(trackUrn: string, limit = 10): Promise<TrackPage> {
  try {
    return await api<TrackPage>(
      `/tracks/${encodeURIComponent(trackUrn)}/related?limit=${limit}`,
      { silentStatuses: [404, 502] }
    );
  } catch (e: unknown) {
    const err = e as ApiError;
    if (err?.status === 404 || err?.status === 502) {
      return { collection: [], page: 0, page_size: limit, has_more: false };
    }
    throw e;
  }
}
