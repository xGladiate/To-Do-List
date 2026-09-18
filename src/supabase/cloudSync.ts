import type { GameState } from '../game/gameState.ts'
import { parseGameState } from '../game/gameStorage.ts'
import type { Task, TaskPriority } from '../models/task.ts'
import { isSupabaseConfigured, supabase } from './supabaseClient.ts'

type TaskRow = {
  id: string
  user_id: string
  title: string
  description: string
  completed: boolean
  due_at: string | null
  priority: TaskPriority
  created_at: string
  updated_at: string
  completed_at: string | null
}

export type CloudStatus = 'local' | 'connecting' | 'synced' | 'saving' | 'error'

export type CloudInitialization = {
  connected: boolean
  tasks: Task[]
  gameState: GameState
  message?: string
}

let connectedUserId: string | null = null
let saveQueue: Promise<void> = Promise.resolve()

function taskToRow(task: Task, userId: string): TaskRow {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    description: task.description,
    completed: task.completed,
    due_at: task.dueAt,
    priority: task.priority,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    completed_at: task.completedAt,
  }
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: row.completed,
    dueAt: row.due_at,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  }
}

async function saveCloudState(tasks: Task[], gameState: GameState): Promise<void> {
  if (supabase === null || connectedUserId === null) return

  const userId = connectedUserId
  const { error: deleteError } = await supabase.from('tasks').delete().eq('user_id', userId)

  if (deleteError !== null) throw deleteError

  if (tasks.length > 0) {
    const { error: insertError } = await supabase
      .from('tasks')
      .insert(tasks.map((task) => taskToRow(task, userId)))

    if (insertError !== null) throw insertError
  }

  const { error: gameError } = await supabase.from('game_states').upsert({
    user_id: userId,
    state: gameState,
    updated_at: new Date().toISOString(),
  })

  if (gameError !== null) throw gameError
}

export async function initializeCloudSync(
  localTasks: Task[],
  localGameState: GameState,
): Promise<CloudInitialization> {
  if (!isSupabaseConfigured || supabase === null) {
    return { connected: false, tasks: localTasks, gameState: localGameState }
  }

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError !== null) throw sessionError

    const user = sessionData.session?.user ?? null

    if (user === null || user.is_anonymous) {
      connectedUserId = null
      return { connected: false, tasks: localTasks, gameState: localGameState }
    }

    connectedUserId = user.id

    const [taskResult, gameResult] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('game_states').select('state').eq('user_id', user.id).maybeSingle(),
    ])

    if (taskResult.error !== null) throw taskResult.error
    if (gameResult.error !== null) throw gameResult.error

    const hasCloudState = taskResult.data.length > 0 || gameResult.data !== null

    if (!hasCloudState) {
      await saveCloudState(localTasks, localGameState)
      return { connected: true, tasks: localTasks, gameState: localGameState }
    }

    const cloudGameState = parseGameState(gameResult.data?.state)

    return {
      connected: true,
      tasks: (taskResult.data as TaskRow[]).map(rowToTask),
      gameState: cloudGameState ?? localGameState,
    }
  } catch (error) {
    connectedUserId = null
    return {
      connected: false,
      tasks: localTasks,
      gameState: localGameState,
      message: error instanceof Error ? error.message : 'Cloud connection failed.',
    }
  }
}

export function queueCloudSave(
  tasks: Task[],
  gameState: GameState,
  onStatusChange: (status: CloudStatus, message?: string) => void,
): void {
  if (supabase === null || connectedUserId === null) return

  const taskSnapshot = structuredClone(tasks)
  const gameSnapshot = structuredClone(gameState)
  onStatusChange('saving')

  saveQueue = saveQueue
    .then(() => saveCloudState(taskSnapshot, gameSnapshot))
    .then(() => onStatusChange('synced'))
    .catch((error: unknown) => {
      onStatusChange('error', error instanceof Error ? error.message : 'Cloud save failed.')
    })
}
