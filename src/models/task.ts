export type TaskPriority = 'low' | 'medium' | 'high'

export type TaskFilter = 'all' | 'active' | 'completed'

export type Task = {
  id: string
  title: string
  description: string
  completed: boolean
  dueDate: string | null
  priority: TaskPriority
  createdAt: string
  updatedAt: string
  completedAt: string | null
}
