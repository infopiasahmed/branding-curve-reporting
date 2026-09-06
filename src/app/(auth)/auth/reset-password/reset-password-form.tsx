"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

const INVITE_EXPIRED =
  "This invitation has expired. Ask your admin to resend it."
const INVITE_DENIED =
  "This invitation is no longer valid. Ask your admin to resend it."
const INVITE_VERIFY_FAILED =
  "We couldn't verify this invitation. Please try again or ask your admin to resend it."
const RECOVERY_INVALID = "This reset link is invalid or has expired. Request a new one."

type SetupBranch =
  | "url_error"
  | "invite_hash"
  | "token_hash"
  | "recovery_code"
  | "existing_session"
  | "none"

let setupInFlight: Promise<boolean> | null = null
let setupFingerprint: string | null = null
let inviteVerifyInFlight = false

function clearAuthParamsFromUrl() {
  window.history.replaceState({}, document.title, window.location.pathname)
}

function inviteErrorFromCode(error: string | null, errorCode: string | null) {
  const code = (errorCode ?? "").toLowerCase()
  const err = (error ?? "").toLowerCase()
  if (code === "otp_expired" || err === "otp_expired" || err.includes("otp_expired")) {
    return INVITE_EXPIRED
  }
  if (code === "access_denied" || err === "access_denied" || err.includes("access_denied")) {
    return INVITE_DENIED
  }
  return INVITE_VERIFY_FAILED
}

function isPrefetchSafeInvite(url: ReturnType<typeof readAuthUrl>) {
  return Boolean(url.tokenHash) && (url.queryType ?? "").toLowerCase() === "invite"
}

function readAuthUrl() {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  return {
    error: search.get("error") ?? hash.get("error"),
    errorCode: search.get("error_code") ?? hash.get("error_code"),
    queryType: search.get("type"),
    hashType: (hash.get("type") ?? "").toLowerCase(),
    accessToken: hash.get("access_token"),
    refreshToken: hash.get("refresh_token"),
    code: search.get("code"),
    tokenHash: search.get("token_hash"),
    hashPresent: Boolean(window.location.hash.replace(/^#/, "")),
  }
}

function urlFingerprint() {
  return `${window.location.search}\n${window.location.hash}`
}

function hasAuthParams(url: ReturnType<typeof readAuthUrl>) {
  return Boolean(
    url.error ||
      url.tokenHash ||
      url.code ||
      (url.hashType === "invite" && url.accessToken && url.refreshToken)
  )
}

// TEMP: remove after invite-flow verification
function tempInviteDiagnostic(fields: {
  branch: SetupBranch
  error_code: string | null
  queryType: string | null
  hashType: string
  hashPresent: boolean
  accessTokenPresent: boolean
  refreshTokenPresent: boolean
  tokenHashPresent: boolean
  codePresent: boolean
  setSessionSuccess?: boolean
  getSessionSuccess?: boolean
  getUserSuccess?: boolean
}) {
  if (process.env.NODE_ENV !== "development") return
  console.info("[TEMP invite-flow]", {
    pathname: window.location.pathname,
    branch: fields.branch,
    error_code: fields.error_code,
    queryType: fields.queryType,
    hashType: fields.hashType || null,
    hashPresent: fields.hashPresent,
    access_token_present: fields.accessTokenPresent,
    refresh_token_present: fields.refreshTokenPresent,
    token_hash_present: fields.tokenHashPresent,
    code_present: fields.codePresent,
    setSession_success: fields.setSessionSuccess ?? null,
    getSession_success: fields.getSessionSuccess ?? null,
    getUser_success: fields.getUserSuccess ?? null,
  })
}

function diagnosticBase(url: ReturnType<typeof readAuthUrl>) {
  return {
    error_code: url.errorCode,
    queryType: url.queryType,
    hashType: url.hashType,
    hashPresent: url.hashPresent,
    accessTokenPresent: Boolean(url.accessToken),
    refreshTokenPresent: Boolean(url.refreshToken),
    tokenHashPresent: Boolean(url.tokenHash),
    codePresent: Boolean(url.code),
  }
}

async function establishSetupSession(): Promise<boolean> {
  const url = readAuthUrl()
  const baseDiag = diagnosticBase(url)

  if (url.error) {
    tempInviteDiagnostic({ ...baseDiag, branch: "url_error" })
    throw new Error(inviteErrorFromCode(url.error, url.errorCode))
  }

  // Prefetch-safe token_hash invites are verified only from the Continue button.
  if (isPrefetchSafeInvite(url)) {
    tempInviteDiagnostic({ ...baseDiag, branch: "token_hash" })
    throw new Error(INVITE_VERIFY_FAILED)
  }

  if (url.hashType === "invite" && url.accessToken && url.refreshToken) {
    const accessToken = url.accessToken
    const refreshToken = url.refreshToken
    clearAuthParamsFromUrl()

    const supabase = createSupabaseBrowserClient()
    if (!supabase) throw new Error("Password setup is only available when the database is connected.")

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    tempInviteDiagnostic({
      ...baseDiag,
      branch: "invite_hash",
      setSessionSuccess: !sessionError,
      getSessionSuccess: Boolean(session),
      getUserSuccess: Boolean(user),
    })
    if (sessionError || !session || !user) throw new Error(INVITE_DENIED)
    return true
  }

  if (url.tokenHash) {
    tempInviteDiagnostic({ ...baseDiag, branch: "none" })
    throw new Error(INVITE_VERIFY_FAILED)
  }

  if (url.code) {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) throw new Error("Password setup is only available when the database is connected.")
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(url.code)
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    tempInviteDiagnostic({
      ...baseDiag,
      branch: "recovery_code",
      getSessionSuccess: Boolean(session),
      getUserSuccess: Boolean(user),
    })
    if (exchangeError || !session || !user) throw new Error(RECOVERY_INVALID)
    clearAuthParamsFromUrl()
    return false
  }

  const supabase = createSupabaseBrowserClient()
  if (!supabase) throw new Error("Password setup is only available when the database is connected.")
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (session && user) {
    tempInviteDiagnostic({
      ...baseDiag,
      branch: "existing_session",
      getSessionSuccess: true,
      getUserSuccess: true,
    })
    return Boolean(user.invited_at)
  }

  tempInviteDiagnostic({
    ...baseDiag,
    branch: "none",
    getSessionSuccess: Boolean(session),
    getUserSuccess: Boolean(user),
  })
  throw new Error("Open the invitation or password reset link from your email.")
}

function beginSetup() {
  const url = readAuthUrl()
  const fingerprint = urlFingerprint()
  if (!setupInFlight || (hasAuthParams(url) && fingerprint !== setupFingerprint)) {
    setupFingerprint = fingerprint
    setupInFlight = establishSetupSession()
  }
  return setupInFlight
}

export function ResetPasswordForm() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [pendingInvite, setPendingInvite] = useState(false)
  const [isInvite, setIsInvite] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function setupFromUrl() {
      const url = readAuthUrl()

      if (url.error) {
        if (!cancelled) setLinkError(inviteErrorFromCode(url.error, url.errorCode))
        return
      }

      // token_hash invites stay unverified until the user presses Continue.
      if (isPrefetchSafeInvite(url)) {
        tempInviteDiagnostic({ ...diagnosticBase(url), branch: "token_hash" })
        if (!cancelled) setPendingInvite(true)
        return
      }

      try {
        const inviteFlow = await beginSetup()
        if (cancelled) return
        setIsInvite(inviteFlow)
        setReady(true)
      } catch (error) {
        if (cancelled) return
        setLinkError(error instanceof Error ? error.message : "Could not open this link")
      }
    }

    void setupFromUrl()
    return () => {
      cancelled = true
    }
  }, [])

  async function onContinueInvite() {
    if (verifying || inviteVerifyInFlight) return
    inviteVerifyInFlight = true
    setVerifying(true)
    try {
      const url = readAuthUrl()
      if (!isPrefetchSafeInvite(url) || !url.tokenHash) {
        setLinkError(INVITE_VERIFY_FAILED)
        return
      }

      const supabase = createSupabaseBrowserClient()
      if (!supabase) {
        setLinkError("Password setup is only available when the database is connected.")
        return
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: url.tokenHash,
        type: "invite",
      })
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      tempInviteDiagnostic({
        ...diagnosticBase(url),
        branch: "token_hash",
        getSessionSuccess: Boolean(session),
        getUserSuccess: Boolean(user),
      })

      if (verifyError) {
        setLinkError(inviteErrorFromCode(verifyError.message, verifyError.code ?? null))
        return
      }
      if (!session || !user) {
        setLinkError(INVITE_VERIFY_FAILED)
        return
      }

      clearAuthParamsFromUrl()
      setIsInvite(true)
      setPendingInvite(false)
      setReady(true)
    } finally {
      inviteVerifyInFlight = false
      setVerifying(false)
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 8) {
      toast.error("Use at least 8 characters")
      return
    }
    if (password !== confirm) {
      toast.error("Passwords do not match")
      return
    }
    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      toast.error("Password setup is only available when the database is connected.")
      return
    }
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!session || !user) {
      toast.error(isInvite ? INVITE_VERIFY_FAILED : RECOVERY_INVALID)
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      await supabase.auth.signOut()
      clearAuthParamsFromUrl()
      router.replace(isInvite ? "/login?setup=1" : "/login?reset=1")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update password")
    } finally {
      setSubmitting(false)
    }
  }

  if (linkError) {
    return (
      <div className="space-y-5">
        <p className="rounded-xl border border-border bg-white px-4 py-5 text-sm leading-6 text-muted-foreground">
          {linkError}
        </p>
        <p className="text-center text-sm">
          <Link
            href="/login"
            className="text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Back to login
          </Link>
        </p>
      </div>
    )
  }

  if (pendingInvite && !ready) {
    return (
      <div className="space-y-5">
        <p className="text-center text-sm leading-6 text-muted-foreground">
          Continue to verify your invitation and create your password.
        </p>
        <Button
          type="button"
          size="xl"
          className="w-full"
          disabled={verifying}
          onClick={() => {
            void onContinueInvite()
          }}
        >
          {verifying ? "Verifying..." : "Continue to set password"}
        </Button>
        <p className="text-center text-sm">
          <Link
            href="/login"
            className="text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Back to login
          </Link>
        </p>
      </div>
    )
  }

  if (!ready) {
    return <p className="text-center text-sm text-muted-foreground">Opening your link...</p>
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 rounded-xl bg-white px-3.5 text-base"
          required
          minLength={8}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className="h-12 rounded-xl bg-white px-3.5 text-base"
          required
          minLength={8}
        />
      </div>
      <Button type="submit" size="xl" className="w-full" disabled={submitting}>
        {submitting ? "Saving..." : "Save password"}
      </Button>
    </form>
  )
}
