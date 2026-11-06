import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { isSidebarVisible, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const messages = {
  header: {
    sidebarOpenAriaLabel: "Open menu",
    sidebarCloseAriaLabel: "Close menu",
  },
};

const renderTrigger = (open: boolean) =>
  renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      timeZone="UTC"
      messages={messages}>
      <SidebarProvider open={open}>
        <SidebarTrigger />
      </SidebarProvider>
    </NextIntlClientProvider>,
  );

describe("SidebarTrigger — icon and accessible state", () => {
  it("nominal: expanded sidebar shows the X icon, aria-expanded and a close label", () => {
    const html = renderTrigger(true);

    expect(html).toContain("lucide-x");
    expect(html).not.toContain("lucide-menu");
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-label="Close menu"');
    expect(html).toContain('data-state="open"');
  });

  it("nominal: collapsed sidebar shows the burger icon, aria-expanded false and an open label", () => {
    const html = renderTrigger(false);

    expect(html).toContain("lucide-menu");
    expect(html).not.toContain("lucide-x");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Open menu"');
    expect(html).toContain('data-state="closed"');
  });

  it("edge: the decorative icon is hidden from assistive technologies", () => {
    expect(renderTrigger(true)).toMatch(/<svg[^>]*aria-hidden="true"/);
  });
});

describe("isSidebarVisible", () => {
  it("nominal: desktop follows the persistent open state", () => {
    expect(isSidebarVisible({ isMobile: false, open: true, openMobile: false })).toBe(true);
    expect(isSidebarVisible({ isMobile: false, open: false, openMobile: true })).toBe(false);
  });

  it("edge: mobile follows the overlay sheet state, not the desktop state", () => {
    expect(isSidebarVisible({ isMobile: true, open: true, openMobile: false })).toBe(false);
    expect(isSidebarVisible({ isMobile: true, open: false, openMobile: true })).toBe(true);
  });
});
