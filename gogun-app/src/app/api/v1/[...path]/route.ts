import { NextRequest, NextResponse } from "next/server"

const COOKIE_NAME = "gogun_session"
const SESSION_SECONDS = 7 * 24 * 60 * 60
const MAX_BODY_BYTES = 1024 * 1024
const NO_STORE = { "Cache-Control": "no-store" }
type Context = { params: Promise<{ path: string[] }> }

function sessionCookie(request: NextRequest) {
  const protocol = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "")
  return {
    httpOnly: true,
    secure: protocol === "https",
    sameSite: "strict" as const,
    path: "/api/v1",
    maxAge: SESSION_SECONDS,
  }
}

function error(status: number, message: string) {
  return NextResponse.json({ error: { message } }, { status, headers: NO_STORE })
}

async function upstream(request: NextRequest, path: string, token?: string) {
  const base = (process.env.GOGUN_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1").replace(/\/$/, "")
  const url = `${base}/${path}${request.nextUrl.search}`
  const headers = new Headers()
  const contentType = request.headers.get("content-type")
  if (contentType) headers.set("content-type", contentType)
  headers.set("accept", "application/json")
  if (token) headers.set("authorization", `Bearer ${token}`)
  // Preserve the client address for the API's rate limiter behind this proxy.
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor)

  let body: ArrayBuffer | undefined
  if (request.method !== "GET" && request.method !== "HEAD") {
    const length = Number(request.headers.get("content-length"))
    if (length > MAX_BODY_BYTES) return error(413, "Request body is too large")
    body = await request.arrayBuffer()
    if (body.byteLength > MAX_BODY_BYTES) return error(413, "Request body is too large")
  }

  try {
    return await fetch(url, { method: request.method, headers, body, cache: "no-store", redirect: "manual" })
  } catch {
    return error(502, "API is unavailable")
  }
}

function isTokenResponse(method: string, path: string) {
  return method === "POST" && (
    ["auth/login", "auth/register", "auth/google", "auth/link", "auth/link/google"].includes(path) ||
    /^trips\/join\/[^/]+\/(guest|claim\/[^/]+)$/.test(path)
  )
}

async function handler(request: NextRequest, context: Context) {
  const { path: segments } = await context.params
  const path = segments.map(encodeURIComponent).join("/")
  const unsafe = !["GET", "HEAD"].includes(request.method)
  const host = request.headers.get("host")
  const protocol = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "")
  const expectedOrigin = host ? `${protocol}://${host}` : request.nextUrl.origin

  // The browser sends Origin on same-origin writes. Reject cross-origin and
  // originless writes because the browser now sends a session cookie itself.
  if (unsafe && request.headers.get("origin") !== expectedOrigin) {
    return error(403, "Invalid request origin")
  }

  if (request.method === "POST" && path === "auth/logout") {
    const response = NextResponse.json({ data: null }, { headers: NO_STORE })
    response.cookies.set(COOKIE_NAME, "", { ...sessionCookie(request), maxAge: 0 })
    return response
  }

  if (request.method === "POST" && path === "auth/migrate") {
    if (request.cookies.has(COOKIE_NAME)) return NextResponse.json({ data: null }, { headers: NO_STORE })
    const match = /^Bearer ([A-Za-z0-9._-]+)$/.exec(request.headers.get("authorization") || "")
    if (!match) return error(401, "Missing legacy session")
    const check = await upstream(new NextRequest(new URL("/api/v1/auth/me", request.url)), "auth/me", match[1])
    if (check instanceof NextResponse) return check
    if (!check.ok) return error(401, "Legacy session has expired")
    const response = NextResponse.json({ data: null }, { headers: NO_STORE })
    response.cookies.set(COOKIE_NAME, match[1], sessionCookie(request))
    return response
  }

  const result = await upstream(request, path, request.cookies.get(COOKIE_NAME)?.value)
  if (result instanceof NextResponse) return result

  const headers = new Headers(NO_STORE)
  headers.set("content-type", result.headers.get("content-type") || "application/json")
  const retryAfter = result.headers.get("retry-after")
  if (retryAfter) headers.set("retry-after", retryAfter)

  if (result.ok && isTokenResponse(request.method, path)) {
    let json: { data?: { token?: string; user?: unknown; trip_id?: string } }
    try { json = await result.json() } catch { return error(502, "Invalid authentication response") }
    const payload = json.data
    const token = payload?.token
    if (!token) return error(502, "Missing session in authentication response")
    const data = path === "auth/link" || path === "auth/link/google" ? payload.user : { ...payload }
    if (typeof data === "object" && data !== null && "token" in data) delete data.token
    const response = NextResponse.json({ data }, { status: result.status, headers })
    response.cookies.set(COOKIE_NAME, token, sessionCookie(request))
    return response
  }

  return new NextResponse(request.method === "HEAD" ? null : await result.arrayBuffer(), { status: result.status, headers })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const HEAD = handler
