import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it, vi } from "vitest";
import { createDedupeInFlightGetAdapter } from "@/lib/http/dedupeInFlightGetAdapter";

function config(overrides: Partial<InternalAxiosRequestConfig> = {}, token = "token-a"): InternalAxiosRequestConfig {
  return {
    method: "get",
    baseURL: "http://api.test/api",
    url: "/user/me",
    headers: new AxiosHeaders({ Authorization: `Bearer ${token}` }),
    ...overrides,
  } as InternalAxiosRequestConfig;
}

function deferred() {
  let resolve!: (response: AxiosResponse) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<AxiosResponse>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const response = (requestConfig: InternalAxiosRequestConfig, data: unknown): AxiosResponse => ({
  data,
  status: 200,
  statusText: "OK",
  headers: {},
  config: requestConfig,
});

describe("createDedupeInFlightGetAdapter (FR-web-first-load-performance)", () => {
  it("nominal: concurrent identical GETs share one request, each caller gets its own config and data copy", async () => {
    const pending = deferred();
    const base = vi.fn(() => pending.promise);
    const adapter = createDedupeInFlightGetAdapter(base);

    const first = config();
    const second = config();
    const firstCall = adapter(first);
    const secondCall = adapter(second);
    pending.resolve(response(first, { id: "u1", roles: ["player"] }));

    const [firstResponse, secondResponse] = await Promise.all([firstCall, secondCall]);
    expect(base).toHaveBeenCalledTimes(1);
    expect(secondResponse.config).toBe(second);
    expect(secondResponse.data).toEqual(firstResponse.data);
    expect(secondResponse.data).not.toBe(firstResponse.data);
  });

  it("edge: another user's token, other params, non-GET or cancellable requests are never merged", async () => {
    const base = vi.fn((requestConfig: InternalAxiosRequestConfig) => Promise.resolve(response(requestConfig, {})));
    const adapter = createDedupeInFlightGetAdapter(base);

    await Promise.all([
      adapter(config()),
      adapter(config({}, "token-b")),
      adapter(config({ params: { page: 2 } })),
      adapter(config({ method: "post" })),
      adapter(config({ method: "post" })),
      adapter(config({ signal: new AbortController().signal })),
    ]);

    expect(base).toHaveBeenCalledTimes(6);
  });

  it("edge: once settled, the next identical GET hits the network again (no caching)", async () => {
    const base = vi.fn((requestConfig: InternalAxiosRequestConfig) => Promise.resolve(response(requestConfig, {})));
    const adapter = createDedupeInFlightGetAdapter(base);

    await adapter(config());
    await adapter(config());

    expect(base).toHaveBeenCalledTimes(2);
  });

  it("failure: a shared failure rejects every caller with its own config, then a retry hits the network", async () => {
    const pending = deferred();
    const base = vi.fn<(requestConfig: InternalAxiosRequestConfig) => Promise<AxiosResponse>>(() => pending.promise);
    const adapter = createDedupeInFlightGetAdapter(base);

    const first = config();
    const second = config();
    const firstCall = adapter(first);
    const secondCall = adapter(second);
    pending.reject(new AxiosError("Unauthorized", "ERR_BAD_REQUEST", first, null, { ...response(first, null), status: 401 }));

    await expect(firstCall).rejects.toMatchObject({ config: first });
    const secondError = await secondCall.catch((error: unknown) => error);
    expect(secondError).toBeInstanceOf(AxiosError);
    expect((secondError as AxiosError).config).toBe(second);
    expect((secondError as AxiosError).response?.status).toBe(401);

    // The failed entry is released: the 401 interceptor's retry goes to the network.
    base.mockImplementation((requestConfig) => Promise.resolve(response(requestConfig, {})));
    await adapter(config());
    expect(base).toHaveBeenCalledTimes(2);
  });
});
