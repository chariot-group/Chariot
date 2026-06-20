import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProfileSection from "@/components/profile/ProfileSection";

describe("ProfileSection", () => {
  it("renders the section title and links children to the heading", () => {
    const html = renderToStaticMarkup(
      <ProfileSection
        id="profile-section-test"
        title="Mon profil">
        <p>Contenu</p>
      </ProfileSection>,
    );

    expect(html).toContain('id="profile-section-test"');
    expect(html).toContain("Mon profil");
    expect(html).toContain('aria-labelledby="profile-section-test"');
    expect(html).toContain("Contenu");
  });

  it("renders a decorative separator line", () => {
    const html = renderToStaticMarkup(
      <ProfileSection
        id="profile-section-separator"
        title="Sécurité">
        <div />
      </ProfileSection>,
    );

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("bg-white/20");
  });

  it("merges optional layout classes", () => {
    const html = renderToStaticMarkup(
      <ProfileSection
        id="profile-section-class"
        title="Tokens"
        className="mt-4">
        <div />
      </ProfileSection>,
    );

    expect(html).toContain("mt-4");
  });
});
