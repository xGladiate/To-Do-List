import type { Task, TaskFilter, TaskPriority } from '../models/task.ts'

export type TaskDetails = {
  title: string
  description: string
  dueDate: string | null
  priority: TaskPriority
}

export function createTask(details: TaskDetails): Task {
  const now = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    title: details.title.trim(),
    description: details.description.trim(),
    completed: false,
    dueDate: details.dueDate || null,
    priority: details.priority,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  }
}

export function updateTask(tasks: Task[], taskId: string, details: TaskDetails): Task[] {
  return tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          title: details.title.trim(),
          description: details.description.trim(),
          dueDate: details.dueDate || null,
          priority: details.priority,
          updatedAt: new Date().toISOString(),
        }
      : task,
  )
}

export function toggleTask(tasks: Task[], taskId: string): Task[] {
  const now = new Date().toISOString()

  return tasks.map((task) => {
    if (task.id !== taskId) {
      return task
    }

    const completed = !task.completed

    return {
      ...task,
      completed,
      completedAt: completed ? now : null,
      updatedAt: now,
    }
  })
}

export function deleteTask(tasks: Task[], taskId: string): Task[] {
  return tasks.filter((task) => task.id !== taskId)
}

export function filterTasks(tasks: Task[], filter: TaskFilter, searchQuery: string): Task[] {
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase()

  return tasks.filter((task) => {
    const matchesStatus =
      filter === 'all' ||
      (filter === 'active' && !task.completed) ||
      (filter === 'completed' && task.completed)

    const searchableText = `${task.title} ${task.description}`.toLocaleLowerCase()
    const matchesSearch = normalizedQuery === '' || searchableText.includes(normalizedQuery)

    return matchesStatus && matchesSearch
  })
}
