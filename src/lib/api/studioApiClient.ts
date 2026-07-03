import { getInigoApiBase } from '@/lib/inigoApiBase';

export class StudioApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'StudioApiError';
    this.status = status;
    this.body = body;
  }
}

type StudioFetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

function parseApiErrorMessage(body: unknown, status: number): string {
  if (typeof body === 'object' && body !== null) {
    const record = body as Record<string, unknown>;
    if (typeof record.detail === 'string') return record.detail;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.error === 'string') return record.error;

    const fieldParts: string[] = [];
    for (const [key, value] of Object.entries(record)) {
      if (key === 'code') continue;
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === 'string') fieldParts.push(`${key}: ${item}`);
        });
      } else if (typeof value === 'string') {
        fieldParts.push(`${key}: ${value}`);
      }
    }
    if (fieldParts.length > 0) return fieldParts.join(' ');
  }
  if (typeof body === 'string' && body.trim()) return body.trim();
  return `Request failed with status ${status}`;
}

function buildUrl(path: string): string {
  const base = getInigoApiBase();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export async function studioFetch<T>(
  path: string,
  options: StudioFetchOptions = {},
): Promise<T> {
  const { method = 'GET', body, token, signal } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof TypeError || error instanceof DOMException || error instanceof Event) {
      throw error;
    }
    throw new TypeError('Network request failed');
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const parsedBody = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

  if (!response.ok) {
    throw new StudioApiError(parseApiErrorMessage(parsedBody, response.status), response.status, parsedBody);
  }

  return parsedBody as T;
}
