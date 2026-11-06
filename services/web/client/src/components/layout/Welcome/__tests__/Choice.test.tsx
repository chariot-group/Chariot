import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import fr from "@/../messages/fr.json";
import en from "@/../messages/en.json";
import es from "@/../messages/es.json";

vi.mock("use-intl", () => ({
  useTranslations: () => {
    const t = (key: string) => key;
    t.raw = (key: string) => key;
    return t;
  },
}));
vi.mock("next/image", () => ({ default: () => <span /> }));
vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));

import Choice from "@/components/layout/Welcome/Choice";

const image = { src: "", width: 1, height: 1 };

describe("Choice (FR-welcome-onboarding-fallbacks)", () => {
  it("nominal: description is linked to the article via aria-describedby", () => {
    const html = renderToStaticMarkup(<Choice image={image} realm="campaign" onClick={() => {}} />);
    expect(html).toContain('aria-describedby="choice-description-campaign"');
    expect(html).toContain('id="choice-description-campaign"');
    expect(html).toContain("campaign.description");
  });

  it("edge: link variant renders an anchor to the target", () => {
    const html = renderToStaticMarkup(<Choice image={image} realm="character" link="/characters/new/players" />);
    expect(html).toContain('href="/characters/new/players"');
  });

  it("guard: every locale describes the two welcome options and the fallback pages", () => {
    for (const messages of [fr, en, es]) {
      expect(messages.welcome.campaign.description).toBeTruthy();
      expect(messages.welcome.character.description).toBeTruthy();
      expect(messages.playerSpaceFallback.title).toBeTruthy();
      expect(messages.campaignFallback.createGroup).toBeTruthy();
    }
  });
});
