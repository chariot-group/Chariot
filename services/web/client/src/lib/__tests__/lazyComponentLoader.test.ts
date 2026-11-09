import { describe, expect, it, vi } from "vitest";
import { createLazyComponentLoader, shouldMountLazyDialog } from "@/lib/lazyComponentLoader";

function Dummy() {
  return null;
}

describe("createLazyComponentLoader (FR-web-first-load-performance)", () => {
  it("nominal: does not fetch until load() and caches the loaded component", async () => {
    const loader = vi.fn().mockResolvedValue({ default: Dummy });
    const lazy = createLazyComponentLoader(loader);

    expect(loader).not.toHaveBeenCalled();
    expect(lazy.getLoaded()).toBeNull();

    await expect(lazy.load()).resolves.toBe(Dummy);
    expect(lazy.getLoaded()).toBe(Dummy);

    await lazy.load();
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("edge: concurrent loads (double click on a trigger) share a single fetch", async () => {
    const loader = vi.fn().mockResolvedValue({ default: Dummy });
    const lazy = createLazyComponentLoader(loader);

    const [first, second] = await Promise.all([lazy.load(), lazy.load()]);

    expect(first).toBe(Dummy);
    expect(second).toBe(Dummy);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("failure: a rejected fetch is not cached, so the next load retries", async () => {
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error("ChunkLoadError"))
      .mockResolvedValueOnce({ default: Dummy });
    const lazy = createLazyComponentLoader(loader);

    await expect(lazy.load()).rejects.toThrow("ChunkLoadError");
    expect(lazy.getLoaded()).toBeNull();

    await expect(lazy.load()).resolves.toBe(Dummy);
    expect(loader).toHaveBeenCalledTimes(2);
  });
});

describe("createLazyComponentLoader.preload", () => {
  it("nominal: prefetches so the next load resolves from cache", async () => {
    const loader = vi.fn().mockResolvedValue({ default: Dummy });
    const lazy = createLazyComponentLoader(loader);

    lazy.preload();
    await lazy.load();

    expect(loader).toHaveBeenCalledTimes(1);
    expect(lazy.getLoaded()).toBe(Dummy);
  });

  it("failure: swallows a failed prefetch and lets the next load retry", async () => {
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ default: Dummy });
    const lazy = createLazyComponentLoader(loader);

    expect(() => lazy.preload()).not.toThrow();
    // Let the rejected prefetch settle before retrying.
    await new Promise((resolve) => setTimeout(resolve, 0));

    await expect(lazy.load()).resolves.toBe(Dummy);
    expect(loader).toHaveBeenCalledTimes(2);
  });
});

describe("shouldMountLazyDialog", () => {
  it("nominal: never mounts a dialog that was never opened", () => {
    expect(shouldMountLazyDialog(false, false)).toBe(false);
  });

  it("nominal: mounts when opened", () => {
    expect(shouldMountLazyDialog(true, false)).toBe(true);
  });

  it("edge: stays mounted after close so the close animation can play", () => {
    expect(shouldMountLazyDialog(false, true)).toBe(true);
  });
});
