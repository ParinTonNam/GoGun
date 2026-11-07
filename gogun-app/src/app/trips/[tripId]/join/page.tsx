"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTripWorkspace } from "@/components/trip-workspace";
export default function LegacyJoinPage() {
  const { trip } = useTripWorkspace();
  const router = useRouter();
  useEffect(() => { router.replace(`/t/${encodeURIComponent(trip.invite_code)}`); }, [router, trip.invite_code]);
  return <main className="workspace-page"><p role="status">กำลังเปิดหน้าลิงก์เชิญ…</p></main>;
}
