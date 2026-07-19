"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, DEMO_USER } from "@/components/page-header";
import { MemberBottomNav } from "@/components/member-bottom-nav";

type Voter = "ton" | "james" | "nai" | "atif";

const MEMBER_INFO: Record<Voter, { initial: string; color: string }> = {
  ton:   { initial: "ต", color: "#c0613e" },
  james: { initial: "จ", color: "#4f6e7a" },
  nai:   { initial: "น", color: "#7b8b57" },
  atif:  { initial: "อ", color: "#8a6e9e" },
};

function AvatarStack({ voters }: { voters: Voter[] }) {
  if (voters.length === 0) return null;
  const AVATAR = 16;
  const STEP = 12;
  const totalW = AVATAR + (voters.length - 1) * STEP;
  return (
    <div className="relative h-[16px] shrink-0" style={{ width: totalW }}>
      {voters.map((v, i) => {
        const info = MEMBER_INFO[v];
        return (
          <div
            key={v}
            className="absolute top-0 flex h-[16px] w-[16px] items-center justify-center rounded-[8px] border-[0.8px] border-white text-[8px] font-medium text-white"
            style={{ left: i * STEP, backgroundColor: info.color }}
          >
            {info.initial}
          </div>
        );
      })}
    </div>
  );
}

type Option = {
  id: string;
  text: string;
  baseVotes: number;
  baseVoters: Voter[];
  winner?: boolean;
};

type Poll = {
  id: string;
  title: string;
  subtitle: string;
  status: "open" | "closed";
  totalVoters: number;
  createdBy: Voter;
  options: Option[];
};

const POLLS: Poll[] = [
  {
    id: "p1",
    title: "วันที่ 4 — เลือกที่กิน Kaiseki",
    subtitle: "ปิดโหวต 25 Oct · 4 คนต้องโหวต",
    status: "open",
    totalVoters: 4,
    createdBy: "ton",
    options: [
      { id: "k1", text: "Kikunoi (มิชลิน 3 ดาว, ¥38k)", baseVotes: 2, baseVoters: ["james", "atif"] },
      { id: "k2", text: "Gion Karyo (¥18k)", baseVotes: 0, baseVoters: [] },
      { id: "k3", text: "Roan Kikunoi (¥22k)", baseVotes: 0, baseVoters: [] },
    ],
  },
  {
    id: "p2",
    title: "ที่พัก Kyoto",
    subtitle: "ตกลงแล้ว · machiya ชนะ",
    status: "closed",
    totalVoters: 4,
    createdBy: "james",
    options: [
      { id: "m1", text: "Machiya Gion (บ้านญี่ปุ่นแท้)", baseVotes: 4, baseVoters: ["ton", "james", "nai", "atif"], winner: true },
      { id: "m2", text: "Hotel Granvia", baseVotes: 0, baseVoters: [] },
    ],
  },
];

const MEMBER_NAMES: Record<Voter, string> = {
  ton: "ต้นน้ำ", james: "เจมส์", nai: "นาย", atif: "อาตีฟ",
};

export default function VotePage() {
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>(() => {
    if (typeof window === "undefined") return POLLS;
    try {
      const extras = JSON.parse(sessionStorage.getItem("new_polls") ?? "[]") as Poll[];
      return [...POLLS, ...extras];
    } catch { return POLLS; }
  });
  const [userVotes, setUserVotes] = useState<Record<string, string | null>>({
    p1: null,
    p2: null,
  });

  const openPolls   = polls.filter((p) => p.status === "open");
  const closedPolls = polls.filter((p) => p.status === "closed");

  function castVote(pollId: string, optionId: string) {
    setUserVotes((prev) => ({
      ...prev,
      [pollId]: prev[pollId] === optionId ? null : optionId,
    }));
  }

  function getVotes(poll: Poll, optionId: string): number {
    const base = poll.options.find((o) => o.id === optionId)?.baseVotes ?? 0;
    if (userVotes[poll.id] === optionId) return base + 1;
    return base;
  }

  function PollCard({ poll }: { poll: Poll }) {
    const userVote = userVotes[poll.id];
    const isClosed = poll.status === "closed";
    return (
      <div className={`w-full rounded-[16px] border bg-white pb-[11px] pt-[15px] px-[15px] transition-opacity ${isClosed ? "border-[#e5e1d7] opacity-60" : "border-[#e5e1d7]"}`}>
        <p className="pb-[2px] text-[14.5px] font-medium tracking-[0.08px] text-[#14110d]">
          {poll.title}
        </p>
        <p className="text-[11.5px] font-light tracking-[0.08px] text-[#767168]">
          {poll.subtitle}
        </p>
        <div className="flex items-center gap-[5px] pb-[12px] pt-[4px]">
          <span className="text-[10.5px] font-light tracking-[0.08px] text-[#b5b0a4]">เปิดโดย</span>
          <div
            className="flex size-[14px] shrink-0 items-center justify-center rounded-full text-[7px] font-medium text-white"
            style={{ backgroundColor: MEMBER_INFO[poll.createdBy].color }}
          >
            {MEMBER_INFO[poll.createdBy].initial}
          </div>
          <span className="text-[10.5px] font-light tracking-[0.08px] text-[#767168]">
            {MEMBER_NAMES[poll.createdBy]}
          </span>
        </div>

        {poll.options.map((opt) => {
          const votes    = getVotes(poll, opt.id);
          const pct      = poll.totalVoters > 0 ? (votes / poll.totalVoters) * 100 : 0;
          const isChoice = userVote === opt.id;
          const voters: Voter[] = isChoice ? [...opt.baseVoters, "ton"] : opt.baseVoters;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => !isClosed && castVote(poll.id, opt.id)}
              disabled={isClosed}
              className={`flex w-full items-center gap-[12px] border-t border-[#e5e1d7] pb-[10px] pt-[11px] ${isClosed ? "cursor-default" : "cursor-pointer"}`}
            >
              {opt.winner && (
                <div className="flex h-[19px] w-[6px] shrink-0 flex-col items-center py-[6.5px]">
                  <div className="min-h-0 flex-1 w-full rounded-[3px] bg-[#e85a2c]" />
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                <div className="flex items-center gap-[8px]">
                  {isChoice && (
                    <div className="flex h-[19px] w-[6px] shrink-0 flex-col items-center py-[6.5px]">
                      <div className="min-h-0 flex-1 w-full rounded-[3px] bg-[#e85a2c]" />
                    </div>
                  )}
                  <p className="text-left text-[13px] leading-normal text-[#14110d]">{opt.text}</p>
                </div>
                <div className="h-[4px] w-full overflow-clip rounded-[2px] bg-[#f2efe8]">
                  <div
                    className="h-full rounded-[2px] bg-[#e85a2c] transition-all duration-300"
                    style={{ width: votes === 0 ? "1px" : `${pct}%` }}
                  />
                </div>
              </div>
              {voters.length > 0 && <AvatarStack voters={voters} />}
              <p className="w-[22px] shrink-0 text-right text-[11px] font-light text-[#767168]">{votes}</p>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col pb-[100px] pt-[24px] px-[24px]">
        {/* Header */}
        <PageHeader
          title="โหวต"
          backHref="/trips/demo/tools"
          user={DEMO_USER}
          right={
            <button
              type="button"
              onClick={() => router.push("/trips/demo/tools/vote/add")}
              className="flex size-[30px] items-center justify-center rounded-full bg-[#14110d]"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1V11M1 6H11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          }
        />

        <div className="flex flex-col gap-[28px]">
          {/* Open section */}
          {openPolls.length > 0 && (
            <div className="flex flex-col gap-[10px]">
              <div className="flex items-center gap-[8px]">
                <div className="size-[7px] rounded-full bg-[#e85a2c]" />
                <p className="text-[12px] font-medium tracking-[0.08px] text-[#14110d]">
                  กำลังโหวต
                </p>
                <p className="text-[11px] font-light tracking-[0.08px] text-[#767168]">
                  {openPolls.length} รายการ
                </p>
              </div>
              <div className="flex flex-col gap-[10px]">
                {openPolls.map((poll) => <PollCard key={poll.id} poll={poll} />)}
              </div>
            </div>
          )}

          {/* Closed section */}
          {closedPolls.length > 0 && (
            <div className="flex flex-col gap-[10px]">
              <div className="flex items-center gap-[8px]">
                <div className="size-[7px] rounded-full bg-[#b5b0a4]" />
                <p className="text-[12px] font-medium tracking-[0.08px] text-[#767168]">
                  จบแล้ว
                </p>
                <p className="text-[11px] font-light tracking-[0.08px] text-[#b5b0a4]">
                  {closedPolls.length} รายการ
                </p>
              </div>
              <div className="flex flex-col gap-[10px]">
                {closedPolls.map((poll) => <PollCard key={poll.id} poll={poll} />)}
              </div>
            </div>
          )}
        </div>
      </div>
      <MemberBottomNav active="tools" />
    </main>
  );
}
