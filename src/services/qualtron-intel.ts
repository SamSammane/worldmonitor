/**
 * Thin client for the Qualtron Intelligence daemon (separate private service).
 * Read-only: fetches published artifacts for display (panels, blog teasers).
 * Entirely optional — every call resolves to empty data when the daemon URL
 * is not configured or unreachable, so no caller needs a feature flag.
 */

export type QualtronArtifactType = 'news_digest' | 'blog_post' | 'deep_analysis';

export interface QualtronArtifact {
  id: string;
  type: QualtronArtifactType;
  title: string;
  summary: string;
  body: string;
  sources: Array<{ title: string; url?: string }>;
  createdAt: string;
}

const BASE = (import.meta.env.VITE_QUALTRON_INTEL_URL ?? '').replace(/\/+$/, '');

const FETCH_TIMEOUT_MS = 8000;

export function qualtronIntelEnabled(): boolean {
  return BASE.length > 0;
}

async function getJson<T>(path: string): Promise<T | null> {
  if (!BASE) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchQualtronArtifacts(opts: {
  type?: QualtronArtifactType;
  limit?: number;
} = {}): Promise<QualtronArtifact[]> {
  const params = new URLSearchParams();
  if (opts.type) params.set('type', opts.type);
  if (opts.limit) params.set('limit', String(opts.limit));
  const qs = params.toString();
  const data = await getJson<{ items?: QualtronArtifact[] }>(`/v1/content${qs ? `?${qs}` : ''}`);
  return data?.items ?? [];
}

export async function fetchLatestQualtronArtifact(
  type?: QualtronArtifactType,
): Promise<QualtronArtifact | null> {
  const qs = type ? `?type=${type}` : '';
  const data = await getJson<{ item?: QualtronArtifact }>(`/v1/content/latest${qs}`);
  return data?.item ?? null;
}
