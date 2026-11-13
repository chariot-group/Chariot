/**
 * Character sheet / form tab ↔ URL (`?tab=`), without a router navigation.
 *
 * `router.replace("?tab=…")` makes the App Router fetch a server payload for the same page before the tab
 * changes, which is slow on 3G. The native History API is enough: Next keeps `useSearchParams` in sync with it.
 * @see FR-character-detail-view
 */

interface LocationLike {
  pathname: string;
  search: string;
  hash: string;
}

/** Same URL with `tab` set; other parameters and the hash are kept. */
export function buildCharacterTabUrl(location: LocationLike, tab: string): string {
  const params = new URLSearchParams(location.search);
  params.set("tab", tab);
  return `${location.pathname}?${params.toString()}${location.hash}`;
}

/** Switches the `tab` URL parameter in place: no navigation, no network request, no new history entry. */
export function replaceCharacterTabInUrl(tab: string): void {
  if (typeof window === "undefined") return;
  // `null`, not `history.state`: Next treats a state carrying its own markers (`__NA`) as an internal call and
  // then skips syncing `useSearchParams`, so the tab would not change. Next re-adds its tree itself.
  window.history.replaceState(null, "", buildCharacterTabUrl(window.location, tab));
}
