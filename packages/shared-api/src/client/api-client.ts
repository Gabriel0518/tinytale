import { ApiError } from './errors';
import type { RequestContext } from './request-context';

export interface ApiRequestOptions extends RequestInit {
  token?: string;
}

export interface ApiClient {
  get<T = unknown>(endpoint: string, options?: ApiRequestOptions): Promise<T>;
  post<T = unknown>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<T>;
  put<T = unknown>(endpoint: string, body?: unknown, options?: ApiRequestOptions): Promise<T>;
  delete<T = unknown>(endpoint: string, options?: ApiRequestOptions): Promise<T>;
}

const LANGUAGE_QUERY_ENDPOINT_PREFIXES = [
  '/api/dramas',
  '/api/categories',
  '/api/featured',
  '/api/playlists',
  '/api/banners',
  '/api/hero-banners',
];

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const entries: Record<string, string> = {};
    headers.forEach((value, key) => {
      entries[key] = value;
    });
    return entries;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
}

function appendLanguageQuery(endpoint: string, language: string | null | undefined): string {
  if (!language) return endpoint;
  if (!LANGUAGE_QUERY_ENDPOINT_PREFIXES.some((prefix) => endpoint.startsWith(prefix))) return endpoint;
  if (endpoint.includes('lang=')) return endpoint;
  return `${endpoint}${endpoint.includes('?') ? '&' : '?'}lang=${encodeURIComponent(language)}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T) : ({} as T);

  if (!response.ok) {
    const message =
      (payload as { error?: { message?: string } })?.error?.message ||
      (payload as { message?: string })?.message ||
      'Request failed';
    throw new ApiError(message, response.status, payload);
  }

  return payload;
}

export function createApiClient(
  contextProvider: RequestContext | (() => RequestContext),
  fetchImplementation: typeof fetch = fetch
): ApiClient {
  function resolveContext(): RequestContext {
    return typeof contextProvider === 'function' ? contextProvider() : contextProvider;
  }

  async function request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: unknown,
    options: ApiRequestOptions = {}
  ) {
    const context = resolveContext();
    const targetEndpoint = method === 'GET' ? appendLanguageQuery(endpoint, context.locale) : endpoint;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(context.locale ? { 'x-user-lang': context.locale } : {}),
      ...normalizeHeaders(options.headers),
    };
    const token = options.token ?? context.token;

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetchImplementation(`${normalizeBaseUrl(context.baseUrl)}${targetEndpoint}`, {
      ...options,
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    return parseResponse<T>(response);
  }

  return {
    get(endpoint, options) {
      return request('GET', endpoint, undefined, options);
    },
    post(endpoint, body, options) {
      return request('POST', endpoint, body, options);
    },
    put(endpoint, body, options) {
      return request('PUT', endpoint, body, options);
    },
    delete(endpoint, options) {
      return request('DELETE', endpoint, undefined, options);
    },
  };
}
