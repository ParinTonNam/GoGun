"use client";

import { useCallback, useEffect, useRef } from "react";

function cellKeyAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  return el?.closest<HTMLElement>("[data-daykey]")?.dataset.daykey ?? null;
}

/** Paint the chosen availability status by dragging, tapping, or keyboard. */
export function useDragPaint<T extends string>(params: {
  paintable: (key: string) => boolean;
  selectedValue: T;
  applyPaint: (key: string, value: T) => void;
}) {
  const callbacks = useRef(params);
  const activePointer = useRef<number | null>(null);
  const paintValue = useRef<T | null>(null);
  const painted = useRef<Set<string>>(new Set());

  useEffect(() => {
    callbacks.current = params;
  });

  const onCellPointerDown = useCallback(
    (key: string) => (event: React.PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary || !callbacks.current.paintable(key)) return;
      event.preventDefault();
      activePointer.current = event.pointerId;
      paintValue.current = callbacks.current.selectedValue;
      painted.current = new Set([key]);
      callbacks.current.applyPaint(key, paintValue.current);
    },
    [],
  );

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (event.pointerId !== activePointer.current || paintValue.current === null) return;
      const key = cellKeyAt(event.clientX, event.clientY);
      if (!key || painted.current.has(key) || !callbacks.current.paintable(key)) return;
      painted.current.add(key);
      callbacks.current.applyPaint(key, paintValue.current);
    };
    const end = (event: PointerEvent) => {
      if (event.pointerId !== activePointer.current) return;
      activePointer.current = null;
      paintValue.current = null;
      painted.current = new Set();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  const onCellClick = (key: string) => (event: React.MouseEvent) => {
    if (event.detail === 0 && callbacks.current.paintable(key)) {
      callbacks.current.applyPaint(key, callbacks.current.selectedValue);
    }
  };

  return { onCellPointerDown, onCellClick };
}
