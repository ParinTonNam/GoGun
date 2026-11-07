"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TripWorkspace } from "@/components/trip-workspace";

const DEMO_PATH = "/trips/demo";
const ALLOWED_PATHS = new Set([
  DEMO_PATH,
  `${DEMO_PATH}/plan`,
  `${DEMO_PATH}/expenses`,
  `${DEMO_PATH}/group`,
  `${DEMO_PATH}/settings`,
  `${DEMO_PATH}/profile`,
  `${DEMO_PATH}/notifications`,
  `${DEMO_PATH}/trip`,
  `${DEMO_PATH}/recommend`,
  `${DEMO_PATH}/tools/wheel`,
  `${DEMO_PATH}/tools/vote`,
  `${DEMO_PATH}/tools/checklist`,
]);

export default function DemoLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const router = useRouter();
  const allowed = ALLOWED_PATHS.has(pathname);

  useEffect(() => {
    if (allowed) return;
    const replacement = pathname === `${DEMO_PATH}/itinerary`
      || pathname === `${DEMO_PATH}/availability`
      ? `${DEMO_PATH}/plan`
      : pathname === `${DEMO_PATH}/member/wallet`
      ? `${DEMO_PATH}/expenses`
      : pathname === `${DEMO_PATH}/tools`
      ? `${DEMO_PATH}/group`
      : DEMO_PATH;
    router.replace(replacement);
  }, [allowed, pathname, router]);

  if (!allowed) return null;
  return <TripWorkspace tripId="demo">{children}</TripWorkspace>;
}
