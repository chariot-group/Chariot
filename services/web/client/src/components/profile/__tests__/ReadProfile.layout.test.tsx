import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ReadProfile from "@/components/profile/ReadProfile";
import {
  profileActionButtonClassName,
  profileActionsClassName,
  profileFieldLabelClassName,
  profileHeaderClassName,
  profileNameFieldsClassName,
  profileUsernameClassName,
} from "@/components/profile/profileCardLayout";
import { MEDIA_AVATAR_ROUNDED_CLASS, MEDIA_AVATAR_SIZE_CLASS } from "@/utils/media.utils";
import type { User } from "@/types/user";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/components/media/MediaAvatar", () => ({ MediaAvatar: () => <span data-testid="avatar" /> }));

const user = {
  keycloakId: "kc-1",
  username: "jackie_raynor",
  firstName: "Ernie",
  lastName: "Abernathy",
  email: "rylan_upton3@example.test",
} as User;

const renderRead = (u: User | null) =>
  renderToStaticMarkup(
    <ReadProfile
      user={u}
      onEdit={() => {}}
    />,
  );

/** @see docs/design.md §6.4, FR-media-avatars (profile photo exception) */
describe("Profile identity card layout", () => {
  it("nominal: the card is a single column on every breakpoint, with avatar then identity in a header row", () => {
    const html = renderRead(user);

    expect(html).toMatch(/data-slot="card" class="[^"]*flex-col gap-4 sm:gap-6 overflow-hidden"/);
    expect(html).not.toContain("sm:flex-row overflow-hidden");
    const header = html.indexOf(`class="${profileHeaderClassName}"`);
    const avatar = html.indexOf('data-testid="avatar"');
    const username = html.indexOf(`class="${profileUsernameClassName}"`);
    expect(header).toBeGreaterThan(-1);
    expect(header).toBeLessThan(avatar);
    expect(avatar).toBeLessThan(username);
    expect(html.match(/>jackie_raynor</g)).toHaveLength(1);
    expect(html).toContain(profileActionButtonClassName);
  });

  it("nominal: the profile avatar is round and square, the sheet avatar keeps 4:5", () => {
    expect(MEDIA_AVATAR_SIZE_CLASS.profile).toContain("aspect-square");
    expect(MEDIA_AVATAR_ROUNDED_CLASS.profile).toBe("rounded-full");
    expect(MEDIA_AVATAR_SIZE_CLASS.sheet).toContain("aspect-[4/5]");
  });

  it("nominal: edit fields use visible labels and an even spacing scale", () => {
    expect(profileFieldLabelClassName).not.toContain("sr-only");
    expect(profileNameFieldsClassName).toContain("gap-4");
  });

  it("edge: edit actions keep the primary action first on mobile and never overflow", () => {
    expect(profileActionsClassName).toContain("flex-col-reverse");
    expect(profileActionsClassName).toContain("sm:flex-row");
    expect(profileActionButtonClassName).toBe("w-full sm:w-auto");
  });

  it("failure: a missing user still renders the card without crashing", () => {
    const html = renderRead(null);

    expect(html).toContain(`class="${profileHeaderClassName}"`);
    expect(html).not.toContain('data-testid="avatar"');
  });
});
