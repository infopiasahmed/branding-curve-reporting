import {
  format,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
} from "date-fns"
import { enUS } from "date-fns/locale"

const locale = enUS

export function todayISO(date = new Date()) {
  return format(date, "yyyy-MM-dd", { locale })
}

export function formatLongDate(date = new Date()) {
  return format(date, "EEEE, d MMMM", { locale })
}

export function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return format(date, "h:mm a", { locale })
}

export function formatRelative(iso: string) {
  const date = parseISO(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const minutes = Math.max(0, Math.floor(diffMs / 60000))
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24 && isToday(date)) return `${hours}h ago`
  if (isYesterday(date)) return "Yesterday"
  return format(date, "d MMM")
}

export function groupLabel(dateISO: string) {
  const date = parseISO(dateISO)
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  if (isTomorrow(date)) return "Tomorrow"
  return format(date, "EEEE, d MMMM")
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export function combineDateTime(dateISO: string, time: string) {
  return parseISO(`${dateISO}T${time.length === 5 ? `${time}:00` : time}`)
}

export function isSameCalendarDay(a: string, b: string) {
  return isSameDay(parseISO(a), parseISO(b))
}
