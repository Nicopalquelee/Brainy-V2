export function getApiBase(): string {
  const env = (import.meta as unknown).env || {};
  const fromEnv = env.VITE_API_URL as string | undefined;
  // Default to backend with global /api prefix
  return (fromEnv && fromEnv.trim().length > 0) ? fromEnv : 'http://localhost:3000/api';
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

function joinBaseAndPath(base: string, path: string): string {
  // normalize base and path, prevent double / and duplicate /api
  const trimmedBase = base.replace(/\/$/, '');
  let normalizedPath = path.startsWith('http') ? path : (`/${path}`).replace(/\/+/g, '/');
  const baseHasApi = /\/api\/?$/.test(trimmedBase);
  const pathStartsWithApi = /^\/api(\/|$)/.test(normalizedPath);
  if (baseHasApi && pathStartsWithApi) {
    normalizedPath = normalizedPath.replace(/^\/api/, '') || '/';
  }
  return `${trimmedBase}${normalizedPath}`;
}

export async function fetchJson<T>(path: string, options: { method?: HttpMethod; token?: string; body?: unknown; headers?: Record<string, string> } = {}): Promise<T> {
  const base = getApiBase();
  const { method = 'GET', token, body, headers = {} } = options;
  const url = joinBaseAndPath(base, path);
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function absoluteFromContentUrl(contentUrl?: string): string | undefined {
  if (!contentUrl) return undefined;
  if (contentUrl.startsWith('http://') || contentUrl.startsWith('https://')) return contentUrl;
  const base = getApiBase();
  // uploads are served at root, not under /api
  const baseWithoutApi = base.replace(/\/api\/?$/, '');
  const trimmedBase = baseWithoutApi.replace(/\/$/, '');
  const normalizedPath = contentUrl.startsWith('/') ? contentUrl : `/${contentUrl}`;
  return `${trimmedBase}${normalizedPath}`;
}


