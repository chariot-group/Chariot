import axios, { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

/**
 * Several components mounting together (sidebar, header, locale sync, post-login navigation)
 * ask for the same resource at the same time. Identical GETs in flight share one HTTP request;
 * each caller still gets its own copy of the data and its own config (interceptors such as the
 * 401 retry stay per request). Nothing is cached once the request settles.
 *
 * The key includes the Authorization header: requests made with another user's token (account
 * switch, FR-user-cache-isolation) are never merged.
 * @see FR-web-first-load-performance (Slow-network authentication round trip, requirement 14)
 */
export function createDedupeInFlightGetAdapter(adapter: AxiosAdapter): AxiosAdapter {
  const inFlight = new Map<string, Promise<AxiosResponse>>();

  return (config: InternalAxiosRequestConfig) => {
    const key = dedupeKey(config);
    if (!key) return adapter(config);

    let shared = inFlight.get(key);
    if (!shared) {
      shared = adapter(config);
      inFlight.set(key, shared);
      const release = () => {
        if (inFlight.get(key) === shared) inFlight.delete(key);
      };
      shared.then(release, release);
      return shared;
    }

    return shared.then(
      (response) => ({ ...response, data: cloneData(response.data), config }),
      (error: unknown) => {
        throw withConfig(error, config);
      },
    );
  };
}

function dedupeKey(config: InternalAxiosRequestConfig): string | null {
  if ((config.method ?? "get").toLowerCase() !== "get") return null;
  // A cancellable request keeps its own lifecycle.
  if (config.signal || config.cancelToken) return null;
  const authorization = config.headers?.get?.("Authorization") ?? config.headers?.Authorization ?? "";
  return `${axios.getUri(config)}|${config.responseType ?? "json"}|${String(authorization)}`;
}

function cloneData<T>(data: T): T {
  if (data === null || typeof data !== "object") return data;
  try {
    return structuredClone(data);
  } catch {
    return data;
  }
}

function withConfig(error: unknown, config: InternalAxiosRequestConfig): unknown {
  if (!(error instanceof AxiosError)) return error;
  return new AxiosError(error.message, error.code, config, error.request, error.response);
}
