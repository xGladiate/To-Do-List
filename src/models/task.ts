export type TaskPriority = 'low' | 'medium' | 'high'

export type TaskView = 'todo' | 'completed'

export type Task = {
  id: string
  title: string
  description: string
  completed: boolean
  dueAt: string | null
  priority: TaskPriority
  createdAt: string
  updatedAt: string
  completedAt: string | null
}
