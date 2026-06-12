// Turn a file map into a downloadable zip (browser-side, via JSZip).

import JSZip from 'jszip';
import type { FileMap } from './build';

export async function zipFileMap(map: FileMap): Promise<Blob> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(map)) {
    zip.file(path, content);
  }
  return zip.generateAsync({ type: 'blob' });
}

/** Trigger a browser download of a blob under the given filename. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Build a safe zip filename from an optional org name. */
export function zipFilename(orgName: string): string {
  const slug = orgName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `${slug}-standards.zip` : 'standards.zip';
}
