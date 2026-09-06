"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAgency } from "@/components/providers/agency-provider"
import { DEMO_PASSWORD } from "@/lib/data/seed"

export function LoginForm() {
  const { signIn, demoMode } = useAgency()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (searchParams.get("setup") === "1") {
      toast.success("Account ready. Sign in with your new password.")
    } else if (searchParams.get("reset") === "1") {
      toast.success("Password updated. Sign in with your new password.")
    }
  }, [searchParams])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
      router.replace("/home")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not log in")
    } finally {
      setSubmitting(false)
    }
  }

  async function demo(nextEmail: string) {
    setEmail(nextEmail)
    setPassword(DEMO_PASSWORD)
    setSubmitting(true)
    try {
      await signIn(nextEmail, DEMO_PASSWORD)
      router.replace("/home")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not log in")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 rounded-xl bg-white px-3.5 text-base"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 rounded-xl bg-white px-3.5 text-base"
          required
        />
      </div>
      {!demoMode ? (
        <p className="-mt-2 text-right">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </p>
      ) : null}
      <Button type="submit" size="xl" className="w-full" disabled={submitting}>
        {submitting ? "Signing in..." : "Login"}
      </Button>
      {demoMode ? (
        <div className="pt-2 text-center">
          <p className="text-xs text-muted-foreground">Demo access</p>
          <div className="mt-2 flex justify-center gap-2">
            <Button type="button" variant="ghost" onClick={() => demo("rahim@brandingcurve.com")}>
              Marketer
            </Button>
            <Button type="button" variant="ghost" onClick={() => demo("farhan@brandingcurve.com")}>
              Admin
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  )
}
