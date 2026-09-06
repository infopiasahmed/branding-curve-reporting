import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { DEMO_SESSION_COOKIE } from "@/lib/auth/cookies"
import { isSupabaseConfigured } from "@/lib/env"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLogin = pathname === "/login"
  const isAuthRecovery =
    pathname === "/auth/forgot-password" || pathname === "/auth/reset-password"
  const isPublic =
    isLogin ||
    isAuthRecovery ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/favicon.ico"

  if (isSupabaseConfigured()) {
    let response = NextResponse.next({ request })
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (pathname === "/") {
      const url = request.nextUrl.clone()
      url.pathname = user ? "/home" : "/login"
      return NextResponse.redirect(url)
    }
    if (!user && !isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
    if (user && isLogin) {
      const url = request.nextUrl.clone()
      url.pathname = "/home"
      return NextResponse.redirect(url)
    }
    return response
  }

  const demoUser = request.cookies.get(DEMO_SESSION_COOKIE)?.value
  if (!demoUser && !isPublic && pathname !== "/") {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }
  if (demoUser && isLogin) {
    const url = request.nextUrl.clone()
    url.pathname = "/home"
    return NextResponse.redirect(url)
  }
  if (pathname === "/") {
    const url = request.nextUrl.clone()
    url.pathname = demoUser ? "/home" : "/login"
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
