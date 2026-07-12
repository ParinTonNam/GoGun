"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPacking,
  addPackingItem,
  deletePackingItem,
  checkPackingItem,
  uncheckPackingItem,
  type PackingItem,
  type User,
} from "@/lib/api";

function Checkbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex size-[22px] shrink-0 items-center justify-center rounded-[7px] border ${
        checked ? "border-[#14110d] bg-[#14110d]" : "border-[#d4cfc2]"
      }`}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function AvatarStack({ users }: { users: Pick<User, "id" | "display_name" | "avatar_color">[] }) {
  if (users.length === 0) return null;
  return (
    <div className="flex -space-x-[4px]">
      {users.slice(0, 4).map((u) => (
        <div
          key={u.id}
          className="flex size-[16px] items-center justify-center rounded-full border-[0.8px] border-white text-[8px] font-medium text-white"
          style={{ backgroundColor: u.avatar_color }}
        >
          {u.display_name.slice(0, 1)}
        </div>
      ))}
    </div>
  );
}

export default function PackingListPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  // Add form
  const [newText, setNewText] = useState("");
  const [newCategory, setNewCategory] = useState<"shared" | "personal">("shared");
  const [adding, setAdding] = useState(false);

  async function load() {
    const data = await getPacking(tripId);
    setItems(data);
  }

  useEffect(() => {
    load().catch(console.error).finally(() => setLoading(false));
  }, [tripId]);

  async function handleToggle(item: PackingItem) {
    if (toggling) return;
    setToggling(item.id);
    try {
      if (item.is_checked) {
        await uncheckPackingItem(tripId, item.id);
      } else {
        await checkPackingItem(tripId, item.id);
      }
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(null);
    }
  }

  async function handleAdd() {
    const t = newText.trim();
    if (!t || adding) return;
    setAdding(true);
    try {
      await addPackingItem(tripId, t, newCategory);
      setNewText("");
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(itemId: string) {
    try {
      await deletePackingItem(tripId, itemId);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  const sharedItems = items.filter((i) => i.category === "shared");
  const personalItems = items.filter((i) => i.category === "personal");
  const sharedDone = sharedItems.filter((i) => i.is_checked).length;
  const personalDone = personalItems.filter((i) => i.is_checked).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5f0]">
        <p className="text-[#767168]">กำลังโหลด...</p>
      </main>
    );
  }

  function ItemRow({ item, isLast }: { item: PackingItem; isLast: boolean }) {
    return (
      <div className={`flex items-center gap-[12px] py-[10px] ${!isLast ? "border-b border-[#e5e1d7]" : ""}`}>
        <Checkbox checked={item.is_checked} onToggle={() => handleToggle(item)} />
        <p className={`flex-1 text-[14px] font-light tracking-[0.08px] ${item.is_checked ? "line-through text-[#b5b0a4]" : "text-[#14110d]"}`}>
          {item.text}
        </p>
        {item.category === "shared" && <AvatarStack users={item.assignees} />}
        {item.checked_by.length > 0 && <AvatarStack users={item.checked_by} />}
        <button
          type="button"
          onClick={() => handleDelete(item.id)}
          className="flex size-[28px] shrink-0 items-center justify-center rounded-[8px] bg-[#f2efe8] active:bg-[#fde8e0]"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1L9 9M9 1L1 9" stroke="#767168" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-[#f7f5f0]">
      <div className="flex w-full max-w-[420px] flex-col gap-[24px] pb-[100px] pt-[65px] px-[24px]">
        {/* Header */}
        <div className="flex items-center gap-[12px]">
          <button
            type="button"
            onClick={() => router.push(`/trips/${tripId}/tools`)}
            className="flex size-[36px] shrink-0 items-center justify-center rounded-[18.5px] border border-[#e5e1d7] bg-white"
          >
            <img src="/images/icon-chevron-left.svg" alt="" className="size-[14px]" />
          </button>
          <p className="flex-1 text-[22px] font-medium tracking-[0.08px] text-[#14110d]">Packing List</p>
        </div>

        {/* Section: ของกลาง */}
        {sharedItems.length > 0 && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between pb-[8px]">
              <p className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">ของกลาง</p>
              <p className="text-[10.5px] font-light tracking-[0.63px] text-[#767168]">
                {sharedDone}/{sharedItems.length}
              </p>
            </div>
            {sharedItems.map((item, i) => (
              <ItemRow key={item.id} item={item} isLast={i === sharedItems.length - 1} />
            ))}
          </div>
        )}

        {/* Section: ของส่วนตัว */}
        {personalItems.length > 0 && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between pb-[8px]">
              <p className="text-[13px] font-medium tracking-[0.08px] text-[#14110d]">ของส่วนตัว · ใครต้องเตรียมเอง</p>
              <p className="text-[10.5px] font-light tracking-[0.63px] text-[#767168]">
                {personalDone}/{personalItems.length}
              </p>
            </div>
            {personalItems.map((item, i) => (
              <ItemRow key={item.id} item={item} isLast={i === personalItems.length - 1} />
            ))}
          </div>
        )}

        {items.length === 0 && (
          <div className="flex items-center justify-center rounded-[16px] border border-[#e5e1d7] bg-white px-[20px] py-[30px]">
            <p className="text-[13px] font-light text-[#767168]">ยังไม่มีรายการ</p>
          </div>
        )}

        {/* Add item form */}
        <div className="flex flex-col gap-[10px]">
          {/* Category toggle */}
          <div className="flex gap-[6px]">
            <button
              type="button"
              onClick={() => setNewCategory("shared")}
              className={`rounded-full px-[14px] py-[6px] text-[12px] font-medium transition-colors ${
                newCategory === "shared" ? "bg-[#14110d] text-white" : "bg-[#f2efe8] text-[#767168]"
              }`}
            >
              ของกลาง
            </button>
            <button
              type="button"
              onClick={() => setNewCategory("personal")}
              className={`rounded-full px-[14px] py-[6px] text-[12px] font-medium transition-colors ${
                newCategory === "personal" ? "bg-[#14110d] text-white" : "bg-[#f2efe8] text-[#767168]"
              }`}
            >
              ส่วนตัว
            </button>
          </div>
          {/* Input row */}
          <div className="flex items-center gap-[8px]">
            <div className="flex-1 border-b border-[#e5e1d7] pb-[13px] pt-[12px]">
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder={newCategory === "shared" ? "ของกลาง เช่น adapter…" : "ของส่วนตัว เช่น หมวก…"}
                className="w-full bg-transparent text-[15px] text-[#14110d] outline-none placeholder:text-[#b5b0a4]"
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newText.trim() || adding}
              className="flex size-[44px] shrink-0 items-center justify-center rounded-[12px] bg-[#14110d] disabled:opacity-40"
            >
              <img src="/images/icon-plus.svg" alt="" className="size-[20px]" />
            </button>
          </div>
        </div>
      </div>

    </main>
  );
}
