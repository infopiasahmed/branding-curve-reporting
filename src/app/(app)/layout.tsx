import { cookies } from "next/headers"
import { AppShell } from "@/components/app-shell"
import { AgencyProvider } from "@/components/providers/agency-provider"
import { DEMO_SESSION_COOKIE } from "@/lib/auth/cookies"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const initialUserId = (await cookies()).get(DEMO_SESSION_COOKIE)?.value ?? null
  return (
    <AgencyProvider initialUserId={initialUserId}>
      <AppShell>{children}</AppShell>
    </AgencyProvider>
  )
}
