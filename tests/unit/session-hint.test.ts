/**
 * serializeSessionHint is the raw `Set-Cookie` value `src/proxy.ts` appends to
 * Neon Auth's response. It has to be exact: the browser only replaces the
 * cookie `getCurrentProfile` set (and `clearSessionHint` only removes it) when
 * name, Path and the rest line up, and the proxy cannot fall back to
 * `response.cookies` without dropping Neon's own session cookies.
 *
 * `Secure` depends on NODE_ENV at module load, so the production shape is
 * checked in a child process started with NODE_ENV=production.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { describe, it } from "node:test";

import {
  SESSION_HINT_COOKIE,
  SESSION_HINT_OPTIONS,
  serializeSessionHint,
} from "@/lib/auth/session-hint";

const SET = "dm_signed_in=1; Path=/; Max-Age=2592000; SameSite=Lax";
const CLEAR = "dm_signed_in=; Path=/; Max-Age=0; SameSite=Lax";

/** Both header values as a fresh process with this NODE_ENV computes them. */
function serializeUnder(nodeEnv: "production" | "development"): [string, string] {
  const script =
    'import("./src/lib/auth/session-hint.ts").then((m) => ' +
    "console.log(JSON.stringify([m.serializeSessionHint(true), m.serializeSessionHint(false)])))";
  const out = execFileSync(process.execPath, ["--import", "tsx", "-e", script], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: nodeEnv },
    encoding: "utf8",
  });
  return JSON.parse(out.trim()) as [string, string];
}

describe("serializeSessionHint", () => {
  it("sets the hint for 30 days and clears it with Max-Age=0", () => {
    const secure = SESSION_HINT_OPTIONS.secure ? "; Secure" : "";
    assert.equal(serializeSessionHint(true), SET + secure);
    assert.equal(serializeSessionHint(false), CLEAR + secure);
  });

  it("is never HttpOnly, because the browser has to read it", () => {
    for (const signedIn of [true, false]) {
      const header = serializeSessionHint(signedIn);
      assert.ok(header.startsWith(`${SESSION_HINT_COOKIE}=`));
      assert.doesNotMatch(header, /httponly/i);
    }
  });

  it("adds Secure in production and nothing else", () => {
    assert.deepEqual(serializeUnder("production"), [`${SET}; Secure`, `${CLEAR}; Secure`]);
  });

  it("is not Secure outside production, so a plain-HTTP dev server works", () => {
    assert.deepEqual(serializeUnder("development"), [SET, CLEAR]);
  });
});
