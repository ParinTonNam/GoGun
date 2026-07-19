import type { Metadata } from "next";
import InviteClient from "./invite-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

type Props = { params: Promise<{ inviteCode: string }> };

// Runs on the server so shared links (LINE, etc.) get a real preview instead
// of the root "GoGun" title. The join endpoint is public, so no auth here.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { inviteCode } = await params;
  try {
    const res = await fetch(`${API_BASE}/trips/join/${inviteCode}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    // API responses are wrapped in a { data } envelope (see req() in lib/api.ts)
    const json: {
      data?: {
        name: string;
        destination: string;
        duration_days: number;
        members: { status: string }[];
      };
    } = await res.json();
    const trip = json.data;
    if (!trip) throw new Error("empty data");

    const memberCount = trip.members.filter((m) => m.status === "joined").length;
    const title = `ชวนเข้าทริป ${trip.name} · GoGun`;
    const description = `${trip.destination} · ${trip.duration_days} วัน · ${memberCount} คน — กดเพื่อเข้าร่วมทริป`;
    return {
      title,
      description,
      openGraph: { title, description, siteName: "GoGun", type: "website" },
    };
  } catch {
    // A bad code or unreachable API must not 500 the page — fall back to the
    // generic title and let the client render its own error state.
    return { title: "GoGun", description: "ไปกัน GOGUN" };
  }
}

export default async function InvitePage({ params }: Props) {
  const { inviteCode } = await params;
  return <InviteClient inviteCode={inviteCode} />;
}
