import type { Task, TaskPriority } from '../models/task.ts'
import { dateOnlyToEndOfDayIso } from '../utils/dateTime.ts'

const STORAGE_KEY = 'todo.tasks.v5'
const V4_STORAGE_KEY = 'todo.tasks.v4'
const V3_STORAGE_KEY = 'todo.tasks.v3'
const V2_STORAGE_KEY = 'todo.tasks.v2'
const V1_STORAGE_KEY = 'todo.tasks.v1'

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

function hasV2Fields(value: unknown): value is Record<string, unknown> {
  return (
    hasBaseTaskFields(value) &&
    typeof value.description === 'string' &&
    (typeof value.dueDate === 'string' || value.dueDate === null) &&
    isPriority(value.priority)
  )
}

function hasV3Fields(value: unknown): value is Record<string, unknown> {
  return (
    hasBaseTaskFields(value) &&
    typeof value.description === 'string' &&
    (typeof value.dueAt === 'string' || value.dueAt === null) &&
    isPriority(value.priority)
  )
}

function isTask(value: unknown): value is Task {
  return hasV3Fields(value)
}

function parseTaskArray(storedTasks: string): unknown[] {
  try {
    const parsedTasks: unknown = JSON.parse(storedTasks)
    return Array.isArray(parsedTasks) ? parsedTasks : []
  } catch {
    return []
  }
}

function migrateV2Tasks(storedTasks: string): Task[] {
  return parseTaskArray(storedTasks)
    .filter(hasV2Fields)
    .map((task) => ({
      id: task.id as string,
      title: task.title as string,
      description: task.description as string,
      completed: task.completed as boolean,
      dueAt: typeof task.dueDate === 'string' ? dateOnlyToEndOfDayIso(task.dueDate) : null,
      priority: task.priority as TaskPriority,
      createdAt: task.createdAt as string,
      updatedAt: task.updatedAt as string,
      completedAt: task.completedAt as string | null,
    }))
}

function migrateV1Tasks(storedTasks: string): Task[] {
  return parseTaskArray(storedTasks)
    .filter(hasBaseTaskFields)
    .map((task) => ({
      id: task.id as string,
      title: task.title as string,
      description: '',
      completed: task.completed as boolean,
      dueAt: null,
      priority: 'medium',
      createdAt: task.createdAt as string,
      updatedAt: task.updatedAt as string,
      completedAt: task.completedAt as string | null,
    }))
}

function migrateV3Tasks(storedTasks: string): Task[] {
  return parseTaskArray(storedTasks)
    .filter(hasV3Fields)
    .map((task) => ({
      id: task.id as string,
      title: task.title as string,
      description: task.description as string,
      completed: task.completed as boolean,
      dueAt: task.dueAt as string | null,
      priority: task.priority as TaskPriority,
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

  const v4Tasks = localStorage.getItem(V4_STORAGE_KEY)

  if (v4Tasks !== null) {
    const migratedTasks = migrateV3Tasks(v4Tasks)
    saveTasks(migratedTasks)
    return migratedTasks
  }

  const v3Tasks = localStorage.getItem(V3_STORAGE_KEY)

  if (v3Tasks !== null) {
    const migratedTasks = migrateV3Tasks(v3Tasks)
    saveTasks(migratedTasks)
    return migratedTasks
  }

  const v2Tasks = localStorage.getItem(V2_STORAGE_KEY)

  if (v2Tasks !== null) {
    const migratedTasks = migrateV2Tasks(v2Tasks)
    saveTasks(migratedTasks)
    return migratedTasks
  }

  const v1Tasks = localStorage.getItem(V1_STORAGE_KEY)

  if (v1Tasks === null) {
    return []
  }

  const migratedTasks = migrateV1Tasks(v1Tasks)
  saveTasks(migratedTasks)
  return migratedTasks
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}
