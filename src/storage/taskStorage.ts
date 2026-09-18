import type { Task } from '../models/task.ts'

const STORAGE_KEY = 'todo.tasks.v1'

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const task = value as Record<string, unknown>

  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.completed === 'boolean' &&
    typeof task.createdAt === 'string' &&
    typeof task.updatedAt === 'string' &&
    (typeof task.completedAt === 'string' || task.completedAt === null)
  )
}

export function loadTasks(): Task[] {
  const storedTasks = localStorage.getItem(STORAGE_KEY)

  if (storedTasks === null) {
    return []
  }

  try {
    const parsedTasks: unknown = JSON.parse(storedTasks)
    return Array.isArray(parsedTasks) ? parsedTasks.filter(isTask) : []
  } catch {
    return []
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}
