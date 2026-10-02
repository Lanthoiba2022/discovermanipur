/**
 * formatINR renders every price on the site. It uses Indian digit grouping
 * (lakh, crore) and no paise. The compact form is checked by shape only,
 * because its exact rounding comes from the ICU data bundled with Node.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatINR } from "@/lib/utils";

describe("formatINR", () => {
  it("formats whole rupees with Indian grouping", () => {
    assert.equal(formatINR(0), "₹0");
    assert.equal(formatINR(1500), "₹1,500");
    assert.equal(formatINR(150000), "₹1,50,000");
    assert.equal(formatINR(12345678), "₹1,23,45,678");
  });

  it("rounds away paise", () => {
    assert.equal(formatINR(1234.56), "₹1,235");
    assert.equal(formatINR(999.4), "₹999");
  });

  it("puts the sign before the symbol for negative amounts", () => {
    assert.equal(formatINR(-500), "-₹500");
  });

  it("uses lakh and crore suffixes when compact", () => {
    assert.match(formatINR(150000, { compact: true }), /^₹\d+L$/);
    assert.match(formatINR(12000000, { compact: true }), /^₹\d+Cr$/);
    assert.notEqual(formatINR(150000, { compact: true }), formatINR(150000));
  });
});
