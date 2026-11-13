import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import AppShellSkeleton from "@/components/layout/AppShellSkeleton";
import { resolveAuthSkeletonContent } from "@/components/layout/authSkeletonContent";

const navigation = vi.hoisted(() => ({ pathname: "/fr/welcome", search: "" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

const renderAt = (pathname: string, search = "", onRetry?: () => void) => {
  navigation.pathname = pathname;
  navigation.search = search;
  return renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      timeZone="UTC"
      messages={{
        auth: { loading: "Loading...", logoutEscape: "Log out" },
        common: { lazyLoadError: "Could not load", retry: "Retry" },
      }}>
      <AppShellSkeleton
        onLogout={() => undefined}
        onRetry={onRetry}
      />
    </NextIntlClientProvider>,
  );
};

describe("resolveAuthSkeletonContent (FR-auth-loading-skeleton)", () => {
  it("nominal: sheet variant on both character sheet routes, generic elsewhere", () => {
    expect(resolveAuthSkeletonContent("/fr/characters/abc", "magic")).toEqual({
      type: "sheet",
      variant: expect.objectContaining({ kind: "player", activeTab: "magic" }),
    });
    expect(resolveAuthSkeletonContent("/fr/campaigns/c1/groups/g1/characters/n1", "battle")).toEqual({
      type: "sheet",
      variant: expect.objectContaining({ kind: "npc", activeTab: "battle" }),
    });
    expect(resolveAuthSkeletonContent("/fr/welcome", null)).toEqual({ type: "generic" });
  });

  it("edge: locale only, trailing slash, sheet path without id or with a sub-path", () => {
    expect(resolveAuthSkeletonContent("/fr", null)).toEqual({ type: "generic" });
    expect(resolveAuthSkeletonContent("/fr/characters/abc/", null).type).toBe("sheet");
    expect(resolveAuthSkeletonContent("/fr/characters", null)).toEqual({ type: "generic" });
    expect(resolveAuthSkeletonContent("/fr/characters/abc/edit", null)).toEqual({ type: "generic" });
    expect(resolveAuthSkeletonContent("/fr/campaigns/c1/groups/g1", null)).toEqual({ type: "generic" });
    expect(resolveAuthSkeletonContent(null, null)).toEqual({ type: "generic" });
  });

  it("edge: tab=companions on the campaign route gives the PC sheet variant", () => {
    const content = resolveAuthSkeletonContent("/fr/campaigns/c1/groups/g1/characters/p1", "companions");
    expect(content.type === "sheet" && content.variant.kind).toBe("player");
  });
});

describe("AppShellSkeleton — rendering and accessibility", () => {
  it("nominal: status region with aria-busy and the loading label; sheet skeleton on a sheet route", () => {
    const html = renderAt("/fr/campaigns/c1/groups/g1/characters/n1", "tab=history");

    expect(html).toMatch(/<div[^>]*role="status"[^>]*aria-busy="true"/);
    expect(html).toContain('<span class="sr-only">Loading...</span>');
    expect(html).toContain('data-skeleton-card="backstory"');
    // The embedded sheet skeleton does not add a second status region
    expect(html.match(/role="status"/g)).toHaveLength(1);
  });

  it("edge: generic content outside sheet routes", () => {
    const html = renderAt("/fr/welcome");
    expect(html).not.toContain("data-skeleton-card");
  });

  it("guard: the log out escape hatch is the only focusable element, and there is no spinner", () => {
    const html = renderAt("/fr/characters/abc", "tab=companions");

    expect(html.match(/<(button|a|input|select|textarea)\b/g)).toEqual(["<button"]);
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>Log out<\/button>/);
    expect(html).not.toContain("animate-spin");
  });

  it("failure: shell load failure keeps the frame, shows an alert with retry, and is no longer busy (FR-web-first-load-performance)", () => {
    const html = renderAt("/fr/characters/abc", "", () => undefined);

    expect(html).toMatch(/role="alert"/);
    expect(html).toContain("Could not load");
    expect(html).not.toContain('aria-busy="true"');
    expect(html).not.toContain('role="status"');
    // Log out escape hatch and retry are the two focusable elements
    expect(html.match(/<button/g)).toHaveLength(2);
    expect(html).toContain(">Retry</button>");
    expect(html).toContain(">Log out</button>");
  });
});
