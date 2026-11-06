#!/usr/bin/env bash
# Query docs/functional-rules.md without reading the whole file.
#
#   fr.sh list                 slug + title of every rule, with line number
#   fr.sh show <slug>          full body of one rule
#   fr.sh search <regex>       rules whose body matches (case-insensitive), with hit count
#   fr.sh refs <path-fragment> rules that list a file under **References**
#   fr.sh check                lint: duplicate slugs, numeric IDs, rules without **Tests**
set -euo pipefail

root="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
file="$root/docs/functional-rules.md"
cmd="${1:-list}"
arg="${2:-}"

case "$cmd" in
  list)
    grep -n '^## FR-' "$file" | sed -E 's/^([0-9]+):## /\1  /'
    ;;
  show)
    [ -n "$arg" ] || { echo "usage: fr.sh show <slug>" >&2; exit 2; }
    awk -v slug="$arg" '
      /^## FR-/ { on = (index($0, "## " slug ":") == 1 || index($0, "## " slug " :") == 1) }
      on { print }
    ' "$file"
    ;;
  search)
    [ -n "$arg" ] || { echo "usage: fr.sh search <regex>" >&2; exit 2; }
    awk -v re="$arg" '
      BEGIN { IGNORECASE = 1; re = tolower(re) }
      /^## FR-/ { if (title && hits) printf "%3d  %s\n", hits, title; title = substr($0, 4); hits = 0; next }
      tolower($0) ~ re { hits++ }
      END { if (title && hits) printf "%3d  %s\n", hits, title }
    ' "$file" | sort -rn
    ;;
  refs)
    [ -n "$arg" ] || { echo "usage: fr.sh refs <path-fragment>" >&2; exit 2; }
    awk -v frag="$arg" '
      /^## FR-/ { title = substr($0, 4); inref = 0; next }
      /^\*\*References\*\*/ { inref = 1; next }
      /^\*\*/ { inref = 0 }
      inref && index($0, frag) && !seen[title]++ { print title }
    ' "$file"
    ;;
  check)
    status=0
    dups="$(grep -oE '^## FR-[a-z0-9-]+' "$file" | sort | uniq -d)"
    [ -z "$dups" ] || { echo "Duplicate slugs:"; echo "$dups"; status=1; }
    numeric="$(grep -nE '^## FR-[0-9]+' "$file" || true)"
    [ -z "$numeric" ] || { echo "Numeric IDs:"; echo "$numeric"; status=1; }
    missing="$(awk '
      /^## FR-/ { if (title && !tests) print title; title = substr($0, 4); tests = 0; next }
      /^\*\*Tests\*\*/ { tests = 1 }
      END { if (title && !tests) print title }
    ' "$file")"
    [ -z "$missing" ] || { echo "Rules without **Tests** (warning):"; echo "$missing"; }
    echo "$(grep -c '^## FR-' "$file") rules checked."
    exit $status
    ;;
  *)
    echo "unknown command: $cmd (list | show | search | refs | check)" >&2
    exit 2
    ;;
esac
