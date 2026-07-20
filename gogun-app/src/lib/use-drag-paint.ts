"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// หา key ของ cell ที่อยู่ใต้พิกัดจอ (data-daykey) — ใช้ระหว่างลากเพราะบนมือถือ
// target ของ pointermove ค้างที่ช่องเริ่ม จึงต้องหา cell จริงจากพิกัดเอง
function cellKeyAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  const cell = el?.closest<HTMLElement>("[data-daykey]");
  return cell?.dataset.daykey ?? null;
}

/**
 * Drag-to-paint สำหรับตารางเลือกวันว่าง — ลากนิ้ว/เมาส์ยาว ๆ เพื่อ "ทาสี" หลายวันรวด
 * แทนการกดทีละช่อง ใช้ Pointer Events ชุดเดียวได้ทั้งมือถือและคอม
 *
 * โมเดล: กดที่ช่องแรก → คำนวณสถานะปลายทาง (วน 1 ที ผ่าน cycleNext) แล้วทาสถานะนั้น
 * ให้ทุกช่องที่ลากผ่าน (แตะเดี่ยว = ทาช่องเดียว = เท่ากับวนสถานะ 1 ที เหมือนเดิม)
 *
 * แต่ละ cell ต้องมี attribute `data-daykey="YYYY-MM-DD"` และเรียก `onCellPointerDown(key)`
 * ที่ onPointerDown เพื่อให้ hook หา cell ระหว่างลากด้วย elementFromPoint ได้
 * (บนมือถือ target ของ pointermove ค้างที่ช่องเริ่ม จึงต้องใช้พิกัดจอหา cell จริง)
 */
export function useDragPaint<T extends string>(params: {
  paintable: (key: string) => boolean;
  cycleNext: (key: string) => T;
  applyPaint: (key: string, value: T) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const paintValueRef = useRef<T | null>(null);
  const paintedRef = useRef<Set<string>>(new Set());

  // เก็บ callback ล่าสุดไว้ใน ref เพื่อให้ effect ไม่ต้อง re-bind ทุก render
  // (อัปเดตใน effect ไม่ใช่ระหว่าง render — pointer handler ยิงหลัง mount เสมอ)
  const cbRef = useRef(params);
  useEffect(() => {
    cbRef.current = params;
  });

  const onCellPointerDown = useCallback(
    (key: string) => (e: React.PointerEvent) => {
      if (!cbRef.current.paintable(key)) return;
      e.preventDefault(); // กัน text-selection / focus / เริ่ม scroll บนมือถือ
      const value = cbRef.current.cycleNext(key);
      paintValueRef.current = value;
      paintedRef.current = new Set([key]);
      cbRef.current.applyPaint(key, value);
      setDragging(true);
    },
    [],
  );

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      const value = paintValueRef.current;
      if (value == null) return;
      const key = cellKeyAt(e.clientX, e.clientY);
      if (!key || paintedRef.current.has(key)) return;
      if (!cbRef.current.paintable(key)) return;
      paintedRef.current.add(key);
      cbRef.current.applyPaint(key, value);
    };
    const end = () => {
      paintValueRef.current = null;
      paintedRef.current = new Set();
      setDragging(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [dragging]);

  return { dragging, onCellPointerDown };
}
