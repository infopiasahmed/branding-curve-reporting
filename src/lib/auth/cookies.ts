export const DEMO_SESSION_COOKIE = "bc_demo_user"

export function readCookie(name: string) {
  if (typeof document === "undefined") return null
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : null
}

export function writeCookie(name: string, value: string, maxAge = 60 * 60 * 24 * 30) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=lax`
}

export function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`
}
