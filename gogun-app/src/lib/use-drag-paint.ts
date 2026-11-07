"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// หา key ของ cell ที่อยู่ใต้พิกัดจอ (data-daykey) — ใช้ระหว่างลากเพราะบนมือถือ
// target ของ pointermove ค้างที่ช่องเริ่ม จึงต้องหา cell จริงจากพิกัดเอง
function cellKeyAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  const cell = el?.closest<HTMLElement>("[data-daykey]");
  return cell?.dataset.daykey ?? null;
}

/** Paint the explicitly selected status with pointer, keyboard or assistive activation. */
export function useDragPaint<T extends string>(params: {
  paintable: (key: string) => boolean;
  selectedValue: T;
  applyPaint: (key: string, value: T) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const paintValueRef = useRef<T | null>(null);
  const paintedRef = useRef<Set<string>>(new Set());
  const touchTapRef = useRef(false);

  // เก็บ callback ล่าสุดไว้ใน ref เพื่อให้ effect ไม่ต้อง re-bind ทุก render
  // (อัปเดตใน effect ไม่ใช่ระหว่าง render — pointer handler ยิงหลัง mount เสมอ)
  const cbRef = useRef(params);
  useEffect(() => {
    cbRef.current = params;
  });

  const onCellPointerDown = useCallback(
    (key: string) => (e: React.PointerEvent) => {
      if (e.button !== 0 || !e.isPrimary || !cbRef.current.paintable(key)) return;
      // On a phone, let a vertical swipe scroll the page. A completed tap
      // paints via onClick; mouse and pen users can still drag across days.
      if (e.pointerType === "touch") {
        touchTapRef.current = true;
        return;
      }
      touchTapRef.current = false;
      e.preventDefault(); // กัน text-selection / focus / เริ่ม scroll บนมือถือ
      const value = cbRef.current.selectedValue;
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

  const onCellClick = (key: string) => (e: React.MouseEvent) => {
    // Pointer presses are already painted, except touch taps. Keyboard and
    // assistive activation also arrive with detail 0.
    if ((e.detail === 0 || touchTapRef.current) && cbRef.current.paintable(key)) {
      cbRef.current.applyPaint(key, cbRef.current.selectedValue);
    }
    touchTapRef.current = false;
  };
  return { dragging, onCellPointerDown, onCellClick };
}
