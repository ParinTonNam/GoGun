"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { TaskCard } from "@/components/trip-dashboard/task-card";
import { StatCard } from "@/components/trip-dashboard/stat-card";
import { ToolRow } from "@/components/trip-dashboard/tool-row";
import { LoadError } from "@/components/load-error";
import { useLoad } from "@/lib/use-load";
import { inviteUrl, inviteLinkLabel } from "@/lib/invite";
import {
  getTrip,
  getBalance,
  getPolls,
  getMe,
  formatAmount,
  formatShortDate,
  type Trip,
  type Balance,
  type Poll,
  type User,
} from "@/lib/api";

export default function TripDashboardPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);

  const { error: loadError, retry } = useLoad(async () => {
    const [t, b, p, u] = await Promise.all([
      getTrip(tripId),
      getBalance(tripId),
      getPolls(tripId),
      getMe(),
    ]);
    setTrip(t);
    setBalance(b);
    setPolls(p);
    setMe(u);
  }, [tripId]);

  async function copyInviteLink() {
    if (!trip) return;
    const url = inviteUrl(trip.invite_code);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  }

  if (loadError) {
    return <LoadError message={loadError} onRetry={retry} />;
  }

  if (!trip) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
        <p className="text-[#767168]">กำลังโหลด...</p>
      </main>
    );
  }

  const joinedCount = trip.members.filter((m) => m.status === "joined").length;
  const totalMembers = trip.members.length;
  const pendingMembers = trip.members.filter(
    (m) => m.role !== "organizer" && m.status !== "joined"
  );
  const dateUnconfirmed = trip.date_status !== "confirmed";
  const unvotedPolls = polls.filter(
    (p) => p.status === "open" && p.my_vote_option_id === null
  );
  const totalTaskCount =
    (pendingMembers.length > 0 ? 1 : 0) +
    (dateUnconfirmed ? 1 : 0) +
    unvotedPolls.length;
  const totalAmount = balance ? balance.total_amount : 0;
  const currency = trip.currency;
  const currencySymbol = currency === "JPY" ? "¥" : currency === "THB" ? "฿" : currency;
  const inviteLink = inviteLinkLabel(trip.invite_code);

  const dateLabel = trip.confirmed_start_date
    ? formatShortDate(trip.confirmed_start_date)
    : trip.proposed_start_date
    ? formatShortDate(trip.proposed_start_date)
    : "ยังไม่กำหนด";

  const dateStatus =
    trip.date_status === "confirmed" ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน";
  const dateStatusColor =
    trip.date_status === "confirmed" ? "#2e8b5c" : "#d9a21b";

  const stats: Array<{
    value: string;
    valueColor: string;
    label: string;
    route?: string;
  }> = [
    {
      value: `${joinedCount}/${totalMembers}`,
      valueColor: joinedCount === totalMembers ? "#2e8b5c" : "#d9a21b",
      label: "เข้าร่วมแล้ว",
    },
    {
      value: `${currencySymbol}${totalAmount >= 1000 ? Math.round(totalAmount / 1000) + "k" : formatAmount(totalAmount)}`,
      valueColor: "#14110d",
      label: "ค่าใช้จ่ายรวม",
    },
  ];

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col gap-[24px] px-[24px] py-[24px]">
        {/* Header */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-[7px]">
            <img src="/images/logo.svg" alt="" className="size-[19px]" />
            <p className="text-[11px] tracking-[0.08px] text-[#767168]">GOGUN</p>
            <p className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">
              ไปกัน
            </p>
          </div>
          {me && (
            <div className="flex h-[33px] items-center gap-[8px] rounded-[48px] border border-[#edeae2] bg-white p-[7px]">
              <span
                className="flex size-[22px] items-center justify-center rounded-[31px] text-[12px] font-medium text-white"
                style={{ backgroundColor: me.avatar_color }}
              >
                {me.display_name.slice(0, 1)}
              </span>
              <span className="text-[12px] font-medium tracking-[0.08px] text-[#14110d]">
                {me.display_name}
              </span>
            </div>
          )}
        </div>

        {/* Trip info card */}
        <div className="flex w-full flex-col gap-[10px] pb-[22px] pt-[4px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[12px]">
              <button
                type="button"
                onClick={() => router.push('/trips')}
                className="flex size-[36px] shrink-0 items-center justify-center rounded-[18.5px] border border-[#e5e1d7] bg-white"
              >
                <img src="/images/icon-chevron-left.svg" alt="" className="h-[10px] w-[6px] object-contain" />
              </button>
              <h1 className="text-[28px] font-medium leading-[30.8px] tracking-[-0.28px] text-[#14110d]">
                {trip.name}
              </h1>
            </div>
            <a
              href="#tools"
              className="shrink-0 rounded-full bg-[#fcede3] px-[10px] py-[4px] text-[10px] font-medium uppercase text-[#e85a2c]"
            >
              จัดการ
            </a>
          </div>
          <div className="flex w-full items-center gap-[14px] rounded-[16px] border border-[#e5e1d7] bg-white px-[17px] py-[15px]">
            <p className="text-[40px] font-light tracking-[-1.2px] text-[#e85a2c]">
              {trip.duration_days}
            </p>
            <div className="flex flex-1 flex-col gap-[2px] tracking-[0.08px]">
              <p className="text-[15px] font-medium text-[#14110d]">
                วัน · {trip.destination}
              </p>
              <p className="text-[12px] text-[#767168]">
                {dateLabel}{" "}
                <span style={{ color: dateStatusColor }}>· {dateStatus}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="flex w-full flex-col gap-[10px]">
          <div className="flex items-center justify-between">
            <p className="text-[13px] tracking-[0.08px] text-[#767168]">ต้องจัดการ</p>
            <p className="text-[12px] font-medium tracking-[0.12px] text-[#e85a2c]">
              {totalTaskCount > 0 ? `${totalTaskCount} รายการ` : "เรียบร้อย"}
            </p>
          </div>
          <div className="flex w-full flex-col gap-[8px]">
            {pendingMembers.length > 0 && (
              <TaskCard
                icon="/images/icon-door.svg"
                title={`${pendingMembers.length} คนยังไม่เข้าทริป`}
                subtitle="ส่งลิงก์เชิญอีกครั้ง"
                actionLabel="แชร์"
                onAction={() => router.push(`/trips/${tripId}/share`)}
              />
            )}
            {dateUnconfirmed && (
              <TaskCard
                icon="/images/icon-itinerary-a.svg"
                title="วันที่ยังไม่ได้ยืนยัน"
                subtitle={
                  trip.proposed_start_date
                    ? `เสนอไว้ ${formatShortDate(trip.proposed_start_date)}`
                    : "ยังไม่มีวันเสนอ"
                }
                actionLabel="เทียบวัน"
                onAction={() => router.push(`/trips/${tripId}/availability`)}
              />
            )}
            {unvotedPolls.map((poll) => {
              const totalVoters = poll.options.reduce((s, o) => s + o.vote_count, 0);
              return (
                <TaskCard
                  key={poll.id}
                  icon="/images/icon-vote.svg"
                  title={poll.title}
                  subtitle={`โหวตแล้ว ${totalVoters}/${joinedCount} คน`}
                  actionLabel="โหวต"
                  onAction={() => router.push(`/trips/${tripId}/tools/vote`)}
                />
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="flex w-full flex-col gap-[10px]">
          <p className="text-[13px] tracking-[0.08px] text-[#767168]">ภาพรวม</p>
          <div className="grid grid-cols-2 gap-[10px]">
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                value={stat.value}
                valueColor={stat.valueColor}
                label={stat.label}
                onClick={stat.route ? () => router.push(stat.route!) : undefined}
              />
            ))}
          </div>
        </div>

        {/* Members */}
        <div className="flex w-full flex-col gap-[10px]">
          <div className="flex items-center justify-between">
            <p className="text-[13px] tracking-[0.08px] text-[#767168]">เพื่อนร่วมทริป</p>
            <button
              type="button"
              onClick={() => router.push(`/trips/${tripId}/members`)}
              className="text-[12px] tracking-[0.12px] text-[#14110d]"
            >
              จัดการ →
            </button>
          </div>
          <div className="flex flex-wrap gap-[2px]">
            {trip.members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col items-center gap-[8px] rounded-[18px] p-[10px]"
              >
                <div
                  className="flex size-[50px] items-center justify-center rounded-[25px] text-[15px] font-medium text-white"
                  style={{ backgroundColor: member.user.avatar_color }}
                >
                  {member.user.display_name.trim().charAt(0)}
                </div>
                <p className="text-[12px] font-medium tracking-[0.08px] text-[#14110d]">
                  {member.user.display_name}
                </p>
              </div>
            ))}
            <div className="flex flex-col items-center gap-[8px] rounded-[18px] p-[10px]">
              <button
                type="button"
                onClick={() => router.push(`/trips/${tripId}/members`)}
                className="flex size-[50px] items-center justify-center rounded-[25px] border border-[#e5e1d7] bg-white"
              >
                <img src="/images/icon-plus.svg" alt="" className="size-[16px] invert" />
              </button>
              <p className="text-[12px] font-medium tracking-[0.08px] text-[#14110d]">เชิญ</p>
            </div>
          </div>
        </div>

        {/* Share invite — แยกออกมาระหว่างสมาชิกกับเครื่องมือจัดการ */}
        <div className="flex w-full flex-col overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
          <ToolRow
            icon={<img src="/images/icon-tool-share.svg" alt="" className="size-[16px]" />}
            title="แชร์ลิงก์เชิญ"
            subtitle={copied ? "คัดลอกแล้ว" : inviteLink}
            showDivider={false}
            onClick={copyInviteLink}
          />
        </div>

        {/* Tools */}
        <div id="tools" className="flex w-full flex-col gap-[10px] pb-[4px]">
          <p className="text-[13px] tracking-[0.08px] text-[#767168]">เครื่องมือจัดการ</p>
          <div className="flex w-full flex-col overflow-hidden rounded-[16px] border border-[#e5e1d7] bg-white">
            <ToolRow
              icon={<img src="/images/icon-tool-availability.svg" alt="" className="size-[20px]" />}
              title="เทียบวันว่าง"
              subtitle={dateUnconfirmed ? "ยังไม่ยืนยันวัน" : "ยืนยันวันแล้ว"}
              showDivider
              onClick={() => router.push(`/trips/${tripId}/availability`)}
            />
            <ToolRow
              icon={<img src="/images/icon-tool-itinerary.svg" alt="" className="size-[20px]" />}
              title="แก้แผนเดินทาง"
              subtitle={`${trip.duration_days} วัน`}
              showDivider
              onClick={() => router.push(`/trips/${tripId}/itinerary`)}
            />
            <ToolRow
              icon={<img src="/images/icon-tool-expenses.svg" alt="" className="h-[16px] w-[16px]" />}
              title="จัดการค่าใช้จ่าย"
              subtitle={`${currencySymbol}${totalAmount >= 1000 ? Math.round(totalAmount / 1000) + "k" : formatAmount(totalAmount)} รวม`}
              showDivider
              onClick={() => router.push(`/trips/${tripId}/member/wallet`)}
            />
            <ToolRow
              icon={<img src="/images/icon-tool-accessories.svg" alt="" className="size-[21px]" />}
              title="อุปกรณ์เสริม"
              subtitle="เครื่องมือเพิ่มเติม"
              showDivider
              onClick={() => router.push(`/trips/${tripId}/tools`)}
            />
            <ToolRow
              icon={<img src="/images/icon-tool-settings.svg" alt="" className="size-[20px]" />}
              title="ตั้งค่าทริป"
              subtitle="สกุลเงิน · สิทธิ์ · แจ้งเตือน"
              showDivider={false}
              onClick={() => router.push(`/trips/${tripId}/settings`)}
            />
          </div>
        </div>

        <p className="px-[20px] pb-[6px] pt-[8px] text-center text-[10.5px] tracking-[0.42px] text-[#b5b0a4]">
          GoGun · ไปกัน
          {me?.id === trip.organizer_id ? " · คุณเป็นคนจัดทริปนี้" : ""}
        </p>
      </div>
    </main>
  );
}
