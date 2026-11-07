"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { resetDemoTripData } from "@/lib/demo-trip-data";

export function DemoEntryLink({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    resetDemoTripData();
    if (window.location.pathname.replace(/\/$/, "") === "/trips/demo") {
      event.preventDefault();
      window.location.reload();
    }
  }

  return <Link href="/trips/demo" className={className} onClick={handleClick}>{children}</Link>;
}
