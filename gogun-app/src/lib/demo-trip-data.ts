import type {
  AvailabilityDay,
  Balance,
  ChecklistItem,
  Expense,
  ItineraryActivity,
  ItineraryDay,
  MyAvailability,
  PackingItem,
  Poll,
  PollDetail,
  Quest,
  QuestProgress,
  Settlement,
  TransferSlip,
  Trip,
  TripMember,
  User,
  WheelOption,
} from "@/lib/api";

const DEMO_ID = "demo";
const NOW = "2026-11-02T09:00:00.000Z";
const MEMBERS: TripMember[] = [
  { id: "dm-1", trip_id: DEMO_ID, user_id: "demo-ton", role: "organizer", status: "joined", joined_at: NOW, user: { id: "demo-ton", display_name: "บัญชีตัวอย่าง", avatar_color: "#c0613e", is_guest: false } },
  { id: "dm-2", trip_id: DEMO_ID, user_id: "demo-james", role: "member", status: "joined", joined_at: NOW, user: { id: "demo-james", display_name: "เจมส์", avatar_color: "#4f6e7a", is_guest: true } },
  { id: "dm-3", trip_id: DEMO_ID, user_id: "demo-nai", role: "member", status: "joined", joined_at: NOW, user: { id: "demo-nai", display_name: "นาย", avatar_color: "#7b8b57", is_guest: true } },
  { id: "dm-4", trip_id: DEMO_ID, user_id: "demo-atif", role: "member", status: "joined", joined_at: NOW, user: { id: "demo-atif", display_name: "อาติฟ", avatar_color: "#8a6e9e", is_guest: true } },
];

const DEMO_USER: User = {
  id: "demo-ton", username: "demo", email: "demo@maewtiew.invalid", display_name: "บัญชีตัวอย่าง",
  avatar_color: "#c0613e", phone: null, is_guest: true, created_at: NOW,
};

const DEMO_TRIP: Trip = {
  id: DEMO_ID, name: "ทริปทะเลเกาะล้าน", destination: "เกาะล้าน, พัทยา", icon: "🌊",
  trip_type: "overnight", duration_days: 3, proposed_start_date: "2026-11-20",
  confirmed_start_date: null, date_status: "proposed", currency: "THB",
  invite_code: "", organizer_id: "demo-ton", budget_per_person: 3450,
  allow_member_expenses: true, allow_member_itinerary_edit: true, allow_member_invite: false,
  allow_member_expense_edit: true, allow_member_polls: true, allow_member_quests: true,
  created_at: NOW, organizer: { id: "demo-ton", display_name: "บัญชีตัวอย่าง", avatar_color: "#c0613e" },
  members: MEMBERS,
};

function makeActivity(dayId: string, id: string, time: string, title: string, sort_order: number, tags: string[] = []): ItineraryActivity {
  return { id, day_id: dayId, time, title, sort_order, tags };
}
function initialItinerary(): ItineraryDay[] {
  return [
    { id: "demo-day-1", trip_id: DEMO_ID, day_number: 1, date: "2026-11-20", label: "เดินทางสู่เกาะล้าน", activities: [
      makeActivity("demo-day-1", "demo-a1", "07:00", "ออกเดินทางจากกรุงเทพฯ", 0), makeActivity("demo-day-1", "demo-a2", "10:00", "ข้ามเรือจากท่าเรือแหลมบาลีฮาย", 1), makeActivity("demo-day-1", "demo-a3", "12:00", "เช็กอินและรับประทานอาหารกลางวัน", 2), makeActivity("demo-day-1", "demo-a4", "16:00", "เล่นน้ำหาดตาแหวน", 3), makeActivity("demo-day-1", "demo-a5", "19:00", "อาหารทะเลมื้อเย็น", 4),
    ] },
    { id: "demo-day-2", trip_id: DEMO_ID, day_number: 2, date: "2026-11-21", label: "เที่ยวรอบเกาะ", activities: [
      makeActivity("demo-day-2", "demo-a6", "09:00", "เล่นน้ำหาดเทียน", 0), makeActivity("demo-day-2", "demo-a7", "13:00", "ดำน้ำและพักผ่อน", 1), makeActivity("demo-day-2", "demo-a8", "17:30", "ชมวิวกังหันลม", 2), makeActivity("demo-day-2", "demo-a9", "19:00", "เลือกร้านซีฟู้ดมื้อเย็น", 3),
    ] },
    { id: "demo-day-3", trip_id: DEMO_ID, day_number: 3, date: "2026-11-22", label: "กลับกรุงเทพฯ", activities: [
      makeActivity("demo-day-3", "demo-a10", "09:00", "เช็กเอาต์และแวะคาเฟ่ริมทะเล", 0), makeActivity("demo-day-3", "demo-a11", "11:30", "ขึ้นเรือกลับพัทยา", 1), makeActivity("demo-day-3", "demo-a12", "14:00", "เดินทางกลับกรุงเทพฯ", 2),
    ] },
  ];
}

type DemoState = {
  trip: Trip;
  members: TripMember[];
  itinerary: ItineraryDay[];
  availability: Record<string, MyAvailability[]>;
  expenses: Expense[];
  polls: Poll[];
  checklist: ChecklistItem[];
  packing: PackingItem[];
  wheel: WheelOption[];
  quests: Quest[];
  comments: Record<string, { id: string; text: string; created_at: string; user: { id: string; display_name: string } }[]>;
};

function memberUser(id: string): User {
  const member = MEMBERS.find((item) => item.user_id === id) ?? MEMBERS[0];
  return { ...DEMO_USER, ...member.user, username: id, email: `${id}@maewtiew.invalid`, phone: null, is_guest: id !== "demo-ton", created_at: NOW };
}

function makeExpense(id: string, name: string, category: string, amount: number, payerId: string): Expense {
  const splits = MEMBERS.map((member, index) => {
    const share = Math.floor(amount / MEMBERS.length) + (index < amount % MEMBERS.length ? 1 : 0);
    return { id: `${id}-split-${index}`, expense_id: id, user_id: member.user_id, amount: share, user: member.user };
  });
  const payer = MEMBERS.find((member) => member.user_id === payerId) ?? MEMBERS[0];
  return { id, trip_id: DEMO_ID, name, category, total_amount: amount, currency: "THB", paid_by_user_id: payer.user_id, paid_by: payer.user, splits, created_at: NOW };
}

function makePoll(id: string, title: string, status: "open" | "closed", choices: string[], votes: number[], winnerIndex = -1): Poll {
  return {
    id, trip_id: DEMO_ID, title, subtitle: status === "open" ? "เลือกคำตอบที่ชอบได้เลย" : "ปิดโหวตแล้ว",
    close_date: status === "open" ? "2026-11-19" : null, status, created_by_user_id: "demo-ton", created_at: NOW,
    my_vote_option_id: null,
    options: choices.map((text, index) => ({
      id: `${id}-option-${index}`, poll_id: id, text, sort_order: index, vote_count: votes[index] ?? 0,
      voters: MEMBERS.slice(0, votes[index] ?? 0).map((member) => member.user), is_winner: winnerIndex === index,
    })),
  };
}

function makeChecklist(id: string, text: string, sort_order: number, is_checked: boolean): ChecklistItem {
  return { id, trip_id: DEMO_ID, text, sort_order, is_checked, checked_by: is_checked ? [{ ...MEMBERS[0].user, checked_at: NOW }] : [] };
}
function makePacking(id: string, text: string, sort_order: number, category: "shared" | "personal", is_checked: boolean): PackingItem {
  return { id, trip_id: DEMO_ID, text, sort_order, category, assignees: [], checked_by: is_checked ? [MEMBERS[0].user] : [], is_checked };
}
function makeQuest(id: string, title: string, description: string, targets: string[], completed: number[]): Quest {
  return { id, title, description, targets, closed: false, created_at: NOW, progress: MEMBERS.map((member) => ({
    quest_id: id, user_id: member.user_id, completed: member.user_id === "demo-ton" ? completed : [], updated_at: NOW, user: member.user,
  })) };
}

function createInitialState(): DemoState {
  const trip = { ...DEMO_TRIP, organizer: { ...DEMO_TRIP.organizer }, members: MEMBERS.map((member) => ({ ...member, user: { ...member.user } })) };
  return {
    trip, members: trip.members, itinerary: initialItinerary(),
    availability: {
      "demo-ton": [20, 21, 22].map((day) => ({ date: `2026-11-${day}`, status: "available" as const })),
      "demo-james": [20, 21, 22].map((day) => ({ date: `2026-11-${day}`, status: day === 21 ? "uncertain" as const : "available" as const })),
      "demo-nai": [20, 21, 22].map((day) => ({ date: `2026-11-${day}`, status: "available" as const })),
      "demo-atif": [20, 21, 22].map((day) => ({ date: `2026-11-${day}`, status: "available" as const })),
    },
    expenses: [makeExpense("demo-exp-1", "รถตู้ไปพัทยา", "transport", 3200, "demo-ton"), makeExpense("demo-exp-2", "เรือและรถสองแถว", "transport", 1800, "demo-james"), makeExpense("demo-exp-3", "ที่พัก 2 คืน", "hotel", 4800, "demo-ton"), makeExpense("demo-exp-4", "เช่ามอเตอร์ไซค์", "transport", 1200, "demo-nai"), makeExpense("demo-exp-5", "อาหารทะเล", "fish", 2200, "demo-james"), makeExpense("demo-exp-6", "เช่าหน้ากากดำน้ำ", "ticket", 600, "demo-ton")],
    polls: [makePoll("demo-poll-1", "เลือกร้านอาหารทะเลมื้อเย็น", "open", ["ครัวเฉลียงลม", "ครัวพวงพยอม", "ซีแซ่บ เกาะล้าน"], [2, 1, 0]), makePoll("demo-poll-2", "เลือกหาดสำหรับวันเสาร์", "closed", ["หาดเทียน", "หาดตาแหวน", "หาดแสม"], [3, 1, 0], 0)],
    checklist: [makeChecklist("demo-check-1", "จองที่พัก", 0, true), makeChecklist("demo-check-2", "จองรถตู้", 1, true), makeChecklist("demo-check-3", "เช็กเวลาเรือ", 2, true), makeChecklist("demo-check-4", "เตรียมบัตรประชาชน", 3, true), makeChecklist("demo-check-5", "แลกเงินสด", 4, true), makeChecklist("demo-check-6", "เช็กพยากรณ์อากาศ", 5, false)],
    packing: [makePacking("demo-pack-1", "ครีมกันแดด", 0, "shared", true), makePacking("demo-pack-2", "ถุงกันน้ำมือถือ", 1, "shared", false), makePacking("demo-pack-3", "หน้ากากดำน้ำ", 2, "shared", false), makePacking("demo-pack-4", "ชุดว่ายน้ำ", 3, "personal", true)],
    wheel: ["หาดตาแหวน", "หาดเทียน", "หาดแสม", "ร้านซีฟู้ด", "จุดชมวิวกังหันลม", "คาเฟ่ริมทะเล"].map((text, index) => ({ id: `demo-wheel-${index}`, trip_id: DEMO_ID, text, color: ["#c0613e", "#4f6e7a", "#7b8b57", "#8a6e9e", "#b58a4f", "#5b7c6e"][index], sort_order: index })),
    quests: [makeQuest("demo-quest-1", "เตรียมของส่วนกลาง", "ช่วยกันเตรียมของที่ใช้ร่วมกัน", ["ยืนยันที่พัก", "เลือกหาด", "เตรียมอุปกรณ์ดำน้ำ"], [0, 1]), makeQuest("demo-quest-2", "เลือกอาหารทะเล", "ช่วยกันเลือกมื้อเย็นของทริป", ["เลือกร้าน", "โหวตเมนู"], [0])],
    comments: {},
  };
}

let state = createInitialState();
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export const getDemoTrip = () => clone(state.trip);
export const getDemoUser = () => clone(DEMO_USER);
export function resetDemoTripData() { state = createInitialState(); }

function readBody(options: RequestInit): Record<string, unknown> {
  if (typeof options.body !== "string") return {};
  try { return JSON.parse(options.body) as Record<string, unknown>; } catch { return {}; }
}
function pickMember(id: string) { return state.members.find((member) => member.user_id === id) ?? state.members[0]; }
function totals(): Balance {
  const balances = state.members.map((member) => {
    const paid = state.expenses.filter((expense) => expense.paid_by_user_id === member.user_id).reduce((sum, expense) => sum + expense.total_amount, 0);
    const share = state.expenses.flatMap((expense) => expense.splits).filter((split) => split.user_id === member.user_id).reduce((sum, split) => sum + split.amount, 0);
    return { user_id: member.user_id, display_name: member.user.display_name, avatar_color: member.user.avatar_color, paid, share, net: paid - share };
  });
  return { total_amount: state.expenses.reduce((sum, expense) => sum + expense.total_amount, 0), currency: "THB", member_count: state.members.length, balances };
}
function settlements(): Settlement[] {
  const balance = totals().balances;
  const creditors = balance.filter((item) => item.net > 0).map((item) => ({ ...item }));
  const debtors = balance.filter((item) => item.net < 0).map((item) => ({ ...item, net: -item.net }));
  const result: Settlement[] = [];
  for (const debtor of debtors) for (const creditor of creditors) {
    if (debtor.net <= 0 || creditor.net <= 0) continue;
    const amount = Math.min(debtor.net, creditor.net);
    result.push({ from_user_id: debtor.user_id, to_user_id: creditor.user_id, amount, currency: "THB", from_user: pickMember(debtor.user_id).user, to_user: pickMember(creditor.user_id).user });
    debtor.net -= amount;
    creditor.net -= amount;
  }
  return result;
}
function availabilityList(): AvailabilityDay[] {
  return [20, 21, 22].map((day) => {
    const date = `2026-11-${day}`;
    const members = state.members.map((member) => ({ user_id: member.user_id, display_name: member.user.display_name, avatar_color: member.user.avatar_color, status: state.availability[member.user_id]?.find((item) => item.date === date)?.status ?? "unavailable" }));
    const available = members.filter((member) => member.status === "available").length;
    const uncertain = members.filter((member) => member.status === "uncertain").length;
    return { date, available, uncertain, member_count: state.members.length, variant: available === state.members.length ? "all" : available ? "some" : uncertain ? "uncertain" : "default", members };
  });
}
function withVotes(poll: Poll): Poll {
  return clone(poll);
}
function pollDetail(poll: Poll): PollDetail {
  return { poll: { id: poll.id, title: poll.title, subtitle: poll.subtitle, status: poll.status, close_date: poll.close_date }, total_voters: Math.max(...poll.options.map((item) => item.vote_count), 0), options: clone(poll.options), my_vote_option_id: poll.my_vote_option_id };
}

export function handleDemoRequest(path: string, options: RequestInit = {}): unknown {
  const url = new URL(path, "http://demo.local");
  const parts = url.pathname.split("/").filter(Boolean).slice(2);
  const method = (options.method ?? "GET").toUpperCase();
  const body = readBody(options);
  const [section, id, sub, subId] = parts;
  if (!section) {
    if (method === "GET") return clone(state.trip);
    if (method === "PATCH") {
      state.trip = { ...state.trip, ...body, allow_member_invite: false } as Trip;
      if (state.trip.date_status === "confirmed" && state.trip.confirmed_start_date) {
        const start = new Date(`${state.trip.confirmed_start_date}T00:00:00Z`);
        if (!Number.isNaN(start.getTime())) {
          state.itinerary = state.itinerary.map((day, index) => {
            const date = new Date(start);
            date.setUTCDate(date.getUTCDate() + index);
            return { ...day, date: date.toISOString().slice(0, 10) };
          });
        }
      }
      return clone(state.trip);
    }
  }
  if (section === "members") {
    if (method === "GET") return clone(state.members);
    const member = state.members.find((item) => item.user_id === id);
    if (method === "PATCH" && member) { member.user.display_name = String(body.display_name ?? member.user.display_name); return clone(member); }
    if (method === "DELETE") {
      if (!member || member.role === "organizer") return { deleted: false };
      state.members = state.members.filter((item) => item.user_id !== id);
      state.trip.members = state.members;
      return { deleted: true };
    }
  }
  if (section === "itinerary") {
    if (method === "GET") return clone(state.itinerary);
    if (id === "days" && !sub && method === "POST") {
      const dayId = `demo-day-${Date.now()}`; const day: ItineraryDay = { id: dayId, trip_id: DEMO_ID, day_number: Number(body.day_number ?? state.itinerary.length + 1), date: String(body.date ?? "2026-11-22"), label: String(body.label ?? "วันเที่ยว"), activities: [] }; state.itinerary.push(day); return clone(day);
    }
    if (id === "days" && sub === "swap" && method === "POST") {
      const a = state.itinerary.findIndex((item) => item.id === body.day_id_a); const b = state.itinerary.findIndex((item) => item.id === body.day_id_b); if (a >= 0 && b >= 0) [state.itinerary[a], state.itinerary[b]] = [state.itinerary[b], state.itinerary[a]]; return { swapped: true };
    }
    if (id === "days" && sub && sub !== "swap") {
      const day = state.itinerary.find((item) => item.id === sub);
      if (method === "PATCH" && day) { Object.assign(day, body); return clone(day); }
      if (method === "DELETE") { state.itinerary = state.itinerary.filter((item) => item.id !== sub); return { deleted: true }; }
    }
    if (id === "days" && sub && subId === "activities" && method === "POST") {
      const targetDay = state.itinerary.find((item) => item.id === sub); if (!targetDay) return null;
      const activity = makeActivity(sub, `demo-activity-${Date.now()}`, String(body.time ?? "12:00"), String(body.title ?? "กิจกรรมใหม่"), Number(body.sort_order ?? targetDay.activities.length)); targetDay.activities.push(activity); return clone(activity);
    }
    if (id === "activities" && sub && method === "PATCH") {
      for (const day of state.itinerary) { const activity = day.activities.find((item) => item.id === sub); if (activity) { Object.assign(activity, body); return clone(activity); } }
    }
    if (id === "activities" && sub && method === "DELETE") { for (const day of state.itinerary) day.activities = day.activities.filter((item) => item.id !== sub); return { deleted: true }; }
  }
  if (section === "availability") {
    if (id === "me" && method === "GET") return clone(state.availability[DEMO_USER.id] ?? []);
    if (id && id !== "me") {
      if (method === "GET") return clone(state.availability[id] ?? []);
      if (method === "PUT") { state.availability[id] = clone(body as unknown as MyAvailability[]); return { updated: true }; }
    }
    if (!id && method === "GET") return availabilityList();
    if (!id && method === "PUT") { state.availability[DEMO_USER.id] = clone(body as unknown as MyAvailability[]); return { updated: true }; }
  }
  if (section === "expenses") {
    if (!id && method === "GET") return clone(state.expenses);
    if (id === "balance" && method === "GET") return totals();
    if (id === "settlements" && method === "GET") return settlements();
    if (id === "transfers" && method === "GET") return [] as TransferSlip[];
    if (!id && method === "POST") {
      const payer = pickMember(String(body.paid_by_user_id ?? DEMO_USER.id)); const amount = Number(body.total_amount ?? 0); const expId = `demo-exp-${Date.now()}`;
      const splits = Array.isArray(body.splits) ? body.splits as Array<{ user_id: string; amount: number }> : [];
      const expense: Expense = { id: expId, trip_id: DEMO_ID, name: String(body.name ?? "ค่าใช้จ่ายใหม่"), category: String(body.category ?? "other"), total_amount: amount, currency: String(body.currency ?? "THB"), paid_by_user_id: payer.user_id, paid_by: payer.user, splits: splits.map((split, index) => ({ id: `${expId}-split-${index}`, expense_id: expId, user_id: split.user_id, amount: split.amount, user: pickMember(split.user_id).user })), created_at: NOW };
      state.expenses.unshift(expense); return clone(expense);
    }
    if (id && !["balance", "settlements", "transfers"].includes(id)) {
      const expense = state.expenses.find((item) => item.id === id);
      if (method === "PATCH" && expense) { Object.assign(expense, body); if (body.paid_by_user_id) { expense.paid_by = pickMember(String(body.paid_by_user_id)).user; } return clone(expense); }
      if (method === "DELETE") { state.expenses = state.expenses.filter((item) => item.id !== id); return { deleted: true }; }
    }
  }
  if (section === "polls") {
    if (!id && method === "GET") return state.polls.map(withVotes);
    if (!id && method === "POST") {
      const pollId = `demo-poll-${Date.now()}`; const optionsIn = Array.isArray(body.options) ? body.options as Array<{ text: string; sort_order?: number }> : [];
      const poll = makePoll(pollId, String(body.title ?? "โหวตใหม่"), "open", optionsIn.map((item) => item.text), optionsIn.map(() => 0)); poll.subtitle = String(body.subtitle ?? ""); poll.close_date = typeof body.close_date === "string" ? body.close_date : null; state.polls.unshift(poll); return clone(poll);
    }
    const poll = state.polls.find((item) => item.id === id);
    if (id && sub === "vote" && method === "POST" && poll) { const option = poll.options.find((item) => item.id === body.option_id); if (option) { if (poll.my_vote_option_id) { const previous = poll.options.find((item) => item.id === poll.my_vote_option_id); if (previous) previous.vote_count = Math.max(0, previous.vote_count - 1); } poll.my_vote_option_id = option.id; option.vote_count += 1; option.voters = [...option.voters.filter((voter) => voter.id !== DEMO_USER.id), DEMO_USER]; } return { voted: true }; }
    if (id && sub === "vote" && method === "DELETE" && poll) { const previous = poll.options.find((item) => item.id === poll.my_vote_option_id); if (previous) previous.vote_count = Math.max(0, previous.vote_count - 1); poll.my_vote_option_id = null; return { voted: false }; }
    if (id && !sub && method === "GET" && poll) return pollDetail(poll);
    if (id && !sub && method === "PATCH" && poll) {
      const { options: optionDrafts, ...fields } = body;
      Object.assign(poll, fields);
      if (Array.isArray(optionDrafts)) {
        poll.options = (optionDrafts as Array<{ id?: string; text: string; sort_order?: number }>).map((draft, index) => {
          const existing = draft.id ? poll.options.find((item) => item.id === draft.id) : undefined;
          return existing
            ? { ...existing, text: draft.text, sort_order: draft.sort_order ?? index }
            : { id: `demo-option-${Date.now()}-${index}`, poll_id: poll.id, text: draft.text, sort_order: draft.sort_order ?? index, vote_count: 0, voters: [] };
        });
      }
      return clone(poll);
    }
    if (id && !sub && method === "DELETE") { state.polls = state.polls.filter((item) => item.id !== id); return { deleted: true }; }
  }
  if (section === "checklist") {
    if (!id && method === "GET") return clone(state.checklist);
    if (!id && method === "POST") { const item = makeChecklist(`demo-check-${Date.now()}-${state.checklist.length}`, String(body.text ?? "รายการใหม่"), Number(body.sort_order ?? state.checklist.length), false); state.checklist.push(item); return clone(item); }
    const item = state.checklist.find((entry) => entry.id === id);
    if (id && !sub && method === "PATCH" && item) { item.text = String(body.text ?? item.text); return clone(item); }
    if (id && sub === "check" && method === "POST" && item) { item.is_checked = true; item.checked_by = [{ id: DEMO_USER.id, display_name: DEMO_USER.display_name, avatar_color: DEMO_USER.avatar_color, checked_at: NOW }]; return clone(item); }
    if (id && sub === "check" && method === "DELETE" && item) { item.is_checked = false; item.checked_by = []; return clone(item); }
    if (id && method === "DELETE") { state.checklist = state.checklist.filter((entry) => entry.id !== id); return { deleted: true }; }
  }
  if (section === "packing") {
    if (!id && method === "GET") return clone(state.packing);
    if (!id && method === "POST") { const item = makePacking(`demo-pack-${Date.now()}`, String(body.text ?? "ของใช้ใหม่"), state.packing.length, body.category === "personal" ? "personal" : "shared", false); state.packing.push(item); return clone(item); }
    const item = state.packing.find((entry) => entry.id === id);
    if (id && sub === "check" && item) { item.is_checked = method === "POST"; item.checked_by = item.is_checked ? [DEMO_USER] : []; return clone(item); }
    if (id && method === "DELETE") { state.packing = state.packing.filter((entry) => entry.id !== id); return { deleted: true }; }
  }
  if (section === "wheel") {
    if (!id && method === "GET") return clone(state.wheel);
    if (!id && method === "POST") { const option: WheelOption = { id: `demo-wheel-${Date.now()}`, trip_id: DEMO_ID, text: String(body.text ?? "ตัวเลือกใหม่"), color: String(body.color ?? "#c0613e"), sort_order: state.wheel.length }; state.wheel.push(option); return clone(option); }
    if (!id && method === "DELETE") { state.wheel = []; return { deleted: true }; }
    if (id && method === "DELETE") { state.wheel = state.wheel.filter((item) => item.id !== id); return { deleted: true }; }
  }
  if (section === "quests") {
    if (!id && method === "GET") return clone(state.quests);
    if (!id && method === "POST") { const quest = makeQuest(`demo-quest-${Date.now()}`, String(body.title ?? "ภารกิจใหม่"), String(body.description ?? ""), Array.isArray(body.targets) ? body.targets as string[] : [], []); state.quests.unshift(quest); return clone(quest); }
    const quest = state.quests.find((item) => item.id === id);
    if (id && sub === "progress" && method === "PUT" && quest) { const progress = quest.progress.find((item) => item.user_id === DEMO_USER.id)!; progress.completed = Array.isArray(body.completed) ? body.completed as number[] : []; progress.updated_at = NOW; return clone(progress) as QuestProgress; }
    if (id && method === "PATCH" && quest) { Object.assign(quest, body); return clone(quest); }
    if (id && method === "DELETE") { state.quests = state.quests.filter((item) => item.id !== id); return { deleted: true }; }
  }
  if (section === "comments") {
    const key = parts.slice(1).join(":");
    if (method === "GET") return clone(state.comments[key] ?? []);
    if (method === "POST") { const comment = { id: `demo-comment-${Date.now()}`, text: String(body.text ?? ""), created_at: NOW, user: { id: DEMO_USER.id, display_name: DEMO_USER.display_name } }; state.comments[key] = [...(state.comments[key] ?? []), comment]; return clone(comment); }
  }
  if (section === "transfers" && id && sub === "confirm" && method === "PATCH") return { id, trip_id: DEMO_ID, status: "confirmed" };
  return method === "DELETE" ? { deleted: true } : [];
}
