import Image, { StaticImageData } from "next/image";
import type { ReactNode } from "react";

interface FallbackLayoutProps {
  image: StaticImageData;
  /** Small label above the title (e.g. the campaign name). */
  eyebrow?: string;
  title: string;
  description: string;
  /** Call-to-action buttons. */
  actions: ReactNode;
  /** Optional muted hint under the actions. */
  hint?: string;
}

/** Shared layout of the empty-space fallback pages (FR-welcome-onboarding-fallbacks): same visual as Welcome options. */
export default function FallbackLayout({ image, eyebrow, title, description, actions, hint }: FallbackLayoutProps) {
  return (
    <main className="flex h-full flex-col items-center overflow-y-auto px-4 pt-8 pb-6 sm:px-6 md:px-8 md:pt-16 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb">
      <section
        aria-labelledby="fallback-title"
        className="w-full max-w-lg">
        <Image
          src={image}
          alt=""
          aria-hidden="true"
          loading="eager"
          className="h-44 w-full rounded-lg object-cover sm:h-60"
        />
        <div className="mt-6 flex w-full flex-col items-center gap-3 text-center">
          {eyebrow && <p className="max-w-full truncate text-xs font-medium uppercase tracking-wide text-primary-light sm:text-sm" title={eyebrow}>{eyebrow}</p>}
          <h1
            id="fallback-title"
            className="text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
            {title}
          </h1>
          <p className="max-w-md text-sm text-muted-foreground sm:text-base">{description}</p>
          <div className="mt-2 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row">{actions}</div>
          {hint && <p className="text-xs text-muted-foreground sm:text-sm">{hint}</p>}
        </div>
      </section>
    </main>
  );
}
