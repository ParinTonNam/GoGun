"use client";

import { use, useState } from "react";
import {
  getTrip,
  getMe,
  addMemberByName,
  renameMember,
  removeMember,
  getInitial,
  type Trip,
  type TripMember,
  type User,
} from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { LoadError } from "@/components/load-error";
import { useLoad } from "@/lib/use-load";
import { inviteUrl, inviteLinkLabel } from "@/lib/invite";

export default function MembersPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { loading, error: loadError, retry } = useLoad(async () => {
    const [t, user] = await Promise.all([getTrip(tripId), getMe()]);
    setTrip(t);
    setMe(user);
  }, [tripId]);

  async function addMember() {
    const name = nameInput.trim();
    if (!name || adding) return;
    setAdding(true);
    try {
      await addMemberByName(tripId, name);
      setNameInput("");
      setTrip(await getTrip(tripId));
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  }

  function startEdit(member: TripMember) {
    setEditingId(member.id);
    setEditValue(member.user.display_name);
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
    setEditError("");
  }

  async function saveEdit(userId: string) {
    const name = editValue.trim();
    if (!name || savingEdit) return;
    setSavingEdit(true);
    setEditError("");
    try {
      await renameMember(tripId, userId, name);
      setTrip(await getTrip(tripId));
      setEditingId(null);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "เปลี่ยนชื่อไม่สำเร็จ");
    } finally {
      setSavingEdit(false);
    }
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl(trip!.invite_code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleRemove(member: TripMember) {
    if (!window.confirm(`ลบ ${member.user.display_name} ออกจากทริปนี้?`)) return;
    setRemovingId(member.id);
    try {
      await removeMember(tripId, member.user_id);
      setTrip(await getTrip(tripId));
    } catch (e) {
      console.error(e);
    } finally {
      setRemovingId(null);
    }
  }

  if (loadError) {
    return <LoadError message={loadError} onRetry={retry} />;
  }

  if (loading || !trip) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
        <p className="text-[#767168]">กำลังโหลด...</p>
      </main>
    );
  }

  const inviteLink = inviteLinkLabel(trip.invite_code);

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex min-h-screen w-full max-w-[420px] flex-col pb-[24px] pt-[24px]">
        {/* Header */}
        <div className="px-[24px]">
          <PageHeader
            title="สมาชิก"
            backHref={`/trips/${tripId}`}
            user={me}
          />
        </div>

        {/* Add member input */}
        <div className="px-[24px] pb-[28px]">
          <div className="flex items-center gap-[8px]">
            <div className="flex-1 border-b border-[#e5e1d7] py-[14px]">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMember()}
                placeholder="ชื่อเล่น เช่น ฟ้า, ปอนด์"
                className="w-full bg-transparent text-[17px] text-[#14110d] outline-none placeholder:text-[#757575]"
              />
            </div>
            <button
              type="button"
              onClick={addMember}
              disabled={!nameInput.trim() || adding}
              className="flex h-[44px] shrink-0 items-center gap-[8px] rounded-[14px] bg-[#14110d] px-[18px] py-[12px] disabled:opacity-40"
            >
              <img src="/images/icon-plus.svg" alt="" className="size-[20px]" />
              <p className="text-[13px] font-medium tracking-[0.13px] text-[#f7f5f0]">เพิ่ม</p>
            </button>
          </div>
        </div>

        {/* Members section */}
        <div className="flex flex-col gap-[10px] px-[24px] pb-[28px]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[1.54px] text-[#767168]">MEMBERS</p>
            <p className="text-[12px] tracking-[0.12px] text-[#14110d]">{trip.members.length} คน</p>
          </div>
          <div className="flex flex-col">
            {trip.members.map((member, i) => (
              <div key={member.id}>
                {i > 0 && <div className="h-px bg-[#e5e1d7]" />}
                {editingId === member.id ? (
                  <div className="flex flex-col gap-[8px] py-[12px]">
                    <div className="flex items-center gap-[8px]">
                      <div
                        className="flex size-[40px] shrink-0 items-center justify-center rounded-[20px] text-[15px] font-medium text-white"
                        style={{ backgroundColor: member.user.avatar_color }}
                      >
                        {getInitial(member.user.display_name)}
                      </div>
                      <div className="flex-1 border-b border-[#e85a2c] py-[6px]">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(member.user_id);
                            if (e.key === "Escape") cancelEdit();
                          }}
                          autoFocus
                          className="w-full bg-transparent text-[15px] text-[#14110d] outline-none"
                        />
                      </div>
                    </div>
                    {editError && (
                      <p className="pl-[52px] text-[11px] text-red-500">{editError}</p>
                    )}
                    <div className="flex gap-[8px] pl-[52px]">
                      <button
                        type="button"
                        onClick={() => saveEdit(member.user_id)}
                        disabled={!editValue.trim() || savingEdit}
                        className="rounded-[10px] bg-[#14110d] px-[14px] py-[7px] text-[12px] font-medium text-white disabled:opacity-40"
                      >
                        บันทึก
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-[10px] border border-[#e5e1d7] px-[14px] py-[7px] text-[12px] font-medium text-[#14110d]"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-[12px] py-[12px]">
                    <div
                      className="flex size-[40px] shrink-0 items-center justify-center rounded-[20px] text-[15px] font-medium text-white"
                      style={{ backgroundColor: member.user.avatar_color }}
                    >
                      {getInitial(member.user.display_name)}
                    </div>
                    <div className="flex flex-1 flex-col gap-[2px]">
                      <p className="text-[14.5px] font-medium tracking-[0.08px] text-[#14110d]">
                        {member.user.display_name}
                      </p>
                      <p
                        className="text-[11px] font-medium tracking-[0.08px]"
                        style={{
                          color: member.role === "organizer" ? "#e85a2c" :
                                 member.status === "joined" ? "#2e8b5c" : "#d9a21b",
                        }}
                      >
                        {member.role === "organizer"
                          ? "คนจัดทริป · HOST"
                          : member.status === "joined"
                          ? "เข้าร่วมแล้ว"
                          : "รอเข้าร่วม"}
                      </p>
                    </div>
                    {member.role !== "organizer" && (
                      <div className="flex shrink-0 items-center gap-[14px]">
                        <button
                          type="button"
                          onClick={() => startEdit(member)}
                          className="text-[12px] font-medium tracking-[0.08px] text-[#767168]"
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(member)}
                          disabled={removingId === member.id}
                          className="flex size-[28px] items-center justify-center disabled:opacity-40"
                        >
                          <img src="/images/icon-trash.svg" alt="ลบ" className="size-[16px]" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Share invite link (secondary) */}
        <div className="px-[24px] pb-[28px]">
          <button
            type="button"
            onClick={copyInviteLink}
            className="flex w-full items-center gap-[10px] rounded-[12px] bg-[#f2efe8] px-[14px] py-[12px]"
          >
            <span className="relative h-[15px] w-[13px] shrink-0 opacity-60">
              <img src="/images/icon-share-a.svg" alt="" className="absolute inset-0 size-full" />
              <img src="/images/icon-share-b.svg" alt="" className="absolute inset-0 size-full" />
            </span>
            <p className="flex-1 truncate text-[12.5px] tracking-[0.08px] text-[#767168]">
              {inviteLink}
            </p>
            <p className="shrink-0 text-[12px] font-medium tracking-[0.08px] text-[#14110d]">
              {copied ? "คัดลอกแล้ว" : "แชร์ลิงก์"}
            </p>
          </button>
        </div>
      </div>
    </main>
  );
}
