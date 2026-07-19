"use client";

import { use, useState } from "react";
import {
  getChecklist,
  getMe,
  checkItem,
  uncheckItem,
  addChecklistItem,
  deleteChecklistItem,
  type ChecklistItem,
  type User,
} from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { LoadError } from "@/components/load-error";
import { useLoad } from "@/lib/use-load";

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

export default function ChecklistPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [newText, setNewText] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function load() {
    const data = await getChecklist(tripId);
    setItems(data);
  }

  const { loading, error: loadError, retry } = useLoad(async () => {
    const [, user] = await Promise.all([load(), getMe()]);
    setMe(user);
  }, [tripId]);

  async function handleToggle(item: ChecklistItem) {
    if (toggling) return;
    setToggling(item.id);
    try {
      if (item.is_checked) {
        await uncheckItem(tripId, item.id);
      } else {
        await checkItem(tripId, item.id);
      }
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete(itemId: string) {
    try {
      await deleteChecklistItem(tripId, itemId);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAdd() {
    const t = newText.trim();
    if (!t || adding) return;
    setAdding(true);
    try {
      await addChecklistItem(tripId, t);
      setNewText("");
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  }

  const doneCount = items.filter((i) => i.is_checked).length;

  if (loadError) {
    return <LoadError message={loadError} onRetry={retry} />;
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
      <div className="flex w-full max-w-[420px] flex-col gap-[24px] pb-[100px] pt-[24px] px-[24px]">
        {/* Header */}
        <PageHeader
          title="เช็คลิสต์"
          backHref={`/trips/${tripId}/tools`}
          user={me}
          right={
            <p className="text-[11px] font-light tracking-[0.66px] text-[#767168]">
              {doneCount}/{items.length}
            </p>
          }
        />

        {/* Items list */}
        <div className="flex flex-col">
          {items.length === 0 && (
            <p className="py-[20px] text-center text-[13px] font-light text-[#767168]">
              ยังไม่มีรายการ
            </p>
          )}
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`flex items-center gap-[12px] py-[10px] ${
                i < items.length - 1 ? "border-b border-[#e5e1d7]" : ""
              }`}
            >
              <Checkbox
                checked={item.is_checked}
                onToggle={() => handleToggle(item)}
              />
              <p
                className={`flex-1 text-[14px] font-light tracking-[0.08px] ${
                  item.is_checked ? "line-through text-[#b5b0a4]" : "text-[#14110d]"
                }`}
              >
                {item.text}
              </p>
              {item.checked_by.length > 0 && (
                <div className="flex -space-x-[4px]">
                  {item.checked_by.slice(0, 3).map((u) => (
                    <div
                      key={u.id}
                      className="flex size-[18px] items-center justify-center rounded-full border border-white text-[9px] font-medium text-white"
                      style={{ backgroundColor: u.avatar_color }}
                    >
                      {u.display_name.slice(0, 1)}
                    </div>
                  ))}
                </div>
              )}
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
          ))}
        </div>

        {/* Add item */}
        <div className="flex items-start gap-[8px]">
          <div className="flex-1 border-b border-[#e5e1d7] pb-[15px] pt-[14px]">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="สิ่งที่ต้องทำ เช่น ทำ passport"
              className="w-full bg-transparent text-[14px] text-[#14110d] outline-none placeholder:text-[#757575]"
            />
          </div>
          <div className="pt-[5.5px]">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newText.trim() || adding}
              className="flex items-center gap-[8px] rounded-[14px] bg-[#14110d] p-[10px] disabled:opacity-40"
            >
              <img src="/images/icon-plus.svg" alt="" className="size-[20px]" />
              <p className="text-[13px] font-medium tracking-[0.13px] text-[#f7f5f0]">เพิ่ม</p>
            </button>
          </div>
        </div>
      </div>

    </main>
  );
}
