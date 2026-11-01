/**
 * Test helpers reading static markup of the bento tabs.
 * @see FR-character-general-bento-layout, FR-character-battle-bento-layout
 */
const VOID_TAGS = new Set(["img", "input", "br", "hr", "meta", "link", "source", "area", "col", "wbr"]);

/** Opening tags of the direct children of the first element carrying `rootMarker`. */
export const directChildren = (html: string, rootMarker: string) => {
  const start = html.indexOf(rootMarker);
  const tagRe = /<(\/?)([a-zA-Z0-9]+)([^>]*?)(\/?)>/g;
  tagRe.lastIndex = html.lastIndexOf("<", start);
  const children: string[] = [];
  let depth = 0;
  for (let m = tagRe.exec(html); m; m = tagRe.exec(html)) {
    const [tag, closing, name, , selfClosing] = m;
    if (closing) {
      depth--;
      if (depth === 0) break;
      continue;
    }
    if (depth === 1) children.push(tag);
    if (!selfClosing && !VOID_TAGS.has(name.toLowerCase())) depth++;
  }
  return children;
};

export const ids = (html: string) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
export const labelledBy = (html: string) => [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map((m) => m[1]);
