/**
 * The community verification rules decide what the public sees: a place is
 * published only with UPVOTES_REQUIRED votes inside the voting window, and a
 * pending place whose window closed reads as `held` without any background job
 * having run. The server enforces these in `src/lib/community/actions.ts` and
 * the browser shows the same numbers, so the boundaries are pinned here with
 * fixed instants (no dependence on the clock the tests run at).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  LIMITS,
  UPVOTES_REQUIRED,
  VOTING_WINDOW_HOURS,
  effectiveStatus,
  hoursLeft,
  isVotingOpen,
  meetsThreshold,
  votingEndsAt,
} from "@/lib/community/rules";

const HOUR = 60 * 60 * 1000;
const listedAt = new Date("2026-10-01T06:00:00Z");
const endsAt = votingEndsAt(listedAt);

describe("published rules", () => {
  it("keeps the documented thresholds and limits", () => {
    assert.equal(UPVOTES_REQUIRED, 10);
    assert.equal(VOTING_WINDOW_HOURS, 48);
    assert.deepEqual(LIMITS, {
      submissionsPerDay: 5,
      openSubmissions: 5,
      photosPerPlace: 6,
      uploadsPerDay: 40,
      unattachedPhotoHours: 24,
    });
  });
});

describe("votingEndsAt", () => {
  it("closes the window 48 hours after listing", () => {
    assert.equal(endsAt.toISOString(), "2026-10-03T06:00:00.000Z");
  });
});

describe("isVotingOpen", () => {
  it("is open for a pending place before the window closes", () => {
    const now = new Date(endsAt.getTime() - 1);
    assert.equal(isVotingOpen({ status: "pending", votingEndsAt: endsAt }, now), true);
  });

  it("closes at the exact end instant", () => {
    assert.equal(isVotingOpen({ status: "pending", votingEndsAt: endsAt }, endsAt), false);
  });

  it("is closed for any status other than pending, even inside the window", () => {
    const now = new Date(listedAt.getTime() + HOUR);
    for (const status of ["published", "held", "rejected"] as const) {
      assert.equal(isVotingOpen({ status, votingEndsAt: endsAt }, now), false, status);
    }
  });
});

describe("effectiveStatus", () => {
  it("reads a pending place as held once its window has closed", () => {
    assert.equal(effectiveStatus({ status: "pending", votingEndsAt: endsAt }, endsAt), "held");
  });

  it("keeps a pending place pending while voting is open", () => {
    const now = new Date(listedAt.getTime() + HOUR);
    assert.equal(effectiveStatus({ status: "pending", votingEndsAt: endsAt }, now), "pending");
  });

  it("never changes a decided status", () => {
    const late = new Date(endsAt.getTime() + 24 * HOUR);
    for (const status of ["published", "held", "rejected"] as const) {
      assert.equal(effectiveStatus({ status, votingEndsAt: endsAt }, late), status);
    }
  });
});

describe("meetsThreshold", () => {
  it("publishes at exactly the required number of votes", () => {
    assert.equal(meetsThreshold(UPVOTES_REQUIRED - 1), false);
    assert.equal(meetsThreshold(UPVOTES_REQUIRED), true);
    assert.equal(meetsThreshold(UPVOTES_REQUIRED + 5), true);
  });
});

describe("hoursLeft", () => {
  it("rounds partial hours up", () => {
    assert.equal(hoursLeft(endsAt, new Date(endsAt.getTime() - 90 * 60 * 1000)), 2);
    assert.equal(hoursLeft(endsAt, new Date(endsAt.getTime() - 1)), 1);
  });

  it("is the full window right after listing", () => {
    assert.equal(hoursLeft(endsAt, listedAt), VOTING_WINDOW_HOURS);
  });

  it("is never negative after the window closes", () => {
    assert.equal(hoursLeft(endsAt, endsAt), 0);
    assert.equal(hoursLeft(endsAt, new Date(endsAt.getTime() + 5 * HOUR)), 0);
  });
});
