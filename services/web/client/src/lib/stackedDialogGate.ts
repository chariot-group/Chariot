const FOREIGN_OPEN_DIALOG_SELECTOR = '[data-slot="dialog-content"][data-state="open"]:not([data-own-dialog])';

/** True when a dialog other than the one marked `data-own-dialog` is currently open. */
export function hasForeignDialogOpen(root: Pick<ParentNode, "querySelector">): boolean {
  return root.querySelector(FOREIGN_OPEN_DIALOG_SELECTOR) !== null;
}

/**
 * Radix dismiss listeners run one after the other for a single Escape / outside press. When the dialog
 * stacked on top closes first, the one below then becomes the topmost layer and closes too.
 * Snapshotting at the start of the gesture lets the lower dialog ignore it.
 */
export function createStackedDialogGate(root: Pick<ParentNode, "querySelector">) {
  let foreignOpenAtGestureStart = false;

  return {
    snapshot() {
      foreignOpenAtGestureStart = hasForeignDialogOpen(root);
    },
    shouldIgnoreDismiss() {
      return foreignOpenAtGestureStart || hasForeignDialogOpen(root);
    },
  };
}
