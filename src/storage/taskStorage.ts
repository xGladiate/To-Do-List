import type { Task, TaskPriority } from '../models/task.ts'

const STORAGE_KEY = 'todo.tasks.v2'
const LEGACY_STORAGE_KEY = 'todo.tasks.v1'

function isPriority(value: unknown): value is TaskPriority {
  return value === 'low' || value === 'medium' || value === 'high'
}

function hasBaseTaskFields(value: unknown): value is Record<string, unknown> {
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

function isTask(value: unknown): value is Task {
  if (!hasBaseTaskFields(value)) {
    return false
  }

  return (
    typeof value.description === 'string' &&
    (typeof value.dueDate === 'string' || value.dueDate === null) &&
    isPriority(value.priority)
  )
}

function parseTaskArray(storedTasks: string): unknown[] {
  try {
    const parsedTasks: unknown = JSON.parse(storedTasks)
    return Array.isArray(parsedTasks) ? parsedTasks : []
  } catch {
    return []
  }
}

function migrateLegacyTasks(storedTasks: string): Task[] {
  return parseTaskArray(storedTasks)
    .filter(hasBaseTaskFields)
    .map((task) => ({
      id: task.id as string,
      title: task.title as string,
      description: '',
      completed: task.completed as boolean,
      dueDate: null,
      priority: 'medium',
      createdAt: task.createdAt as string,
      updatedAt: task.updatedAt as string,
      completedAt: task.completedAt as string | null,
    }))
}

export function loadTasks(): Task[] {
  const storedTasks = localStorage.getItem(STORAGE_KEY)

  if (storedTasks !== null) {
    return parseTaskArray(storedTasks).filter(isTask)
  }

  const legacyTasks = localStorage.getItem(LEGACY_STORAGE_KEY)

  if (legacyTasks === null) {
    return []
  }

  const migratedTasks = migrateLegacyTasks(legacyTasks)
  saveTasks(migratedTasks)
  return migratedTasks
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}
