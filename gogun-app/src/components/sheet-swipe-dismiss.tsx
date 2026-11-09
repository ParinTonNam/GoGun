"use client";

import { useEffect } from "react";

type Drag = {
  pointerId: number;
  startY: number;
  distance: number;
  sheet: HTMLElement;
  close: () => void;
  moveProperty: "transform" | "translate";
};

// The handle is the only drag target, so scrolling forms and lists still works.
export function SheetSwipeDismiss() {
  useEffect(() => {
    let drag: Drag | null = null;
    let resetTimer: number | undefined;

    function onPointerDown(event: PointerEvent) {
      if (event.button !== 0 || !(event.target instanceof Element)) return;
      const handle = event.target.closest(".maew-plan-modal-handle");
      const sheet = handle?.closest<HTMLElement>(".maew-plan-modal-sheet, .maew-fav-sheet, .responsive-sheet");
      const backdrop = sheet?.closest<HTMLElement>(".maew-plan-modal-backdrop");
      const closeButton = sheet?.querySelector<HTMLElement>("[data-sheet-swipe-close]");
      if (!sheet || (!backdrop && !closeButton) || backdrop?.classList.contains("is-closing")) return;
      window.clearTimeout(resetTimer);
      sheet.style.transition = "none";
      drag = {
        pointerId: event.pointerId, startY: event.clientY, distance: 0, sheet,
        close: () => { if (backdrop) backdrop.click(); else closeButton?.click(); },
        moveProperty: sheet.classList.contains("responsive-sheet") ? "transform" : "translate",
      };
    }

    function onPointerMove(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      drag.distance = Math.max(0, event.clientY - drag.startY);
      if (drag.distance > 4) {
        if (drag.moveProperty === "transform") drag.sheet.style.transform = `translateY(${drag.distance}px)`;
        else drag.sheet.style.translate = `0 ${drag.distance}px`;
      }
    }

    function finish(event: PointerEvent, cancelled = false) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const { sheet, close, distance, moveProperty } = drag;
      drag = null;
      if (!cancelled && distance >= 80) {
        sheet.style.removeProperty("transition");
        close();
        return;
      }
      sheet.style.transition = `${moveProperty} 180ms ease-out`;
      if (moveProperty === "transform") sheet.style.transform = "translateY(0px)";
      else sheet.style.translate = "0 0px";
      resetTimer = window.setTimeout(() => {
        if (!sheet.isConnected) return;
        sheet.style.removeProperty(moveProperty);
        sheet.style.removeProperty("transition");
      }, 180);
    }

    const onPointerUp = (event: PointerEvent) => finish(event);
    const onPointerCancel = (event: PointerEvent) => finish(event, true);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerCancel);
    return () => {
      window.clearTimeout(resetTimer);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerCancel);
    };
  }, []);

  return null;
}
