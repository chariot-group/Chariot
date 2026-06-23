import { describe, expect, it } from "vitest";

/** Mirrors UpdateProfile pending-change / save-disabled logic. */
function isProfileSaveDisabled({
  isBusy,
  isDirty,
  pendingAvatarFile,
  pendingAvatarRemove,
}: {
  isBusy: boolean;
  isDirty: boolean;
  pendingAvatarFile: File | null;
  pendingAvatarRemove: boolean;
}) {
  const isAvatarDirty = pendingAvatarFile !== null || pendingAvatarRemove;
  const hasPendingChanges = isDirty || isAvatarDirty;
  return isBusy || !hasPendingChanges;
}

describe("UpdateProfile save button state", () => {
  it("nominal: enables save when only avatar file is pending", () => {
    const disabled = isProfileSaveDisabled({
      isBusy: false,
      isDirty: false,
      pendingAvatarFile: new File(["x"], "avatar.png", { type: "image/png" }),
      pendingAvatarRemove: false,
    });

    expect(disabled).toBe(false);
  });

  it("nominal: enables save when avatar removal is pending", () => {
    const disabled = isProfileSaveDisabled({
      isBusy: false,
      isDirty: false,
      pendingAvatarFile: null,
      pendingAvatarRemove: true,
    });

    expect(disabled).toBe(false);
  });

  it("edge: keeps save disabled when form and avatar are unchanged", () => {
    const disabled = isProfileSaveDisabled({
      isBusy: false,
      isDirty: false,
      pendingAvatarFile: null,
      pendingAvatarRemove: false,
    });

    expect(disabled).toBe(true);
  });

  it("failure: keeps save disabled while busy even with pending avatar", () => {
    const disabled = isProfileSaveDisabled({
      isBusy: true,
      isDirty: false,
      pendingAvatarFile: new File(["x"], "avatar.png", { type: "image/png" }),
      pendingAvatarRemove: false,
    });

    expect(disabled).toBe(true);
  });
});
