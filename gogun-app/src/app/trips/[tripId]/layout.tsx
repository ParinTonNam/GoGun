import type { ReactNode } from "react";
import { TripWorkspace } from "@/components/trip-workspace";

export default async function TripLayout({ children, params }: {
  children: ReactNode;
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  return <TripWorkspace tripId={tripId}>{children}</TripWorkspace>;
}
