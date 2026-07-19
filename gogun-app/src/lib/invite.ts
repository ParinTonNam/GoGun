// Invite links must point at whatever domain the app is actually served from,
// so they are built from window.location.origin at call time (all call sites
// are client components that render after data loads). The fallback only
// applies during SSR/prerender where no invite link is actually shown.
const FALLBACK_ORIGIN = "https://gogun.app";

export function inviteUrl(code: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : FALLBACK_ORIGIN;
  return `${origin}/t/${code}`;
}

export function inviteLinkLabel(code: string): string {
  return inviteUrl(code).replace(/^https?:\/\//, "");
}
