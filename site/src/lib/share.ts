// Sharing a configuration two ways (spec §6.3):
//   - URL: compact, carries selection + params only (omits bulky text overrides)
//   - preset .json: lossless, carries everything including overrides and org metadata

import type { PersistShape } from './store.svelte';

/** The subset embedded in a shareable URL. */
interface UrlShape {
  s: string[]; // selected keys
  p: Record<string, Record<string, string>>; // params
  o?: { n?: string; pre?: string; f?: string }; // org (no large overrides)
}

function encodeBase64Url(s: string): string {
  const b64 = btoa(unescape(encodeURIComponent(s)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(b64)));
}

/** Build a shareable URL (without overrides) for the current configuration. */
export function toShareUrl(data: PersistShape, baseUrl: string): string {
  const payload: UrlShape = { s: data.selected, p: data.params };
  if (data.org.name || data.org.preamble || data.org.footer) {
    payload.o = { n: data.org.name, pre: data.org.preamble, f: data.org.footer };
  }
  const encoded = encodeBase64Url(JSON.stringify(payload));
  const url = new URL(baseUrl);
  url.hash = `c=${encoded}`;
  return url.toString();
}

/** Parse a configuration from a URL hash, or null if none/invalid. */
export function fromUrlHash(hash: string): Partial<PersistShape> | null {
  const m = /[#&]c=([^&]+)/.exec(hash);
  if (!m) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(m[1])) as UrlShape;
    return {
      selected: payload.s ?? [],
      params: payload.p ?? {},
      org: {
        name: payload.o?.n ?? '',
        preamble: payload.o?.pre ?? '',
        footer: payload.o?.f ?? '',
      },
    };
  } catch {
    return null;
  }
}

/** Serialize a lossless preset (everything) for download/import. */
export function toPreset(data: PersistShape): string {
  return JSON.stringify({ kind: 'standards-builder-preset', version: 1, ...data }, null, 2) + '\n';
}

/** Parse a preset file's text into a config, or null if invalid. */
export function fromPreset(text: string): Partial<PersistShape> | null {
  try {
    const obj = JSON.parse(text);
    if (obj.kind !== 'standards-builder-preset') return null;
    return {
      selected: obj.selected ?? [],
      overrides: obj.overrides ?? {},
      params: obj.params ?? {},
      org: obj.org ?? { name: '', preamble: '', footer: '' },
    };
  } catch {
    return null;
  }
}
