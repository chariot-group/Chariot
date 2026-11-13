import { describe, expect, it, vi } from "vitest";
import { createInFlightGuard } from "@/lib/inFlightGuard";

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("createInFlightGuard — FR-sidebar-navigation « Load more »", () => {
  it("nominal: runs the task and returns its result", async () => {
    const guard = createInFlightGuard();
    await expect(guard.run(async () => "page-2")).resolves.toBe("page-2");
    expect(guard.busy).toBe(false);
  });

  it("edge: a second call while the first is in flight is ignored (single request)", async () => {
    const guard = createInFlightGuard();
    const pending = deferred<string>();
    const task = vi.fn(() => pending.promise);

    const first = guard.run(task);
    const second = guard.run(task);

    expect(guard.busy).toBe(true);
    await expect(second).resolves.toBeUndefined();
    pending.resolve("page-2");
    await expect(first).resolves.toBe("page-2");
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("failure: the error propagates and the guard is released for a retry", async () => {
    const guard = createInFlightGuard();
    const pending = deferred<string>();
    const failing = guard.run(() => pending.promise);
    pending.reject(new Error("network"));

    await expect(failing).rejects.toThrow("network");
    expect(guard.busy).toBe(false);
    await expect(guard.run(async () => "retry")).resolves.toBe("retry");
  });
});
