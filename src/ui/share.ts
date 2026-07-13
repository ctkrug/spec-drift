/**
 * Encodes a spec pair into a URL hash fragment so a computed report can be
 * shared without a backend: the fragment carries the input text itself,
 * and the receiving page re-runs the same parse/diff pipeline locally.
 * Kept DOM-free (no `location`/`history` access) so it's testable without
 * a browser; `app.ts` is the only module that touches `window.location`.
 */

/**
 * Conservative cap on the encoded fragment length. Real-world safe URL
 * length varies by browser/proxy (historically as low as ~2000 chars for
 * old IE, commonly ~8000 today); 6000 leaves headroom for the origin,
 * path, and base64 overhead (~33%) while still fitting most small-to-
 * medium spec pairs.
 */
export const MAX_SHARE_FRAGMENT_LENGTH = 6000;

export interface ShareState {
  oldText: string;
  newText: string;
}

/**
 * Encodes both spec texts into a base64url fragment. Returns null instead
 * of a truncated/broken link when the encoded result would exceed
 * `MAX_SHARE_FRAGMENT_LENGTH`, so the caller can show an explicit message.
 */
export function encodeShareFragment(oldText: string, newText: string): string | null {
  const encoded = toBase64Url(JSON.stringify({ o: oldText, n: newText }));
  return encoded.length > MAX_SHARE_FRAGMENT_LENGTH ? null : encoded;
}

/**
 * Decodes a share fragment back into the original spec texts. Returns null
 * for anything that isn't a validly-shaped fragment (empty, corrupt
 * base64, or JSON missing the expected string fields) rather than
 * throwing, so a mangled/foreign URL hash degrades to "no shared state"
 * instead of crashing the page on load.
 */
export function decodeShareFragment(fragment: string): ShareState | null {
  if (!fragment) return null;

  try {
    const parsed: unknown = JSON.parse(fromBase64Url(fragment));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).o !== "string" ||
      typeof (parsed as Record<string, unknown>).n !== "string"
    ) {
      return null;
    }
    const { o, n } = parsed as { o: string; n: string };
    return { oldText: o, newText: n };
  } catch {
    return null;
  }
}

function toBase64Url(text: string): string {
  const base64 = btoa(unescape(encodeURIComponent(text)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): string {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return decodeURIComponent(escape(atob(padded)));
}
