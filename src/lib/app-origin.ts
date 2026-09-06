import { headers } from "next/headers"

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"])
const DEFAULT_ORIGIN = "http://127.0.0.1:3005"

export async function getInviteRedirectTo() {
  const origin = await getAppOrigin()
  return `${origin}/auth/reset-password`
}

async function getAppOrigin() {
  const configured = parseConfiguredOrigin(process.env.APP_ORIGIN)
  if (configured) return configured

  const headerStore = await headers()
  const hostHeader = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? ""
  const host = hostHeader.split(",")[0]?.trim() ?? ""
  const hostname = host.split(":")[0]?.toLowerCase() ?? ""
  if (!hostname || !LOCAL_HOSTS.has(hostname)) {
    return DEFAULT_ORIGIN
  }
  const proto = headerStore.get("x-forwarded-proto") === "https" ? "https" : "http"
  return `${proto}://${host}`
}

function parseConfiguredOrigin(raw: string | undefined) {
  const value = raw?.trim().replace(/\/+$/, "")
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    if (url.username || url.password) return null
    if (url.pathname !== "/" || url.search || url.hash) return null
    return url.origin
  } catch {
    return null
  }
}
