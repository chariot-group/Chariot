import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { createLazyComponent, createLazyDialog } from "@/components/lazy/createLazyComponent";

const messages = {
  common: {
    lazyLoading: "Loading…",
    lazyLoadError: "Could not load",
    retry: "Retry",
  },
};

function render(node: ReactNode) {
  return renderToStaticMarkup(
    <NextIntlClientProvider
      locale="en"
      messages={messages}>
      {node}
    </NextIntlClientProvider>,
  );
}

interface FakeDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
}

function FakeDialog({ open, title }: FakeDialogProps) {
  return open ? <div role="dialog">{title}</div> : null;
}

function FakeForm({ label }: { label: string }) {
  return <form aria-label={label} />;
}

describe("createLazyDialog (FR-web-first-load-performance)", () => {
  it("nominal: a closed dialog renders nothing and is not fetched", () => {
    const loader = vi.fn().mockResolvedValue({ default: FakeDialog });
    const LazyDialog = createLazyDialog<FakeDialogProps>(loader);

    const html = render(
      <LazyDialog
        open={false}
        title="Export"
      />,
    );

    expect(html).toBe("");
    expect(loader).not.toHaveBeenCalled();
  });

  it("edge: an open dialog shows an accessible loading status until its code arrives", () => {
    const LazyDialog = createLazyDialog<FakeDialogProps>(() => new Promise(() => {}));

    const html = render(
      <LazyDialog
        open
        title="Export"
      />,
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Loading…");
  });

  it("nominal: once preloaded, the dialog renders with the same props", async () => {
    const LazyDialog = createLazyDialog<FakeDialogProps>(() => Promise.resolve({ default: FakeDialog }));
    LazyDialog.preload();
    await Promise.resolve();
    await Promise.resolve();

    const html = render(
      <LazyDialog
        open
        title="Export"
      />,
    );

    expect(html).toBe('<div role="dialog">Export</div>');
  });

  it("failure: a failed preload does not throw (the open path reports and retries)", async () => {
    const loader = vi.fn().mockRejectedValue(new Error("ChunkLoadError"));
    const LazyDialog = createLazyDialog<FakeDialogProps>(loader);

    expect(() => LazyDialog.preload()).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    const html = render(
      <LazyDialog
        open={false}
        title="Export"
      />,
    );
    expect(html).toBe("");
  });
});

describe("createLazyComponent (FR-web-first-load-performance)", () => {
  it("edge: shows an accessible loading status before the edit form is fetched", () => {
    const LazyForm = createLazyComponent<{ label: string }>(() => new Promise(() => {}));

    const html = render(<LazyForm label="Magic" />);

    expect(html).toContain('role="status"');
    expect(html).toContain("Loading…");
  });

  it("nominal: renders the loaded form with its props", async () => {
    const LazyForm = createLazyComponent<{ label: string }>(() => Promise.resolve({ default: FakeForm }));
    LazyForm.preload();
    await Promise.resolve();
    await Promise.resolve();

    expect(render(<LazyForm label="Magic" />)).toBe('<form aria-label="Magic"></form>');
  });
});
