import { useEffect, useState } from 'react';
import { supabase, supabaseUrl } from '../config/supabase';

/**
 * Signed URLs for Supabase Storage (FIX-RG-44).
 *
 * Rows store full public URLs (/storage/v1/object/public/<bucket>/<path>).
 * Every read goes through here so the app keeps working once the buckets
 * are private: the stored URL is turned back into bucket + path and
 * swapped for a short-lived signed URL. Non-storage URLs (blob:, data:,
 * external links) pass through unchanged. If signing fails, the original
 * URL is returned so nothing breaks while the buckets are still public.
 */

const SIGNED_TTL_SECONDS = 6 * 60 * 60;
const REFRESH_MARGIN_MS = 10 * 60 * 1000;
const STORAGE_PREFIX = `${supabaseUrl}/storage/v1/object/`;

const cache = new Map(); // url -> { signed, expiresAt }
const pending = new Map(); // bucket -> Map(path -> [{ url, resolve }])
let flushTimer = null;

// Returns { bucket, path } for a URL in this project's storage, else null
export const parseStorageUrl = (url) => {
  if (typeof url !== 'string' || !url.startsWith(STORAGE_PREFIX)) return null;
  const rest = url.slice(STORAGE_PREFIX.length).split('?')[0];
  const match = rest.match(/^(?:public|sign|authenticated)\/([^/]+)\/(.+)$/);
  if (!match) return null;
  let path = match[2];
  try { path = decodeURIComponent(path); } catch (e) { /* keep raw path */ }
  return { bucket: match[1], path };
};

const getCached = (url) => {
  const hit = cache.get(url);
  if (hit && hit.expiresAt - REFRESH_MARGIN_MS > Date.now()) return hit.signed;
  return null;
};

const flush = async () => {
  flushTimer = null;
  const batches = Array.from(pending.entries());
  pending.clear();

  await Promise.all(batches.map(async ([bucket, byPath]) => {
    const paths = Array.from(byPath.keys());
    let results = [];
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrls(paths, SIGNED_TTL_SECONDS);
      if (!error && data) results = data;
    } catch (e) {
      console.warn('Signed URL request failed:', e);
    }

    const signedByPath = new Map(
      results.filter(r => r.signedUrl && !r.error).map(r => [r.path, r.signedUrl])
    );
    const expiresAt = Date.now() + SIGNED_TTL_SECONDS * 1000;

    byPath.forEach((waiters, path) => {
      const signed = signedByPath.get(path);
      waiters.forEach(({ url, resolve }) => {
        if (signed) {
          cache.set(url, { signed, expiresAt });
          resolve(signed);
        } else {
          resolve(url);
        }
      });
    });
  }));
};

// Resolve any stored URL to something the browser can load right now
export const resolveStorageUrl = (url) => {
  const parsed = parseStorageUrl(url);
  if (!parsed) return Promise.resolve(url);

  const cached = getCached(url);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    if (!pending.has(parsed.bucket)) pending.set(parsed.bucket, new Map());
    const byPath = pending.get(parsed.bucket);
    if (!byPath.has(parsed.path)) byPath.set(parsed.path, []);
    byPath.get(parsed.path).push({ url, resolve });
    if (!flushTimer) flushTimer = setTimeout(flush, 0);
  });
};

// Synchronous lookup: signed URL if already cached, null if it still needs signing
export const getResolvedStorageUrl = (url) => {
  if (!parseStorageUrl(url)) return url;
  return getCached(url);
};

export const useSignedUrl = (url) => {
  const [resolved, setResolved] = useState(() => getResolvedStorageUrl(url));

  useEffect(() => {
    let active = true;
    const now = getResolvedStorageUrl(url);
    setResolved(now);
    if (now === null) {
      resolveStorageUrl(url).then(next => {
        if (active) setResolved(next);
      });
    }
    return () => { active = false; };
  }, [url]);

  return resolved;
};
