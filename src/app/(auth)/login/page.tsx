import { Suspense } from "react"
import { cookies } from "next/headers"
import { AgencyProvider } from "@/components/providers/agency-provider"
import { DEMO_SESSION_COOKIE } from "@/lib/auth/cookies"
import { LoginForm } from "./login-form"

export default async function LoginPage() {
  const initialUserId = (await cookies()).get(DEMO_SESSION_COOKIE)?.value ?? null

  return (
    <AgencyProvider initialUserId={initialUserId}>
      <div className="min-h-dvh bg-neutral-200/70">
        <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col justify-center bg-background px-6 py-10">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-foreground text-lg font-semibold text-background">
              BC
            </div>
            <p className="text-sm font-medium tracking-wide text-muted-foreground">
              Branding Curve
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Welcome back</h1>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </AgencyProvider>
  )
}
