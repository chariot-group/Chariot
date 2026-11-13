import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentType, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const shell = vi.hoisted(() => ({
  loaded: null as ComponentType<{ children: ReactNode }> | null,
  load: vi.fn(),
}));

vi.mock("@/components/layout/authenticatedShellLoader", () => ({
  authenticatedShellLoader: { getLoaded: () => shell.loaded, load: shell.load, preload: vi.fn() },
}));
vi.mock("@/providers/KeycloakProvider", () => ({ useKeycloak: () => ({ logout: vi.fn() }) }));
vi.mock("@/logger/reportClientIssue", () => ({ reportClientIssue: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/fr/welcome",
  useSearchParams: () => new URLSearchParams(),
}));

import AuthenticatedShellGate from "@/components/layout/AuthenticatedShellGate";

const render = () =>
  renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      timeZone="UTC"
      messages={{ auth: { loading: "Loading...", logoutEscape: "Log out" } }}>
      <AuthenticatedShellGate>
        <main>page content</main>
      </AuthenticatedShellGate>
    </NextIntlClientProvider>,
  );

describe("AuthenticatedShellGate (FR-web-first-load-performance, FR-auth-loading-skeleton)", () => {
  afterEach(() => {
    shell.loaded = null;
  });

  it("nominal: once the shell chunk is loaded, the page renders inside it", () => {
    shell.loaded = ({ children }) => <div data-shell="">{children}</div>;

    const html = render();

    expect(html).toBe('<div data-shell=""><main>page content</main></div>');
  });

  it("edge: while the shell chunk is in flight, the auth skeleton stays (one continuous skeleton, no page)", () => {
    const html = render();

    expect(html).toMatch(/role="status"[^>]*aria-busy="true"/);
    expect(html).toContain(">Log out</button>");
    expect(html).not.toContain("page content");
  });
});
