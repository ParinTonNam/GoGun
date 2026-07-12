"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPolls, getTrip, getMe,
  vote, unvote, createPoll, closePoll, deletePoll,
  type Poll, type Trip, type User,
} from "@/lib/api";

function AvatarStack({ voters }: { voters: Pick<User, "id" | "display_name" | "avatar_color">[] }) {
  if (voters.length === 0) return null;
  const STEP = 12;
  const totalW = 16 + (voters.length - 1) * STEP;
  return (
    <div className="relative h-[16px] shrink-0" style={{ width: totalW }}>
      {voters.map((v, i) => (
        <div
          key={v.id}
          className="absolute top-0 flex h-[16px] w-[16px] items-center justify-center rounded-[8px] border-[0.8px] border-white text-[8px] font-medium text-white"
          style={{ left: i * STEP, backgroundColor: v.avatar_color }}
        >
          {v.display_name.slice(0, 1)}
        </div>
      ))}
    </div>
  );
}

export default function VotePage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = use(params);
  const router = useRouter();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);
  const [creating, setCreating] = useState(false);

  async function load() {
    const data = await getPolls(tripId);
    setPolls(data);
  }

  useEffect(() => {
    Promise.all([getPolls(tripId), getTrip(tripId), getMe()])
      .then(([polls, trip, me]) => {
        setPolls(polls);
        setTrip(trip);
        setMe(me);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tripId]);

  const isOrganizer = !!(me && trip && me.id === trip.organizer_id);
  const openCount = polls.filter((p) => p.status === "open").length;

  async function handleVote(pollId: string, optionId: string, currentVote: string | null) {
    if (voting) return;
    setVoting(pollId);
    try {
      if (currentVote === optionId) {
        await unvote(tripId, pollId);
      } else {
        await vote(tripId, pollId, optionId);
      }
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setVoting(null);
    }
  }

  async function handleClose(pollId: string) {
    if (closing) return;
    setClosing(pollId);
    try {
      await closePoll(tripId, pollId);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setClosing(null);
    }
  }

  async function handleDelete(pollId: string) {
    if (deleting) return;
    setDeleting(pollId);
    try {
      await deletePoll(tripId, pollId);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  }

  async function handleCreate() {
    const title = newTitle.trim();
    const opts = newOptions.map((o) => o.trim()).filter(Boolean);
    if (!title || opts.length < 2 || creating) return;
    setCreating(true);
    try {
      await createPoll(tripId, {
        title,
        subtitle: newSubtitle.trim() || undefined,
        options: opts.map((text, i) => ({ text, sort_order: i })),
      });
      setShowCreate(false);
      setNewTitle("");
      setNewSubtitle("");
      setNewOptions(["", ""]);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  function updateOption(i: number, val: string) {
    setNewOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));
  }

  function addOption() {
    setNewOptions((prev) => [...prev, ""]);
  }

  function removeOption(i: number) {
    if (newOptions.length <= 2) return;
    setNewOptions((prev) => prev.filter((_, idx) => idx !== i));
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
        <p className="text-[#767168]">กำลังโหลด...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col pb-[60px] pt-[65px] px-[24px]">
        {/* Header */}
        <div className="flex items-center gap-[12px] pb-[18px] pt-[4px]">
          <button
            type="button"
            onClick={() => router.push(`/trips/${tripId}/tools`)}
            className="flex size-[36px] shrink-0 items-center justify-center rounded-[18.5px] border border-[#e5e1d7] bg-white"
          >
            <img src="/images/icon-chevron-left.svg" alt="" className="size-[14px]" />
          </button>
          <p className="flex-1 text-[22px] font-medium tracking-[0.08px] text-[#14110d]">โหวต</p>
          {openCount > 0 && (
            <p className="text-[11px] font-light tracking-[0.66px] text-[#767168]">{openCount} เปิดอยู่</p>
          )}
          {isOrganizer && (
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="flex size-[32px] shrink-0 items-center justify-center rounded-[10px] bg-[#14110d]"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2V12M2 7H12" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Create poll form */}
        {showCreate && (
          <div className="mb-[14px] rounded-[16px] border border-[#e5e1d7] bg-white p-[16px]">
            <p className="pb-[12px] text-[13px] font-medium text-[#14110d]">สร้างโหวตใหม่</p>

            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="หัวข้อโหวต *"
              className="mb-[8px] w-full rounded-[10px] bg-[#f7f5f0] px-[12px] py-[10px] text-[13px] text-[#14110d] outline-none placeholder:text-[#b5b0a4]"
            />
            <input
              type="text"
              value={newSubtitle}
              onChange={(e) => setNewSubtitle(e.target.value)}
              placeholder="คำอธิบายเพิ่มเติม (ไม่บังคับ)"
              className="mb-[14px] w-full rounded-[10px] bg-[#f7f5f0] px-[12px] py-[10px] text-[13px] text-[#14110d] outline-none placeholder:text-[#b5b0a4]"
            />

            <p className="pb-[8px] text-[11px] font-medium uppercase tracking-[1px] text-[#767168]">ตัวเลือก</p>
            {newOptions.map((opt, i) => (
              <div key={i} className="mb-[6px] flex items-center gap-[6px]">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`ตัวเลือกที่ ${i + 1}`}
                  className="flex-1 rounded-[10px] bg-[#f7f5f0] px-[12px] py-[10px] text-[13px] text-[#14110d] outline-none placeholder:text-[#b5b0a4]"
                />
                {newOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8]"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1 1L9 9M9 1L1 9" stroke="#767168" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addOption}
              className="mt-[4px] flex items-center gap-[6px] py-[6px] text-[12px] font-medium text-[#767168]"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1V11M1 6H11" stroke="#767168" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              เพิ่มตัวเลือก
            </button>

            <div className="mt-[14px] flex gap-[8px]">
              <button
                type="button"
                onClick={() => { setShowCreate(false); setNewTitle(""); setNewSubtitle(""); setNewOptions(["", ""]); }}
                className="flex-1 rounded-[12px] border border-[#e5e1d7] py-[11px] text-[13px] font-medium text-[#767168]"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newTitle.trim() || newOptions.filter((o) => o.trim()).length < 2 || creating}
                className="flex-1 rounded-[12px] bg-[#14110d] py-[11px] text-[13px] font-medium text-white disabled:opacity-40"
              >
                สร้าง
              </button>
            </div>
          </div>
        )}

        {/* Poll cards */}
        <div className="flex flex-col gap-[14px]">
          {polls.length === 0 && !showCreate && (
            <div className="flex items-center justify-center rounded-[16px] border border-[#e5e1d7] bg-white px-[20px] py-[30px]">
              <p className="text-[13px] font-light text-[#767168]">ยังไม่มีการโหวต</p>
            </div>
          )}
          {polls.map((poll) => {
            const myVoteOptionId = poll.my_vote_option_id;
            const totalVotes = poll.options.reduce((sum, o) => sum + o.vote_count, 0) || 1;

            return (
              <div
                key={poll.id}
                className="w-full rounded-[16px] border border-[#e5e1d7] bg-white pb-[11px] pt-[15px] px-[15px]"
              >
                {/* Poll header */}
                <div className="flex items-start justify-between pb-[4px]">
                  <p className="flex-1 text-[14.5px] font-medium tracking-[0.08px] text-[#14110d]">
                    {poll.title}
                  </p>
                  <div className="flex items-center gap-[8px] pl-[8px] pt-[3px]">
                    {isOrganizer && poll.status === "open" && (
                      <button
                        type="button"
                        onClick={() => handleClose(poll.id)}
                        disabled={closing === poll.id}
                        className="text-[10px] font-medium uppercase tracking-[0.8px] text-[#767168] disabled:opacity-40"
                      >
                        ปิด
                      </button>
                    )}
                    {isOrganizer && (
                      <button
                        type="button"
                        onClick={() => handleDelete(poll.id)}
                        disabled={deleting === poll.id}
                        className="flex size-[20px] items-center justify-center disabled:opacity-40"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1 1L9 9M9 1L1 9" stroke="#b5b0a4" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                    {!isOrganizer && (
                      <p className="text-[10px] font-light uppercase tracking-[1.2px] text-[#767168]">
                        {poll.status === "open" ? "เปิด" : "ปิด"}
                      </p>
                    )}
                  </div>
                </div>
                {poll.subtitle && (
                  <p className="pb-[12px] text-[11.5px] font-light tracking-[0.08px] text-[#767168]">
                    {poll.subtitle}
                  </p>
                )}

                {/* Options */}
                {poll.options.map((opt) => {
                  const pct = (opt.vote_count / totalVotes) * 100;
                  const isUserChoice = myVoteOptionId === opt.id;
                  const isWinner = opt.is_winner;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        poll.status === "open" && handleVote(poll.id, opt.id, myVoteOptionId ?? null)
                      }
                      disabled={poll.status === "closed" || voting === poll.id}
                      className={`flex w-full items-center gap-[12px] border-t border-[#e5e1d7] pb-[10px] pt-[11px] ${
                        poll.status === "open" ? "cursor-pointer" : "cursor-default"
                      }`}
                    >
                      <div className="flex flex-1 flex-col gap-[4px] min-w-0">
                        <div className="flex items-center gap-[8px]">
                          {(isUserChoice || isWinner) && (
                            <div className="h-[12px] w-[3px] shrink-0 rounded-full bg-[#e85a2c]" />
                          )}
                          <p className="text-left text-[13px] leading-normal text-[#14110d]">
                            {opt.text}
                          </p>
                        </div>
                        <div className="h-[4px] w-full overflow-clip rounded-[2px] bg-[#f2efe8]">
                          <div
                            className="h-full rounded-[2px] bg-[#e85a2c] transition-all duration-300"
                            style={{ width: opt.vote_count === 0 ? "1px" : `${pct}%` }}
                          />
                        </div>
                      </div>
                      {opt.voters.length > 0 && <AvatarStack voters={opt.voters} />}
                      <p className="w-[22px] shrink-0 text-right text-[11px] font-light text-[#767168]">
                        {opt.vote_count}
                      </p>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
