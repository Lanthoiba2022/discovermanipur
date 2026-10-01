/**
 * Where community photo bytes live. Server-only: it reads the storage token.
 *
 * Photos are never stored in Postgres (it bloats the database and its
 * backups); the database keeps only the storage key. Two backends:
 *
 * - **Vercel Blob**, private access, when `BLOB_READ_WRITE_TOKEN` is set. Private
 *   blobs have no public URL: every read goes through
 *   `/api/community/photos/[id]`, which checks the place is visible to the
 *   viewer first. That is what keeps photos of unverified places unseen.
 * - **The local disk**, in development only, under `.data/community-photos/`
 *   (git-ignored), so a fresh clone can try uploads with no account.
 *
 * A production build without a token has no store at all and uploads are
 * switched off, rather than silently writing to a disk that a serverless
 * deployment throws away.
 *
 * Keys are always built by the server from a generated id (`photoKeys`), never
 * from anything the client sent.
 */

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { del, get, put } from "@vercel/blob";

export interface StoredObject {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  size: number;
}

export interface PhotoStore {
  readonly kind: "blob" | "filesystem";
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(keys: string[]): Promise<void>;
}

/** The two objects one photo is stored as. */
export function photoKeys(photoId: string) {
  return {
    full: `community/${photoId}/full.webp`,
    thumb: `community/${photoId}/thumb.webp`,
  };
}

const KEY_SHAPE = /^community\/[0-9a-f-]{36}\/(full|thumb)\.webp$/;

function assertKey(key: string) {
  if (!KEY_SHAPE.test(key)) throw new Error("Refusing an unexpected storage key");
}

const blobStore: PhotoStore = {
  kind: "blob",
  async put(key, body, contentType) {
    assertKey(key);
    await put(key, body, {
      access: "private",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: false,
    });
  },
  async get(key) {
    assertKey(key);
    const result = await get(key, { access: "private" });
    if (!result || result.statusCode !== 200) return null;
    return { body: result.stream, contentType: result.blob.contentType, size: result.blob.size };
  },
  async delete(keys) {
    keys.forEach(assertKey);
    if (keys.length > 0) await del(keys);
  },
};

const DISK_ROOT = path.join(process.cwd(), ".data", "community-photos");

function diskPath(key: string) {
  assertKey(key);
  const resolved = path.resolve(DISK_ROOT, key);
  if (!resolved.startsWith(DISK_ROOT + path.sep)) throw new Error("Refusing a path outside the store");
  return resolved;
}

const diskStore: PhotoStore = {
  kind: "filesystem",
  async put(key, body) {
    const file = diskPath(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body, { flag: "wx" });
  },
  async get(key) {
    try {
      const bytes = await readFile(diskPath(key));
      return {
        body: new Blob([new Uint8Array(bytes)]).stream(),
        contentType: "image/webp",
        size: bytes.byteLength,
      };
    } catch {
      return null;
    }
  },
  async delete(keys) {
    await Promise.all(keys.map((key) => rm(diskPath(key), { force: true })));
  },
};

const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());

/** The configured store, or `null` when uploads are switched off on this deployment. */
export function getPhotoStore(): PhotoStore | null {
  if (hasBlobToken) return blobStore;
  if (process.env.NODE_ENV !== "production") return diskStore;
  return null;
}

export const isPhotoStorageConfigured = hasBlobToken || process.env.NODE_ENV !== "production";
