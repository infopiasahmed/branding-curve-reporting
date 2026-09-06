"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, FileText, Home, Plus, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/clients", label: "Clients", icon: FileText },
  { href: "/report", label: "Report", icon: Plus, prominent: true },
  { href: "/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: UserRound },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] border-t border-border bg-white/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md"
      aria-label="Main"
    >
      <ul className="grid grid-cols-5 items-end px-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          if (item.prominent) {
            return (
              <li key={item.href} className="flex justify-center">
                <Link
                  href={item.href}
                  className="-mt-6 flex flex-col items-center gap-1"
                >
                  <span className="flex size-14 items-center justify-center rounded-full bg-foreground text-background shadow-[0_8px_20px_rgba(20,16,12,0.18)]">
                    <Icon className="size-6" />
                  </span>
                  <span className="text-[11px] font-medium text-foreground">
                    {item.label}
                  </span>
                </Link>
              </li>
            )
          }
          return (
            <li key={item.href}>
                <Link
                href={item.href}
                suppressHydrationWarning
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px]",
                  active ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
