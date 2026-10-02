import type { RawSearchParams } from "@/components/filters/params";

/**
 * Turn a query string into the `RawSearchParams` shape a page's `searchParams`
 * prop used to have, so the existing `parse*Filters` functions run unchanged
 * in the browser.
 *
 * Same conventions as Next's own `searchParams`: a key that appears once maps
 * to its string, a repeated key maps to an array of every value in order, and
 * `+` and percent escapes are decoded (both come from `URLSearchParams`). The
 * parse helpers already take the first value of an array, so a hand-edited
 * `?district=a&district=b` resolves exactly as it did on the server.
 *
 * Pure and server-safe: no `"use client"`, no browser globals.
 */
export function searchToRawParams(search: string): RawSearchParams {
  const params = new URLSearchParams(search);
  const out: RawSearchParams = {};
  for (const [key, value] of params) {
    const existing = out[key];
    if (existing === undefined) out[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else out[key] = [existing, value];
  }
  return out;
}
