import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DialogPortalContainerProvider } from "@/components/ui/dialog-portal-container";
import { PopoverContent } from "@/components/ui/popover";

vi.mock("radix-ui", () => ({
  Popover: {
    Root: ({ children }: { children: ReactNode }) => children,
    Trigger: ({ children }: { children: ReactNode }) => children,
    Close: ({ children }: { children: ReactNode }) => children,
    Portal: ({ children, container }: { children: ReactNode; container?: HTMLElement }) => (
      <div data-portal-container={container ? (container as unknown as { id: string }).id : "body"}>{children}</div>
    ),
    Content: ({ children, className }: { children: ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));

describe("PopoverContent portal", () => {
  it("nominal: inside a dialog, portals into the dialog content so the scroll lock keeps wheel scroll", () => {
    const dialogContent = { id: "dialog-content" } as unknown as HTMLElement;
    const html = renderToStaticMarkup(
      <DialogPortalContainerProvider container={dialogContent}>
        <PopoverContent>Liste</PopoverContent>
      </DialogPortalContainerProvider>,
    );

    expect(html).toContain('data-portal-container="dialog-content"');
    expect(html).toContain("Liste");
  });

  it("edge: outside a dialog, portals to the document body", () => {
    const html = renderToStaticMarkup(<PopoverContent>Liste</PopoverContent>);

    expect(html).toContain('data-portal-container="body"');
  });

  it("failure guard: dialog container not mounted yet falls back to the document body", () => {
    const html = renderToStaticMarkup(
      <DialogPortalContainerProvider container={null}>
        <PopoverContent>Liste</PopoverContent>
      </DialogPortalContainerProvider>,
    );

    expect(html).toContain('data-portal-container="body"');
  });
});
