/**
 * safeRedirectPath is the open-redirect defence for `/auth?next=...`: the
 * value comes from the query string, so every case here is something an
 * attacker can type. A regression would let a sign-in link bounce a fresh
 * session to another origin, so each known bypass trick has its own case.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { safeRedirectPath } from "@/lib/security/redirect";

describe("safeRedirectPath", () => {
  it("keeps a same-site path with its query and hash", () => {
    assert.equal(safeRedirectPath("/homestays"), "/homestays");
    assert.equal(safeRedirectPath("/homestays/loktak?guests=2#book"), "/homestays/loktak?guests=2#book");
    assert.equal(safeRedirectPath("/"), "/");
  });

  it("takes the first value when the query string repeats the key", () => {
    assert.equal(safeRedirectPath(["/tours", "https://evil.example"]), "/tours");
  });

  it("falls back to /account, or to the given fallback, for missing or odd input", () => {
    assert.equal(safeRedirectPath(undefined), "/account");
    assert.equal(safeRedirectPath(null), "/account");
    assert.equal(safeRedirectPath(42), "/account");
    assert.equal(safeRedirectPath(""), "/account");
    assert.equal(safeRedirectPath([]), "/account");
    assert.equal(safeRedirectPath(undefined, "/"), "/");
    assert.equal(safeRedirectPath("https://evil.example", "/explore"), "/explore");
  });

  it("refuses anything over 2048 characters", () => {
    const long = `/${"a".repeat(2048)}`;
    assert.equal(safeRedirectPath(long), "/account");
    assert.equal(safeRedirectPath(`/${"a".repeat(2047)}`), `/${"a".repeat(2047)}`);
  });

  it("refuses absolute and scheme URLs", () => {
    assert.equal(safeRedirectPath("https://evil.example/account"), "/account");
    assert.equal(safeRedirectPath("javascript:alert(1)"), "/account");
    assert.equal(safeRedirectPath("account"), "/account");
  });

  it("refuses protocol-relative paths, including the backslash spelling", () => {
    assert.equal(safeRedirectPath("//evil.example"), "/account");
    assert.equal(safeRedirectPath("/\\evil.example"), "/account");
    // A backslash anywhere is refused, not only in second position.
    assert.equal(safeRedirectPath("/homestays\\evil"), "/account");
  });

  it("refuses control characters that browsers strip before resolving", () => {
    assert.equal(safeRedirectPath("/\t/evil.example"), "/account");
    assert.equal(safeRedirectPath("/\n/evil.example"), "/account");
    assert.equal(safeRedirectPath("/\r/evil.example"), "/account");
    assert.equal(safeRedirectPath("/homestays\u0000"), "/account");
    assert.equal(safeRedirectPath("/homestays\u007f"), "/account");
  });

  it("refuses dot segments that collapse into a fresh //", () => {
    assert.equal(safeRedirectPath("/..//evil.example"), "/account");
    assert.equal(safeRedirectPath("/a/../..//evil.example"), "/account");
  });

  it("returns the resolved path when dot segments stay on the site", () => {
    assert.equal(safeRedirectPath("/a/./b/../c"), "/a/c");
  });

  it("refuses /auth, /api and /_next and anything under them", () => {
    for (const path of ["/auth", "/auth/sign-up", "/api", "/api/chat", "/_next", "/_next/static/x.js"]) {
      assert.equal(safeRedirectPath(path), "/account", path);
    }
    // Resolved first, so a dot segment cannot smuggle one in.
    assert.equal(safeRedirectPath("/explore/../auth"), "/account");
  });

  it("only refuses whole segments, not prefixes", () => {
    assert.equal(safeRedirectPath("/authors"), "/authors");
    assert.equal(safeRedirectPath("/apiary"), "/apiary");
  });
});
