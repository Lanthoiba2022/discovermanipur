/**
 * isAllowedSignupEmail is shared by the sign-up form and the Neon Auth
 * `user.before_create` webhook, which is the real gate. These cases pin the
 * domain match: exact, case-insensitive, and taken after the LAST "@".
 * Addresses are placeholders, never real ones.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ALLOWED_SIGNUP_DOMAINS, isAllowedSignupEmail } from "@/lib/auth/email-policy";

describe("isAllowedSignupEmail", () => {
  it("allows only gmail.com today", () => {
    assert.deepEqual([...ALLOWED_SIGNUP_DOMAINS], ["gmail.com"]);
  });

  it("accepts a gmail.com address, ignoring case and surrounding spaces", () => {
    assert.equal(isAllowedSignupEmail("someone@gmail.com"), true);
    assert.equal(isAllowedSignupEmail("Someone@GMAIL.COM"), true);
    assert.equal(isAllowedSignupEmail("  someone@gmail.com  "), true);
  });

  it("refuses other domains, including look-alikes and subdomains", () => {
    assert.equal(isAllowedSignupEmail("someone@example.com"), false);
    assert.equal(isAllowedSignupEmail("someone@gmail.com.example"), false);
    assert.equal(isAllowedSignupEmail("someone@mail.gmail.com"), false);
    assert.equal(isAllowedSignupEmail("someone@googlemail.com"), false);
  });

  it("judges the domain after the last @", () => {
    assert.equal(isAllowedSignupEmail("someone@example.com@gmail.com"), true);
    assert.equal(isAllowedSignupEmail("someone@gmail.com@example.com"), false);
  });

  it("refuses input with no local part or no @", () => {
    assert.equal(isAllowedSignupEmail("@gmail.com"), false);
    assert.equal(isAllowedSignupEmail("gmail.com"), false);
    assert.equal(isAllowedSignupEmail(""), false);
    assert.equal(isAllowedSignupEmail("someone@"), false);
  });
});
