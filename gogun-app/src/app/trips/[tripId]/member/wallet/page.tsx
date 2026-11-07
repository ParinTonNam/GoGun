import { redirect } from "next/navigation";

export default async function LegacyTripPage({ params, searchParams }: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tripId } = await params;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.set(key, value);
  }
  const suffix = query.size ? `?${query}` : "";
  redirect(`/trips/${tripId}/expenses${suffix}`);
}
