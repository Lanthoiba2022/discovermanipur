/**
 * Booking prices are computed on the server (`src/lib/booking/server.ts`
 * re-prices every request from the catalogue), and the same functions show the
 * guest a quote in the browser first. A silent change here would make the two
 * disagree, or change what a host is asked to honour, so each fee, discount and
 * day-counting rule is pinned with literal rupee figures.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EXPERIENCE_FEE_RATE,
  SERVICE_FEE_RATE,
  TOUR_GROUP_DISCOUNT_RATE,
  TOUR_GROUP_MIN,
  quoteExperience,
  quoteStay,
  quoteTour,
  quoteTransportByDay,
  toISODate,
  transportDays,
} from "@/lib/booking/pricing";

describe("rates", () => {
  it("keeps the published fee and discount rates", () => {
    assert.equal(SERVICE_FEE_RATE, 0.08);
    assert.equal(EXPERIENCE_FEE_RATE, 0.05);
    assert.equal(TOUR_GROUP_MIN, 4);
    assert.equal(TOUR_GROUP_DISCOUNT_RATE, 0.05);
  });
});

describe("quoteStay", () => {
  it("charges nights times the rate plus an 8% service fee", () => {
    assert.deepEqual(quoteStay({ pricePerNight: 2500, from: "2026-10-03", to: "2026-10-06" }), {
      nights: 3,
      rate: 2500,
      subtotal: 7500,
      serviceFee: 600,
      total: 8100,
    });
  });

  it("rounds the fee to whole rupees", () => {
    // 1 x 1999 = 1999; 8% is 159.92, which rounds to 160.
    const quote = quoteStay({ pricePerNight: 1999, from: "2026-10-03", to: "2026-10-04" });
    assert.equal(quote.serviceFee, 160);
    assert.equal(quote.total, 2159);
  });

  it("accepts Date objects as well as date strings", () => {
    const quote = quoteStay({
      pricePerNight: 1000,
      from: new Date(2026, 9, 3),
      to: new Date(2026, 9, 5),
    });
    assert.equal(quote.nights, 2);
  });

  it("quotes zero nights until both dates are chosen", () => {
    for (const dates of [{}, { from: "2026-10-03" }, { to: "2026-10-05" }, { from: null, to: null }]) {
      const quote = quoteStay({ pricePerNight: 2500, ...dates });
      assert.equal(quote.nights, 0);
      assert.equal(quote.total, 0);
    }
  });

  it("never quotes a negative stay when the dates are reversed", () => {
    const quote = quoteStay({ pricePerNight: 2500, from: "2026-10-06", to: "2026-10-03" });
    assert.equal(quote.nights, 0);
    assert.equal(quote.total, 0);
  });
});

describe("quoteExperience", () => {
  it("charges per guest plus a 5% fee", () => {
    assert.deepEqual(quoteExperience({ pricePerPerson: 1200, guests: 3 }), {
      people: 3,
      rate: 1200,
      subtotal: 3600,
      adjustment: 180,
      total: 3780,
    });
  });
});

describe("quoteTour", () => {
  it("has no discount below the group size", () => {
    const quote = quoteTour({ pricePerPerson: 5000, guests: TOUR_GROUP_MIN - 1 });
    assert.equal(quote.adjustment, 0);
    assert.equal(quote.total, 15000);
  });

  it("takes 5% off from the group size up, shown as a negative adjustment", () => {
    assert.deepEqual(quoteTour({ pricePerPerson: 5000, guests: TOUR_GROUP_MIN }), {
      people: 4,
      rate: 5000,
      subtotal: 20000,
      adjustment: -1000,
      total: 19000,
    });
  });

  it("rounds the discount to whole rupees", () => {
    // 4 x 1333 = 5332; 5% is 266.6, which rounds to 267.
    const quote = quoteTour({ pricePerPerson: 1333, guests: 4 });
    assert.equal(quote.adjustment, -267);
    assert.equal(quote.total, 5065);
  });
});

describe("transport by the day", () => {
  it("counts both ends of the hire", () => {
    assert.equal(transportDays("2026-10-03", "2026-10-05"), 3);
    assert.equal(transportDays("2026-10-03", "2026-10-03"), 1);
  });

  it("is one day with no return date", () => {
    assert.equal(transportDays("2026-10-03"), 1);
    assert.equal(transportDays("2026-10-03", null), 1);
    assert.equal(transportDays("2026-10-03", ""), 1);
  });

  it("is never less than one day when the return date is earlier", () => {
    assert.equal(transportDays("2026-10-05", "2026-10-03"), 1);
  });

  it("multiplies the day rate by the days", () => {
    assert.deepEqual(
      quoteTransportByDay({ pricePerDay: 3500, startDate: "2026-10-03", endDate: "2026-10-05" }),
      { days: 3, total: 10500 },
    );
  });
});

describe("toISODate", () => {
  it("formats the local calendar date with zero padding", () => {
    assert.equal(toISODate(new Date(2026, 0, 5)), "2026-01-05");
    assert.equal(toISODate(new Date(2026, 11, 31, 23, 59)), "2026-12-31");
  });
});
