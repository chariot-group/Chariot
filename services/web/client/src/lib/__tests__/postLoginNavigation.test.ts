import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPostLoginCompleted,
  hasCompletedPostLogin,
  markPostLoginCompleted,
  shouldAttemptPostLoginRedirect,
  shouldRedirectAfterLogin,
} from "@/lib/postLoginNavigation";

/** @see FR-post-auth-navigation: Post-Authentication Navigation Priority */
/** @see FR-user-cache-isolation: User Cache Isolation and Session Transition */
describe("FR-post-auth-navigation / FR-user-cache-isolation — post-login redirect guard", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    vi.stubGlobal("window", {});
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => {
        store.clear();
      },
      get length() {
        return store.size;
      },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("shouldRedirectAfterLogin", () => {
    it("nominal: redirects from locale root", () => {
      expect(shouldRedirectAfterLogin("/fr")).toBe(true);
      expect(shouldRedirectAfterLogin("/en")).toBe(true);
    });

    it("edge: does not redirect from character or welcome paths", () => {
      expect(shouldRedirectAfterLogin("/fr/characters/abc")).toBe(false);
      expect(shouldRedirectAfterLogin("/fr/welcome")).toBe(false);
      expect(shouldRedirectAfterLogin("/fr/campaigns/c1/groups/g1/characters/ch1")).toBe(false);
    });
  });

  describe("shouldAttemptPostLoginRedirect", () => {
    it("nominal: allows one attempt then blocks after mark", () => {
      const userId = "user-b";
      expect(shouldAttemptPostLoginRedirect("/fr", userId)).toBe(true);
      markPostLoginCompleted(userId);
      expect(hasCompletedPostLogin(userId)).toBe(true);
      expect(shouldAttemptPostLoginRedirect("/fr", userId)).toBe(false);
    });

    it("edge: different user is not blocked by another user's flag", () => {
      markPostLoginCompleted("user-a");
      expect(shouldAttemptPostLoginRedirect("/fr", "user-b")).toBe(true);
    });

    it("failure: missing userId still marks anon completion to stop remount loops", () => {
      expect(shouldAttemptPostLoginRedirect("/fr", null)).toBe(true);
      markPostLoginCompleted(null);
      expect(hasCompletedPostLogin(null)).toBe(true);
      expect(shouldAttemptPostLoginRedirect("/fr", null)).toBe(false);
      clearPostLoginCompleted();
    });
  });
});
