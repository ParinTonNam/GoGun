"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTripWorkspace } from "@/components/trip-workspace";
import { HomeBottomNav, MaewTopbar, TripTicketSelector } from "@/components/trip-ticket-selector";
import { updateTrip, type Trip } from "@/lib/api";

type SettingKey =
  | "allow_member_invite"
  | "allow_member_itinerary_edit"
  | "allow_member_expenses"
  | "allow_member_expense_edit"
  | "allow_member_polls"
  | "allow_member_quests";

type SettingItemConfig = {
  key: SettingKey;
  title: string;
  subtitle: string;
};

const SETTING_ITEMS: SettingItemConfig[] = [
  {
    key: "allow_member_invite",
    title: "เชิญคนอื่นเพิ่มได้",
    subtitle: "ถ้าปิด มีแค่คุณที่เชิญเพิ่มได้",
  },
  {
    key: "allow_member_itinerary_edit",
    title: "แก้แผนเดินทางได้",
    subtitle: "สมาชิกแก้ itinerary ร่วมกัน",
  },
  {
    key: "allow_member_expenses",
    title: "เพิ่มค่าใช้จ่ายเองได้",
    subtitle: "ทุกคนเพิ่มบิลของตัวเองได้",
  },
  {
    key: "allow_member_expense_edit",
    title: "สามารถแก้ไขค่าใช้จ่ายที่ตัวเองจ่ายได้",
    subtitle: "ทุกคนแก้ไขค่าใช้จ่ายได้",
  },
  {
    key: "allow_member_polls",
    title: "เพิ่มโพลโหวตเองได้",
    subtitle: "ทุกคนเพิ่มโพลโหวตได้",
  },
  {
    key: "allow_member_quests",
    title: "สามารถเริ่มอีเวนท์เองได้",
    subtitle: "ทุกคนเปิดอีเวนท์ได้",
  },
];

function getSingleInitial(name?: string | null): string {
  const cleaned = (name ?? "").trim();
  if (!cleaned) return "ต";
  return cleaned.slice(0, 1);
}

function getSettingValue(trip: Trip, key: SettingKey): boolean {
  switch (key) {
    case "allow_member_invite":
      return trip.allow_member_invite ?? true;
    case "allow_member_itinerary_edit":
      return trip.allow_member_itinerary_edit ?? true;
    case "allow_member_expenses":
      return trip.allow_member_expenses ?? true;
    case "allow_member_expense_edit":
      return trip.allow_member_expense_edit ?? true;
    case "allow_member_polls":
      return trip.allow_member_polls ?? true;
    case "allow_member_quests":
      return trip.allow_member_quests ?? true;
  }
}

export function TripSettingsView() {
  const router = useRouter();
  const { trip, me, permissions, refresh } = useTripWorkspace();
  const isOrganizer = permissions.isOrganizer;
  const avatarBg = me?.avatar_color || "#c0613e";

  const [optimisticState, setOptimisticState] = useState<{ trip: Trip; flags: Partial<Record<SettingKey, boolean>> }>({ trip, flags: {} });
  const optimisticFlags = optimisticState.trip === trip ? optimisticState.flags : {};
  const [savingKey, setSavingKey] = useState<SettingKey | null>(null);

  // Redirect participants away since Settings is Organizer-only (PDF Page 32: "ฝั่งคนเข้าร่วมทริป: ไม่มี")
  useEffect(() => {
    if (!isOrganizer) {
      router.replace(`/trips/${trip.id}`);
    }
  }, [isOrganizer, router, trip.id]);

  async function handleToggle(key: SettingKey) {
    if (!isOrganizer || savingKey) return;
    const currentVal = optimisticFlags[key] ?? getSettingValue(trip, key);
    const nextVal = !currentVal;

    setOptimisticState({ trip, flags: { ...optimisticFlags, [key]: nextVal } });
    setSavingKey(key);
    try {
      await updateTrip(trip.id, { [key]: nextVal } as Partial<Trip>);
      refresh();
    } catch {
      // Revert optimistic state on failure
      setOptimisticState({ trip, flags: { ...optimisticFlags, [key]: currentVal } });
    } finally {
      setSavingKey(null);
    }
  }

  if (!isOrganizer) {
    return null;
  }

  return (
    <main className="maew-home-scene maew-trip-fixed-scene">
      {/* Top Bar (Figma 660:7089) */}
      <MaewTopbar me={me} />

      <div className="maew-trip-scroll-content">
      {/* Section Hero Header + 4-Button Section Bar (Figma 768:4621 & 768:4680) */}
      <TripTicketSelector
        trip={trip}
        activeVariant="setting"
        isOrganizer={isOrganizer}
      />

      {/* Main Settings Card (Figma 673:5127) */}
      <section
        aria-label="ตั้งค่าทริป"
        style={{
          width: "100%",
          maxWidth: 362,
          minHeight: 556,
          backgroundColor: "#ffffff",
          borderRadius: 14,
          padding: "20px 17px",
          marginTop: 10,
          display: "flex",
          flexDirection: "column",
          gap: 15,
          boxSizing: "border-box",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 500,
            lineHeight: "20px",
            letterSpacing: "0.08px",
            color: "#e85a2c",
          }}
        >
          ตั้งค่าทริป
        </h2>

        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        {(trip.id === "demo" ? SETTING_ITEMS.filter((item) => item.key !== "allow_member_invite") : SETTING_ITEMS).map((item) => {
            const isOn = optimisticFlags[item.key] ?? getSettingValue(trip, item.key);
            return (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "13px 16px",
                  borderBottom: "1px solid #e5e1d7",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    flex: "1 0 0",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    letterSpacing: "0.08px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 500,
                      lineHeight: "20.2px",
                      color: "#14110d",
                    }}
                  >
                    {item.title}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      fontWeight: 400,
                      lineHeight: "16.8px",
                      color: "#767168",
                    }}
                  >
                    {item.subtitle}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isOn}
                  aria-label={item.title}
                  disabled={savingKey === item.key}
                  onClick={() => void handleToggle(item.key)}
                  style={{
                    position: "relative",
                    width: 44,
                    height: 26,
                    borderRadius: 999,
                    border: "none",
                    padding: 0,
                    flexShrink: 0,
                    cursor: savingKey === item.key ? "wait" : "pointer",
                    backgroundColor: isOn ? "#e85a2c" : "#f2efe8",
                    transition: "background-color 150ms ease",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: 2,
                      left: isOn ? 20 : 2,
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: "#ffffff",
                      boxShadow: "0px 1px 3px 0px rgba(0, 0, 0, 0.15)",
                      transition: "left 150ms ease",
                    }}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      </div>

      {/* Bottom Navigation Bar (Figma 673:5146) */}
      <HomeBottomNav />
    </main>
  );
}

export default TripSettingsView;
