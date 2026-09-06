"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { inviteMarketerAction } from "@/app/actions/invite-marketer"
import { clearCookie, DEMO_SESSION_COOKIE, writeCookie } from "@/lib/auth/cookies"
import { loadAgencyState } from "@/lib/data/agency"
import { saveClientRecord } from "@/lib/data/clients"
import { replaceActionItemsRecord, saveMeetingRecord, toggleActionItemRecord } from "@/lib/data/meetings"
import { saveReportRecord } from "@/lib/data/reports"
import { agencyStore } from "@/lib/data/store"
import { setUserAssignments } from "@/lib/data/team"
import { isSupabaseConfigured } from "@/lib/env"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type {
  AgencyState,
  Client,
  Meeting,
  MeetingActionItem,
  Profile,
  ReportTag,
} from "@/types/domain"

const emptyState: AgencyState = {
  profiles: [],
  clients: [],
  assignments: [],
  reports: [],
  meetings: [],
  activities: [],
}

type AgencyContextValue = {
  ready: boolean
  user: Profile | null
  state: AgencyState
  demoMode: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  saveReport: (input: {
    id?: string
    clientId: string
    reportDate: string
    content: string
    tomorrowPlan?: string
    tags: ReportTag[]
  }) => Promise<void>
  saveClient: (input: Omit<Client, "createdAt" | "updatedAt">) => Promise<Client>
  setAssignments: (userId: string, clientIds: string[]) => Promise<void>
  inviteMarketer: (input: {
    firstName: string
    lastName: string
    email: string
  }) => Promise<void>
  saveMeeting: (input: {
    id?: string
    clientId: string
    createdBy?: string
    title: string
    meetingDate: string
    meetingTime: string
    meetingType: Meeting["meetingType"]
    participantIds: string[]
    notes?: string
    actionItems?: MeetingActionItem[]
  }) => Promise<Meeting>
  toggleActionItem: (meetingId: string, itemId: string) => Promise<void>
  replaceActionItems: (meetingId: string, items: MeetingActionItem[]) => Promise<void>
}

const AgencyContext = createContext<AgencyContextValue | null>(null)

function snapshot() {
  return agencyStore.getState()
}

export function AgencyProvider({
  children,
  initialUserId,
}: {
  children: ReactNode
  initialUserId?: string | null
}) {
  const router = useRouter()
  const demoMode = !isSupabaseConfigured()
  const [sessionId, setSessionId] = useState(initialUserId ?? null)
  const [ready, setReady] = useState(demoMode)
  const [remoteState, setRemoteState] = useState<AgencyState>(emptyState)
  const [remoteUser, setRemoteUser] = useState<Profile | null>(null)
  const demoState = useSyncExternalStore(agencyStore.subscribe, snapshot, snapshot)

  const state = demoMode ? demoState : remoteState
  const user = demoMode
    ? (state.profiles.find((profile) => profile.id === sessionId) ?? null)
    : remoteUser

  const refreshRemote = useCallback(async () => {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    if (!authUser) {
      setRemoteUser(null)
      setRemoteState(emptyState)
      setSessionId(null)
      setReady(true)
      return
    }
    try {
      const loaded = await loadAgencyState(supabase, authUser.id)
      setRemoteUser(loaded.user)
      setRemoteState(loaded.state)
      setSessionId(loaded.user.id)
      setReady(true)
    } catch (error) {
      await supabase.auth.signOut()
      setRemoteUser(null)
      setRemoteState(emptyState)
      setSessionId(null)
      setReady(true)
      throw error
    }
  }, [])

  useEffect(() => {
    if (demoMode) {
      agencyStore.hydrate()
      return
    }
    const timer = window.setTimeout(() => {
      void refreshRemote().catch((error) => {
        toast.error(error instanceof Error ? error.message : "Could not load your workspace")
        setReady(true)
        router.replace("/login")
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [demoMode, refreshRemote, router])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (demoMode) {
        const profile = agencyStore.signIn(email, password)
        if (!profile.isActive) throw new Error("This account is inactive.")
        writeCookie(DEMO_SESSION_COOKIE, profile.id)
        setSessionId(profile.id)
        return
      }
      const supabase = createSupabaseBrowserClient()
      if (!supabase) throw new Error("Supabase is not configured")
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()
        if (!authUser) throw new Error("Could not start a session")
        const loaded = await loadAgencyState(supabase, authUser.id)
        setRemoteUser(loaded.user)
        setRemoteState(loaded.state)
        setSessionId(loaded.user.id)
      } catch (error) {
        await supabase.auth.signOut()
        throw error
      }
    },
    [demoMode]
  )

  const signOut = useCallback(async () => {
    if (!demoMode) {
      await createSupabaseBrowserClient()?.auth.signOut()
      setRemoteUser(null)
      setRemoteState(emptyState)
    }
    clearCookie(DEMO_SESSION_COOKIE)
    setSessionId(null)
    router.replace("/login")
    router.refresh()
  }, [demoMode, router])

  const value = useMemo<AgencyContextValue>(
    () => ({
      ready,
      user,
      state,
      demoMode,
      signIn,
      signOut,
      saveReport: async (input) => {
        if (!user) throw new Error("Not signed in")
        if (demoMode) {
          agencyStore.saveReport({ ...input, userId: user.id })
          return
        }
        const supabase = createSupabaseBrowserClient()
        if (!supabase) throw new Error("Supabase is not configured")
        await saveReportRecord(supabase, user.id, input)
        await refreshRemote()
      },
      saveClient: async (input) => {
        if (demoMode) return agencyStore.saveClient(input)
        const supabase = createSupabaseBrowserClient()
        if (!supabase) throw new Error("Supabase is not configured")
        const saved = await saveClientRecord(supabase, input)
        await refreshRemote()
        return saved
      },
      setAssignments: async (userId, clientIds) => {
        if (demoMode) {
          agencyStore.setAssignments(userId, clientIds)
          return
        }
        const supabase = createSupabaseBrowserClient()
        if (!supabase) throw new Error("Supabase is not configured")
        await setUserAssignments(supabase, userId, clientIds)
        await refreshRemote()
      },
      inviteMarketer: async (input) => {
        if (demoMode) {
          agencyStore.inviteMarketer(input)
          toast.success("Marketer added")
          return
        }
        const result = await inviteMarketerAction(input)
        if (!result.ok) throw new Error(result.message)
        toast.success(`Invitation sent to ${result.email}`)
        await refreshRemote()
      },
      saveMeeting: async (input) => {
        if (!user) throw new Error("Not signed in")
        if (demoMode) {
          return agencyStore.saveMeeting({ ...input, createdBy: input.createdBy ?? user.id })
        }
        const supabase = createSupabaseBrowserClient()
        if (!supabase) throw new Error("Supabase is not configured")
        const saved = await saveMeetingRecord(supabase, user.id, input)
        await refreshRemote()
        return saved
      },
      toggleActionItem: async (meetingId, itemId) => {
        if (!user) return
        if (demoMode) {
          agencyStore.toggleActionItem(meetingId, itemId, user.id)
          return
        }
        const supabase = createSupabaseBrowserClient()
        if (!supabase) return
        await toggleActionItemRecord(supabase, meetingId, itemId)
        await refreshRemote()
      },
      replaceActionItems: async (meetingId, items) => {
        if (demoMode) {
          agencyStore.replaceActionItems(meetingId, items)
          return
        }
        const supabase = createSupabaseBrowserClient()
        if (!supabase) return
        await replaceActionItemsRecord(supabase, meetingId, items)
        await refreshRemote()
      },
    }),
    [demoMode, ready, refreshRemote, signIn, signOut, state, user]
  )

  return <AgencyContext.Provider value={value}>{children}</AgencyContext.Provider>
}

export function useAgency() {
  const context = useContext(AgencyContext)
  if (!context) throw new Error("useAgency must be used within AgencyProvider")
  return context
}
