import "server-only";
import { del } from "@vercel/blob";

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/**
 * Confirma que URL pertence ao Vercel Blob (evita apagar URLs externos
 * legacy do Drive ou Instagram que ainda possam estar em produtos).
 */
export function isManagedBlobUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * Apaga blob best-effort. Nunca lança — falha de cleanup não pode
 * quebrar fluxo principal (save/delete de produto).
 */
export async function deleteManagedBlob(url: string): Promise<void> {
  if (!isManagedBlobUrl(url)) return;
  try {
    await del(url);
  } catch (err) {
    console.error("deleteManagedBlob failed:", url, err);
  }
}

/**
 * Apaga vários blobs em paralelo, best-effort.
 */
export async function deleteManagedBlobs(urls: string[]): Promise<void> {
  const managed = urls.filter(isManagedBlobUrl);
  if (managed.length === 0) return;
  await Promise.all(managed.map(deleteManagedBlob));
}
