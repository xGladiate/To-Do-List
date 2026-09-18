export type DueDateDisplay = {
  label: string
  overdue: boolean
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function dateTimeLocalToIso(value: string): string | null {
  if (value === '') {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function isoToDateTimeLocal(value: string | null): string {
  if (value === null) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${getLocalDateKey(date)}T${hours}:${minutes}`
}

export function dateOnlyToEndOfDayIso(value: string): string | null {
  const date = new Date(`${value}T23:59:00`)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function formatDueAt(dueAt: string, completed: boolean): DueDateDisplay {
  const dueDate = new Date(dueAt)

  if (Number.isNaN(dueDate.getTime())) {
    return { label: 'Invalid deadline', overdue: false }
  }

  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dueDateKey = getLocalDateKey(dueDate)
  const todayKey = getLocalDateKey(now)
  const tomorrowKey = getLocalDateKey(tomorrow)
  const overdue = !completed && dueDate.getTime() < now.getTime()
  const time = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(dueDate)

  if (dueDateKey === todayKey) {
    return { label: overdue ? `Overdue · Today, ${time}` : `Today · ${time}`, overdue }
  }

  if (dueDateKey === tomorrowKey) {
    return { label: `Tomorrow · ${time}`, overdue }
  }

  const date = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: dueDate.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  }).format(dueDate)

  return {
    label: overdue ? `Overdue · ${date}, ${time}` : `${date} · ${time}`,
    overdue,
  }
}
