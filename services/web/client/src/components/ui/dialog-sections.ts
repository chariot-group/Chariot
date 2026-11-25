/**
 * Sectioned dialog layout (docs/design.md 5.7, codex / community library dialogs):
 * header and footer split from the body by the structural layout line (`border-frame`).
 * Apply `DIALOG_SECTIONED_CONTENT_CLASS` on `DialogContent`, then one class per zone.
 * The header holds the title only: descriptions and hints are the first element of the body.
 */
export const DIALOG_SECTIONED_CONTENT_CLASS = "gap-0 p-0";

export const DIALOG_SECTION_HEADER_CLASS = "shrink-0 border-b border-frame px-6 pb-4 pt-6 pr-12";

export const DIALOG_SECTION_TITLE_CLASS = "text-xl";

export const DIALOG_SECTION_BODY_CLASS = "px-6 py-4";

export const DIALOG_SECTION_FOOTER_CLASS = "shrink-0 border-t border-frame px-6 py-4";
