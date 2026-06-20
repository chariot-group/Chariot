import { beforeEach, describe, expect, it, vi } from "vitest";

const headMock = vi.fn();
const getMock = vi.fn();

vi.mock("axios", () => ({
  default: {
    create: () => ({
      head: headMock,
      get: getMock,
    }),
    isAxiosError: (error: unknown) =>
      typeof error === "object" && error != null && "isAxiosError" in error,
  },
}));

describe("CodexService.checkHealth", () => {
  beforeEach(() => {
    headMock.mockReset();
    getMock.mockReset();
    headMock.mockResolvedValue({ status: 200 });
    vi.stubEnv("NEXT_PUBLIC_CODEX_URL", "https://codex.test");
  });

  it("nominal: utilise HEAD /spells sans paramètres de pagination", async () => {
    const { default: CodexService } = await import("../CodexService");

    await expect(CodexService.checkHealth()).resolves.toBe(true);

    expect(headMock).toHaveBeenCalledWith("/spells", { timeout: 3000 });
    expect(getMock).not.toHaveBeenCalled();
  });

  it("edge: retombe sur GET minimal si HEAD n'est pas supporté", async () => {
    headMock.mockRejectedValue({
      isAxiosError: true,
      response: { status: 405 },
    });
    getMock.mockResolvedValue({ status: 200, data: { data: [] } });

    const { default: CodexService } = await import("../CodexService");

    await expect(CodexService.checkHealth()).resolves.toBe(true);

    expect(getMock).toHaveBeenCalledWith("/spells", {
      params: { page: 1, offset: 1 },
      timeout: 3000,
    });
  });

  it("error: renvoie false quand Codex ne répond pas", async () => {
    headMock.mockRejectedValue(new Error("network down"));

    const { default: CodexService } = await import("../CodexService");

    await expect(CodexService.checkHealth()).resolves.toBe(false);
    expect(getMock).not.toHaveBeenCalled();
  });
});
