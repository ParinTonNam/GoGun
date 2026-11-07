import assert from "node:assert/strict";
import test from "node:test";
import { getTripPhase, getTripSection, tripPermissions } from "../src/lib/trip-navigation";
import type { Trip } from "../src/lib/api";

test("all canonical and legacy destinations keep the correct section selected", () => {
  for (const path of ["/plan", "/availability", "/availability/compare", "/itinerary", "/tools/checklist", "/tools/packing", "/member/availability"]) {
    assert.equal(getTripSection(`/trips/one${path}`, "one"), "plan", path);
  }
  for (const path of ["/expenses", "/expenses/add", "/member/wallet/add"]) assert.equal(getTripSection(`/trips/one${path}`, "one"), "expenses", path);
  for (const path of ["/group", "/settings", "/members", "/share", "/tools/vote", "/tools/wheel"]) assert.equal(getTripSection(`/trips/one${path}`, "one"), "group", path);
  assert.equal(getTripSection("/trips/one/member", "one"), "overview");
  assert.equal(getTripSection("/trips/one-other/expenses", "one"), "overview");
});

test("phase boundaries include the whole final calendar day and cross months", () => {
  const trip = { date_status: "confirmed", confirmed_start_date: "2026-12-31T00:00:00.000Z", duration_days: 3 } as const;
  assert.equal(getTripPhase(trip, "2026-12-30"), "preparing");
  assert.equal(getTripPhase(trip, "2026-12-31"), "travelling");
  assert.equal(getTripPhase(trip, "2027-01-02"), "travelling");
  assert.equal(getTripPhase(trip, "2027-01-03"), "settling");
  assert.equal(getTripPhase({ ...trip, date_status: "proposed" }, "2027-01-03"), "planning");
  assert.equal(getTripPhase({ ...trip, confirmed_start_date: null }), "planning");
});

test("member capabilities respect individual flags, organizer and departed members", () => {
  const trip = { organizer_id: "host", allow_member_itinerary_edit: true, allow_member_expenses: false, allow_member_invite: false,
    members: [{ user_id: "host", status: "joined" }, { user_id: "friend", status: "joined" }, { user_id: "left", status: "declined" }],
  } as Trip;
  assert.deepEqual(tripPermissions(trip, { id: "host" }), { isOrganizer: true, canEditItinerary: true, canEditExpenses: true, canEditOwnExpenses: true, canInvite: true, canCreatePolls: true, canStartEvents: true });
  assert.deepEqual(tripPermissions(trip, { id: "friend" }), { isOrganizer: false, canEditItinerary: true, canEditExpenses: false, canEditOwnExpenses: true, canInvite: false, canCreatePolls: true, canStartEvents: true });
  for (const id of ["left", "stranger"]) assert.deepEqual(tripPermissions({ ...trip, allow_member_expenses: true, allow_member_invite: true }, { id }), { isOrganizer: false, canEditItinerary: false, canEditExpenses: false, canEditOwnExpenses: false, canInvite: false, canCreatePolls: false, canStartEvents: false });
});
