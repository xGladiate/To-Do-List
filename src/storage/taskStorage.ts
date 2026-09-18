import type { Task } from '../models/task.ts'

const STORAGE_KEY = 'todo.tasks.v1'

export function loadTasks(): Task[] {
  const storedTasks = localStorage.getItem(STORAGE_KEY)

  if (storedTasks === null) {
    return []
  }

  try {
    const parsedTasks: unknown = JSON.parse(storedTasks)
    return Array.isArray(parsedTasks) ? (parsedTasks as Task[]) : []
  } catch {
    return []
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}
