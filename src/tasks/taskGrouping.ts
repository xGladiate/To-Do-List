import type { Task, TaskPriority } from '../models/task.ts'

export type TaskGroupKey = 'overdue' | 'today' | 'upcoming' | 'anytime'

export type TaskGroup = {
  key: TaskGroupKey
  label: string
  tasks: Task[]
}

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function compareActiveTasks(first: Task, second: Task): number {
  const priorityDifference = PRIORITY_ORDER[first.priority] - PRIORITY_ORDER[second.priority]

  if (priorityDifference !== 0) {
    return priorityDifference
  }

  if (first.dueAt !== null && second.dueAt !== null) {
    return new Date(first.dueAt).getTime() - new Date(second.dueAt).getTime()
  }

  return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
}

export function groupActiveTasks(tasks: Task[], now = new Date()): TaskGroup[] {
  const todayKey = getLocalDateKey(now)
  const grouped: Record<TaskGroupKey, Task[]> = {
    overdue: [],
    today: [],
    upcoming: [],
    anytime: [],
  }

  tasks.forEach((task) => {
    if (task.dueAt === null) {
      grouped.anytime.push(task)
      return
    }

    const dueDate = new Date(task.dueAt)

    if (Number.isNaN(dueDate.getTime())) {
      grouped.anytime.push(task)
    } else if (dueDate.getTime() < now.getTime()) {
      grouped.overdue.push(task)
    } else if (getLocalDateKey(dueDate) === todayKey) {
      grouped.today.push(task)
    } else {
      grouped.upcoming.push(task)
    }
  })

  const labels: Record<TaskGroupKey, string> = {
    overdue: 'Overdue',
    today: 'Today',
    upcoming: 'Upcoming',
    anytime: 'Anytime',
  }

  return (Object.keys(grouped) as TaskGroupKey[])
    .map((key) => ({
      key,
      label: labels[key],
      tasks: grouped[key].sort(compareActiveTasks),
    }))
    .filter((group) => group.tasks.length > 0)
}

export function sortCompletedTasks(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (first, second) =>
      new Date(second.completedAt ?? second.updatedAt).getTime() -
      new Date(first.completedAt ?? first.updatedAt).getTime(),
  )
}

export function countCompletedThisWeek(tasks: Task[], now = new Date()): number {
  const weekStart = new Date(now)
  const dayFromMonday = (weekStart.getDay() + 6) % 7
  weekStart.setDate(weekStart.getDate() - dayFromMonday)
  weekStart.setHours(0, 0, 0, 0)

  return tasks.filter((task) => {
    if (task.completedAt === null) {
      return false
    }

    return new Date(task.completedAt).getTime() >= weekStart.getTime()
  }).length
}

export function countDueToday(tasks: Task[], now = new Date()): number {
  const todayKey = getLocalDateKey(now)

  return tasks.filter((task) => {
    if (task.completed || task.dueAt === null) {
      return false
    }

    const dueDate = new Date(task.dueAt)
    return !Number.isNaN(dueDate.getTime()) && getLocalDateKey(dueDate) === todayKey
  }).length
}
