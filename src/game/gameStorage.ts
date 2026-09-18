import {
  createInitialGameState,
  TREE_SPECIES,
  type GameState,
  type TreeSpecies,
} from './gameState.ts'

const STORAGE_KEY = 'todo.game.v1'

function isTreeSpecies(value: unknown): value is TreeSpecies {
  return typeof value === 'string' && TREE_SPECIES.includes(value as TreeSpecies)
}

function isGameState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false

  const state = value as Record<string, unknown>
  return (
    typeof state.currentPoints === 'number' &&
    state.currentPoints >= 0 &&
    isTreeSpecies(state.currentSpecies) &&
    typeof state.currentTreeStartedAt === 'string' &&
    Array.isArray(state.seedBag) &&
    state.seedBag.every(isTreeSpecies) &&
    Array.isArray(state.forest) &&
    typeof state.rewards === 'object' &&
    state.rewards !== null
  )
}

export function loadGameState(): GameState {
  const storedState = localStorage.getItem(STORAGE_KEY)

  if (storedState === null) return createInitialGameState()

  try {
    const parsedState: unknown = JSON.parse(storedState)
    return isGameState(parsedState) ? parsedState : createInitialGameState()
  } catch {
    return createInitialGameState()
  }
}

export function saveGameState(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
