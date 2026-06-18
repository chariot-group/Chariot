import {
  buildKeycloakAuthOptions,
  resolveAuthLocale,
  resolveProfileLocale,
  shouldSyncAccountLocale,
} from "@/hooks/useLocalePreference";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("resolveAuthLocale", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    });
    vi.stubGlobal("navigator", {
      languages: ["en-US"],
      language: "en-US",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefers stored locale over URL prefix", () => {
    vi.mocked(localStorage.getItem).mockReturnValue("es");

    expect(resolveAuthLocale("/fr/profile")).toBe("es");
  });

  it("falls back to URL prefix when nothing is stored", () => {
    expect(resolveAuthLocale("/en/profile")).toBe("en");
  });

  it("falls back to browser locale when storage and URL are unavailable", () => {
    expect(resolveAuthLocale("/invalid/profile")).toBe("en");
  });
});

describe("buildKeycloakAuthOptions", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: { origin: "https://chariot.tools", pathname: "/fr/profile" },
    });
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => "fr"),
      setItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds redirect URI and locale from stored preference", () => {
    expect(buildKeycloakAuthOptions("/fr/profile")).toEqual({
      locale: "fr",
      redirectUri: "https://chariot.tools/fr",
    });
  });
});

describe("resolveProfileLocale", () => {
  it("prefers account locale when set", () => {
    expect(resolveProfileLocale("es", "fr")).toBe("es");
  });

  it("falls back to URL locale when account locale is unset", () => {
    expect(resolveProfileLocale(undefined, "en")).toBe("en");
  });
});

describe("shouldSyncAccountLocale", () => {
  it("returns true when account locale differs from URL locale", () => {
    expect(shouldSyncAccountLocale("es", "/en/profile")).toBe(true);
  });

  it("returns false when locales already match", () => {
    expect(shouldSyncAccountLocale("es", "/es/profile")).toBe(false);
  });

  it("returns false when account locale is unset", () => {
    expect(shouldSyncAccountLocale(undefined, "/en/profile")).toBe(false);
  });
});
