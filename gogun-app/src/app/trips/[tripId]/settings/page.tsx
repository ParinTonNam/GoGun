"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { getTrip, getMe, updateTrip, transferHost, deleteTrip, type Trip, type TripMember, type User } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { LoadError } from "@/components/load-error";
import { notifyError, useLoad } from "@/lib/use-load";
import { inviteUrl, inviteLinkLabel } from "@/lib/invite";

/* ─── Types ─── */
type SheetType = "icon" | "name" | "date" | "currency" | "budget" | "transfer" | "delete";

/* ─── Constants ─── */
const CURRENCIES = ["THB", "JPY", "USD", "EUR", "KRW", "SGD", "CNY", "GBP", "AUD"];

const TRIP_ICONS = [
  "🏖️", "🏝️", "⛰️", "🏔️", "🏕️", "🌊",
  "🌅", "🌸", "🌴", "❄️", "🗼", "🏯",
  "⛩️", "🛕", "🕌", "🏙️", "🎡", "🎢",
  "🍜", "🍣", "☕", "🍺", "🎉", "🎂",
  "✈️", "🚂", "🚗", "⛵", "🚴", "🎒",
  "📷", "🎣", "⚽", "🐘", "🦈", "🌋",
];

/* ─── Small shared components ─── */
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className="relative h-[26px] w-[44px] shrink-0 rounded-[999px] transition-colors"
      style={{ backgroundColor: on ? "#e85a2c" : "#f2efe8" }}
    >
      <div
        className="absolute top-[2px] size-[22px] rounded-[11px] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.15)] transition-all duration-150"
        style={{ left: on ? "20px" : "2px" }}
      />
    </button>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <div className="bg-[#f2efe8] px-[16px] pb-[6px] pt-[12px]">
      <p className="text-[10.5px] uppercase tracking-[1.68px] text-[#767168]">{title}</p>
    </div>
  );
}

function Chevron() {
  return (
    <div className="flex h-[30px] w-[14px] shrink-0 items-center justify-center">
      <img src="/images/icon-chevron-left.svg" alt="" className="h-[10px] w-[6px] rotate-180" />
    </div>
  );
}

function Checkmark() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
      <path d="M1 6L6 11L15 1" stroke="#e85a2c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UnderlineInput({ value, onChange, placeholder, type = "text", inputMode, autoFocus }: {
  value: string; onChange: (v: string) => void; placeholder: string;
  type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]; autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`border-b pb-[15px] pt-[14px] ${focused || value ? "border-[#e85a2c]" : "border-[#e5e1d7]"}`}>
      <input
        autoFocus={autoFocus}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[17px] text-[#14110d] outline-none placeholder:text-[#b5b0a4]"
      />
    </div>
  );
}

/* ─── Sheet content components ─── */
function IconContent({ current, onSave }: { current: string | null; onSave: (v: string | null) => void }) {
  return (
    <div className="flex flex-col gap-[16px] px-[24px] pb-[48px] pt-[24px]">
      <p className="text-[12px] tracking-[0.08px] text-[#767168]">เลือกอิโมจิเป็นไอคอนทริป</p>
      <div className="grid grid-cols-6 gap-[8px]">
        {TRIP_ICONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSave(emoji)}
            className={`flex aspect-square items-center justify-center rounded-[12px] border text-[22px] transition-colors ${
              current === emoji ? "border-[#e85a2c] bg-[#fcede3]" : "border-[#e5e1d7] bg-white"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
      {current && (
        <button
          type="button"
          onClick={() => onSave(null)}
          className="w-full rounded-[14px] border border-[#e5e1d7] bg-white py-[13px] text-[13px] font-light text-[#767168]"
        >
          ไม่ใช้ไอคอน
        </button>
      )}
    </div>
  );
}

function NameContent({ initialValue, onSave }: { initialValue: string; onSave: (v: string) => void }) {
  const [value, setValue] = useState(initialValue);
  return (
    <div className="flex flex-col gap-[10px] px-[24px] pb-[48px] pt-[24px]">
      <p className="text-[12px] tracking-[0.08px] text-[#767168]">ชื่อทริป</p>
      <UnderlineInput value={value} onChange={setValue} placeholder="เช่น ทริปโตเกียว 2026" autoFocus />
      <p className="text-[12px] tracking-[0.08px] text-[#767168]">ชื่อที่แสดงในหน้าหลักและลิงก์เชิญ</p>
      <button
        type="button"
        onClick={() => onSave(value)}
        disabled={!value.trim()}
        className="mt-[8px] w-full rounded-[14px] bg-[#14110d] py-[14px] text-[14px] font-medium text-white disabled:opacity-40"
      >
        บันทึก
      </button>
    </div>
  );
}

function DateContent({ trip, onSave }: { trip: Trip; onSave: (status: "proposed" | "confirmed") => void }) {
  const [status, setStatus] = useState<"proposed" | "confirmed">(trip.date_status);
  const dateLabel = trip.confirmed_start_date ?? trip.proposed_start_date;
  return (
    <div className="flex flex-col gap-[16px] px-[24px] pb-[48px] pt-[24px]">
      <p className="text-[12px] tracking-[0.08px] text-[#767168]">สถานะวันเดินทาง</p>
      <div className="overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
        {(["proposed", "confirmed"] as const).map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`flex w-full items-center justify-between px-[16px] py-[16px] ${i === 0 ? "border-b border-[#e5e1d7]" : ""}`}
          >
            <div className="flex flex-col items-start gap-[3px]">
              <span className="text-[14px] font-medium text-[#14110d]">
                {s === "proposed" ? "กำลังโหวต / ยังไม่ยืนยัน" : "ยืนยันวันแล้ว"}
              </span>
              <span className="text-[11px] font-light text-[#767168]">
                {s === "proposed" ? "ใช้ proposed_start_date" : "ใช้ confirmed_start_date"}
              </span>
            </div>
            {status === s && <Checkmark />}
          </button>
        ))}
      </div>
      {dateLabel && (
        <p className="text-[12px] text-[#767168]">
          วันที่ปัจจุบัน: {new Date(dateLabel).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
          {" "}({trip.duration_days} วัน)
        </p>
      )}
      <button
        type="button"
        onClick={() => onSave(status)}
        className="mt-[4px] w-full rounded-[14px] bg-[#14110d] py-[14px] text-[14px] font-medium text-white"
      >
        บันทึก
      </button>
    </div>
  );
}

function CurrencyContent({ initialValue, onSave }: { initialValue: string; onSave: (v: string) => void }) {
  const [selected, setSelected] = useState(initialValue);
  return (
    <div className="flex flex-col gap-[16px] px-[24px] pb-[48px] pt-[24px]">
      <p className="text-[12px] tracking-[0.08px] text-[#767168]">เลือกสกุลเงิน</p>
      <div className="overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
        {CURRENCIES.map((cur, i) => (
          <button
            key={cur}
            type="button"
            onClick={() => setSelected(cur)}
            className={`flex w-full items-center justify-between px-[16px] py-[14px] ${i < CURRENCIES.length - 1 ? "border-b border-[#e5e1d7]" : ""}`}
          >
            <span className="text-[14px] font-medium text-[#14110d]">{cur}</span>
            {selected === cur && <Checkmark />}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onSave(selected)}
        className="w-full rounded-[14px] bg-[#14110d] py-[14px] text-[14px] font-medium text-white"
      >
        บันทึก
      </button>
    </div>
  );
}

function BudgetContent({ initialValue, onSave }: { initialValue: string; onSave: (v: string) => void }) {
  const [value, setValue] = useState(initialValue);
  return (
    <div className="flex flex-col gap-[10px] px-[24px] pb-[48px] pt-[24px]">
      <p className="text-[12px] tracking-[0.08px] text-[#767168]">งบประมาณ / คน</p>
      <UnderlineInput
        value={value}
        onChange={setValue}
        placeholder="0"
        type="number"
        inputMode="numeric"
        autoFocus
      />
      <p className="text-[12px] tracking-[0.08px] text-[#767168]">ระบุงบโดยประมาณต่อคน (ไม่บังคับ)</p>
      <button
        type="button"
        onClick={() => onSave(value)}
        className="mt-[8px] w-full rounded-[14px] bg-[#14110d] py-[14px] text-[14px] font-medium text-white"
      >
        บันทึก
      </button>
    </div>
  );
}

function TransferContent({ members, onConfirm }: { members: TripMember[]; onConfirm: (userId: string) => Promise<void> }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const others = members.filter((m) => m.role !== "organizer" && m.status === "joined");

  async function handleConfirm() {
    if (!selected || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await onConfirm(selected);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ส่งต่อสิทธิ์ไม่สำเร็จ");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-[16px] px-[24px] pb-[48px] pt-[24px]">
      <p className="text-[12px] tracking-[0.08px] text-[#767168]">เลือกสมาชิกที่จะรับสิทธิ์ host</p>
      {others.length === 0 ? (
        <p className="py-[16px] text-center text-[13px] font-light text-[#767168]">ยังไม่มีสมาชิกในทริป</p>
      ) : (
        <div className="overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
          {others.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelected(m.user_id)}
              className={`flex w-full items-center gap-[12px] px-[16px] py-[13px] ${i < others.length - 1 ? "border-b border-[#e5e1d7]" : ""}`}
            >
              <div
                className="flex size-[32px] shrink-0 items-center justify-center rounded-full text-[13px] font-medium text-white"
                style={{ backgroundColor: m.user.avatar_color }}
              >
                {m.user.display_name.slice(0, 1)}
              </div>
              <span className="flex-1 text-left text-[14px] text-[#14110d]">{m.user.display_name}</span>
              {selected === m.user_id && <Checkmark />}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-[12px] text-red-500">{error}</p>}
      <button
        type="button"
        disabled={!selected || submitting}
        onClick={handleConfirm}
        className="w-full rounded-[14px] bg-[#e85a2c] py-[14px] text-[14px] font-medium text-white disabled:opacity-40"
      >
        {submitting ? "กำลังส่งต่อ..." : "ยืนยันส่งต่อ"}
      </button>
    </div>
  );
}

function DeleteContent({ tripName, onClose, onConfirm }: {
  tripName: string; onClose: () => void; onConfirm: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="flex flex-col gap-[20px] px-[24px] pb-[48px] pt-[24px]">
      <div className="flex flex-col gap-[8px]">
        <p className="text-[16px] font-medium text-[#14110d]">ลบทริป &quot;{tripName}&quot;?</p>
        <p className="text-[13px] font-light leading-[1.6] text-[#767168]">
          ข้อมูลทั้งหมดในทริปนี้จะถูกลบถาวร ได้แก่ ค่าใช้จ่าย แผนเดินทาง และสมาชิกทั้งหมด{" "}
          <span className="text-[#e85a2c]">ไม่สามารถกู้คืนได้</span>
        </p>
      </div>
      <label className="flex items-center gap-[10px]">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="size-[18px] accent-[#e85a2c]"
        />
        <span className="text-[13px] text-[#14110d]">ฉันเข้าใจและต้องการลบทริปนี้</span>
      </label>
      <div className="flex gap-[10px]">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-[14px] border border-[#e5e1d7] bg-white py-[14px] text-[14px] font-medium text-[#14110d]"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          disabled={!confirmed}
          onClick={onConfirm}
          className="flex-1 rounded-[14px] bg-[#e85a2c] py-[14px] text-[14px] font-medium text-white disabled:opacity-40"
        >
          ลบทริป
        </button>
      </div>
    </div>
  );
}

/* ─── Sheet titles & nav ─── */
const SHEET_TITLE: Record<SheetType, string> = {
  icon:     "ไอคอนทริป",
  name:     "ชื่อทริป",
  date:     "วันที่",
  currency: "สกุลเงินหลัก",
  budget:   "งบประมาณ / คน",
  transfer: "ส่งต่อสิทธิ์ host",
  delete:   "ลบทริป",
};

/* ─── Bottom sheet wrapper ─── */
function SettingsSheet({ sheet, open, onClose, children }: {
  sheet: SheetType | null; open: boolean; onClose: () => void; children?: React.ReactNode;
}) {
  const isDanger = sheet === "delete";

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`fixed bottom-0 left-1/2 z-50 flex max-h-[90vh] min-h-[50vh] w-full max-w-[420px] -translate-x-1/2 flex-col overflow-y-auto rounded-t-[25px] bg-[#f7f5f0] transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        {/* Drag handle */}
        <div className="flex shrink-0 justify-center pb-[2px] pt-[10px]">
          <div className="h-[4px] w-[36px] rounded-full bg-[#d4cfc2]" />
        </div>

        {/* Nav bar */}
        <div className="flex h-[49px] shrink-0 items-center justify-between border-b border-[#e5e1d7]/50 px-[24px]">
          <button type="button" onClick={onClose} className="py-[1.5px] text-[12px] tracking-[0.08px] text-[#767168]">
            ยกเลิก
          </button>
          <p className={`text-[15px] font-medium tracking-[0.08px] ${isDanger ? "text-[#e85a2c]" : "text-[#14110d]"}`}>
            {sheet ? SHEET_TITLE[sheet] : ""}
          </p>
          <span className="w-[40px]" />
        </div>

        {children}
      </div>
    </>
  );
}

/* ─── Main page ─── */
export default function TripSettingsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeSheet, setActiveSheet] = useState<SheetType | null>(null);
  const [displaySheet, setDisplaySheet] = useState<SheetType | null>(null);
  const [permissionSaving, setPermissionSaving] = useState<string | null>(null);
  // สิทธิ์สมาชิกยังไม่ enforce จริงฝั่ง API (settings เก็บค่าได้ แต่ route ไม่เช็ค)
  // ซ่อน toggle ไว้ก่อน deploy กันเข้าใจผิดว่าปิดสิทธิ์แล้วปลอดภัย — เปิดกลับเมื่อ enforce เสร็จ
  const SHOW_MEMBER_PERMISSIONS = false;

  const { error: loadError, retry } = useLoad(async () => {
    const [t, user] = await Promise.all([getTrip(tripId), getMe()]);
    setTrip(t);
    setMe(user);
  }, [tripId]);

  async function togglePermission(key: "allow_member_expenses" | "allow_member_itinerary_edit" | "allow_member_invite") {
    if (!trip || permissionSaving) return;
    const next = !trip[key];
    setPermissionSaving(key);
    try {
      const updated = await updateTrip(tripId, { [key]: next } as Partial<Trip>);
      setTrip(updated);
    } catch (e) {
      notifyError(e);
    } finally {
      setPermissionSaving(null);
    }
  }

  function openSheet(s: SheetType) {
    setDisplaySheet(s);
    setActiveSheet(s);
  }

  function closeSheet() {
    setActiveSheet(null);
    setTimeout(() => setDisplaySheet(null), 300);
  }

  async function copyLink() {
    if (!trip) return;
    try {
      await navigator.clipboard.writeText(inviteUrl(trip.invite_code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  }

  async function saveIcon(icon: string | null) {
    const updated = await updateTrip(tripId, { icon } as Partial<Trip>).catch(notifyError);
    if (updated) setTrip(updated);
    closeSheet();
  }

  async function saveName(name: string) {
    if (!name.trim()) return;
    const updated = await updateTrip(tripId, { name: name.trim() }).catch(notifyError);
    if (updated) setTrip(updated);
    closeSheet();
  }

  async function saveDate(status: "proposed" | "confirmed") {
    const updated = await updateTrip(tripId, { date_status: status }).catch(notifyError);
    if (updated) setTrip(updated);
    closeSheet();
  }

  async function saveCurrency(currency: string) {
    const updated = await updateTrip(tripId, { currency }).catch(notifyError);
    if (updated) setTrip(updated);
    closeSheet();
  }

  async function saveBudget(value: string) {
    const updated = await updateTrip(tripId, {
      budget_per_person: value.trim() === "" ? null : Number(value),
    } as Partial<Trip>).catch(notifyError);
    if (updated) setTrip(updated);
    closeSheet();
  }

  async function handleTransfer(userId: string) {
    try {
      await transferHost(tripId, userId);
    } catch (e) {
      notifyError(e, "โอนสิทธิ์ผู้จัดทริปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    closeSheet();
    router.replace(`/trips/${tripId}/member`);
  }

  async function handleDelete() {
    try {
      await deleteTrip(tripId);
    } catch (e) {
      notifyError(e, "ลบทริปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return;
    }
    router.replace("/trips");
  }

  const inviteLink = trip ? inviteLinkLabel(trip.invite_code) : "กำลังโหลด...";

  if (loadError) {
    return <LoadError message={loadError} onRetry={retry} />;
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col pb-[24px] pt-[24px]">

        {/* Header */}
        <div className="px-[24px]">
          <PageHeader title="ตั้งค่าทริป" backHref={`/trips/${tripId}`} user={me} />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-[18px] px-[24px]">

          {/* ข้อมูลทริป */}
          <div className="overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
            <SectionLabel title="ข้อมูลทริป" />

            <button type="button" onClick={() => openSheet("icon")} className="flex h-[57px] w-full items-center gap-[12px] border-b border-[#e5e1d7] px-[16px] text-left">
              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]">
                {trip?.icon ? (
                  <span className="text-[16px]">{trip.icon}</span>
                ) : (
                  <span className="text-[13px] font-medium text-[#e85a2c]">
                    {trip?.destination?.trim().slice(0, 1) ?? "•"}
                  </span>
                )}
              </div>
              <p className="flex-1 text-[14px] tracking-[0.08px] text-[#14110d]">ไอคอนทริป</p>
              <p className="shrink-0 text-[13px] font-light tracking-[0.08px] text-[#767168]">
                {trip?.icon ?? "ไม่ตั้ง"}
              </p>
              <Chevron />
            </button>

            <button type="button" onClick={() => openSheet("name")} className="flex h-[57px] w-full items-center gap-[12px] border-b border-[#e5e1d7] px-[16px] text-left">
              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]">
                <div className="relative size-[18px]">
                  <div className="absolute inset-[4.17%_16.67%_8.33%_16.67%]"><img src="/images/icon-text-field-a.svg" alt="" className="size-full" /></div>
                  <div className="absolute inset-[27.08%_39.58%_52.08%_39.58%]"><img src="/images/icon-text-field-b.svg" alt="" className="size-full" /></div>
                </div>
              </div>
              <p className="flex-1 text-[14px] tracking-[0.08px] text-[#14110d]">ชื่อทริป</p>
              <p className="shrink-0 text-[13px] font-light tracking-[0.08px] text-[#767168]">{trip?.name ?? "—"}</p>
              <Chevron />
            </button>

            <button type="button" onClick={() => openSheet("date")} className="flex h-[57px] w-full items-center gap-[12px] border-b border-[#e5e1d7] px-[16px] text-left">
              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]">
                <div className="relative size-[20px]">
                  <div className="absolute inset-[20.83%_12.5%_12.5%_12.5%]"><img src="/images/icon-calendar-small-a.svg" alt="" className="size-full" /></div>
                  <div className="absolute inset-[12.5%_12.5%_58.33%_12.5%]"><img src="/images/icon-calendar-small-b.svg" alt="" className="size-full" /></div>
                </div>
              </div>
              <p className="flex-1 text-[14px] tracking-[0.08px] text-[#14110d]">วันที่</p>
              <p className="shrink-0 text-[13px] font-light tracking-[0.08px] text-[#767168]">
                {trip?.date_status === "confirmed" ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"}
              </p>
              <Chevron />
            </button>

            <button type="button" onClick={() => openSheet("currency")} className="flex h-[57px] w-full items-center gap-[12px] border-b border-[#e5e1d7] px-[16px] text-left">
              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]">
                <div className="relative size-[20px]">
                  <div className="absolute inset-[12.5%]"><img src="/images/icon-coin-a.svg" alt="" className="size-full" /></div>
                  <div className="absolute inset-[37.5%_35.42%_29.17%_37.5%]"><img src="/images/icon-coin-b.svg" alt="" className="size-full" /></div>
                </div>
              </div>
              <p className="flex-1 text-[14px] tracking-[0.08px] text-[#14110d]">สกุลเงินหลัก</p>
              <p className="shrink-0 text-[13px] font-light tracking-[0.08px] text-[#767168]">{trip?.currency ?? "—"}</p>
              <Chevron />
            </button>

            <button type="button" onClick={() => openSheet("budget")} className="flex h-[56px] w-full items-center gap-[12px] px-[16px] text-left">
              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]">
                <div className="relative size-[18px]">
                  <div className="absolute inset-[12.5%]"><img src="/images/icon-budget-a.svg" alt="" className="size-full" /></div>
                  <div className="absolute inset-[29.17%_37.5%]"><img src="/images/icon-budget-b.svg" alt="" className="size-full" /></div>
                </div>
              </div>
              <p className="flex-1 text-[14px] tracking-[0.08px] text-[#14110d]">งบประมาณ / คน</p>
              <p className="shrink-0 text-[13px] font-light tracking-[0.08px] text-[#767168]">
                {trip?.budget_per_person != null ? `${trip.currency} ${trip.budget_per_person.toLocaleString("th-TH")}` : "ไม่ตั้ง"}
              </p>
              <Chevron />
            </button>
          </div>

          {/* สิทธิ์สมาชิก — ซ่อนไว้จนกว่า API จะ enforce จริง (ดู SHOW_MEMBER_PERMISSIONS) */}
          {SHOW_MEMBER_PERMISSIONS && (
          <div className="overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
            <SectionLabel title="สิทธิ์สมาชิก" />
            <div className="flex items-center gap-[12px] border-b border-[#e5e1d7] px-[16px] py-[13px]">
              <div className="flex flex-1 flex-col gap-px tracking-[0.08px]">
                <p className="text-[14px] text-[#14110d]">เพิ่มค่าใช้จ่ายเองได้</p>
                <p className="text-[11px] font-light text-[#767168]">ทุกคนเพิ่มบิลของตัวเองได้</p>
              </div>
              <Toggle
                on={trip?.allow_member_expenses ?? true}
                onChange={() => togglePermission("allow_member_expenses")}
              />
            </div>
            <div className="flex items-center gap-[12px] border-b border-[#e5e1d7] px-[16px] py-[13px]">
              <div className="flex flex-1 flex-col gap-px tracking-[0.08px]">
                <p className="text-[14px] text-[#14110d]">แก้แผนเดินทางได้</p>
                <p className="text-[11px] font-light text-[#767168]">สมาชิกแก้ itinerary ร่วมกัน</p>
              </div>
              <Toggle
                on={trip?.allow_member_itinerary_edit ?? true}
                onChange={() => togglePermission("allow_member_itinerary_edit")}
              />
            </div>
            <div className="flex items-center gap-[12px] px-[16px] py-[13px]">
              <div className="flex flex-1 flex-col gap-px tracking-[0.08px]">
                <p className="text-[14px] text-[#14110d]">เชิญคนอื่นเพิ่มได้</p>
                <p className="text-[11px] font-light text-[#767168]">ถ้าปิด มีแค่คุณที่เชิญเพิ่มได้</p>
              </div>
              <Toggle
                on={trip?.allow_member_invite ?? false}
                onChange={() => togglePermission("allow_member_invite")}
              />
            </div>
          </div>
          )}

          {/* ลิงก์ทริป */}
          <div className="overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
            <SectionLabel title="ลิงก์ทริป" />
            <div className="flex items-center gap-[12px] px-[16px] py-[13px]">
              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]">
                <div className="relative size-[16px]">
                  <div className="absolute inset-[8.33%_12.5%]"><img src="/images/icon-link.svg" alt="" className="size-full" /></div>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-px tracking-[0.08px]">
                <p className="text-[14px] text-[#14110d]">{inviteLink}</p>
                <p className="text-[11px] font-light text-[#767168]">ใครมีลิงก์เข้าได้</p>
              </div>
              <button type="button" onClick={copyLink} className="shrink-0 px-[6px] py-px text-[13px] font-medium text-[#e85a2c]">
                {copied ? "คัดลอกแล้ว" : "คัดลอก"}
              </button>
            </div>
          </div>

          {/* โซนอันตราย */}
          <div className="overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
            <SectionLabel title="โซนอันตราย" />
            <button type="button" onClick={() => openSheet("transfer")} className="flex w-full items-center gap-[12px] border-b border-[#e5e1d7] px-[16px] py-[13px] text-left">
              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]">
                <div className="relative size-[16px]">
                  <div className="absolute inset-[12.5%]"><img src="/images/icon-transfer.svg" alt="" className="size-full" /></div>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-px tracking-[0.08px]">
                <p className="text-[14px] text-[#14110d]">ส่งต่อสิทธิ์ host</p>
                <p className="text-[11px] font-light text-[#767168]">ให้คนอื่นเป็นคนจัดทริปแทน</p>
              </div>
              <Chevron />
            </button>
            <button type="button" onClick={() => openSheet("delete")} className="flex w-full items-center gap-[12px] px-[16px] py-[13px] text-left">
              <div className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[#fcede3]">
                <div className="relative size-[16px]">
                  <div className="absolute inset-[8.33%_12.5%]"><img src="/images/icon-trash.svg" alt="" className="size-full" /></div>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-px tracking-[0.08px]">
                <p className="text-[14px] font-medium text-[#e85a2c]">ลบทริปนี้</p>
                <p className="text-[11px] font-light text-[#767168]">ทุกข้อมูลจะหายไป — ทำซ้ำไม่ได้</p>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="pb-[30px] pt-[8px] text-center">
            <p className="text-[10.5px] tracking-[0.42px] text-[#b5b0a4]">GoGun · ไปกัน · v1.0</p>
          </div>
        </div>
      </div>

      {/* Bottom sheets */}
      <SettingsSheet sheet={displaySheet} open={activeSheet !== null} onClose={closeSheet}>
        {displaySheet === "icon"     && <IconContent     current={trip?.icon ?? null} onSave={saveIcon} />}
        {displaySheet === "name"     && <NameContent     initialValue={trip?.name ?? ""} onSave={saveName} />}
        {displaySheet === "date"     && trip && <DateContent trip={trip} onSave={saveDate} />}
        {displaySheet === "currency" && <CurrencyContent initialValue={trip?.currency ?? "THB"} onSave={saveCurrency} />}
        {displaySheet === "budget"   && (
          <BudgetContent
            initialValue={trip?.budget_per_person != null ? String(trip.budget_per_person) : ""}
            onSave={saveBudget}
          />
        )}
        {displaySheet === "transfer" && <TransferContent members={trip?.members ?? []} onConfirm={handleTransfer} />}
        {displaySheet === "delete"   && <DeleteContent   tripName={trip?.name ?? ""} onClose={closeSheet} onConfirm={handleDelete} />}
      </SettingsSheet>
    </main>
  );
}
