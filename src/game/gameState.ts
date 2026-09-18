import type { Task, TaskPriority } from '../models/task.ts'

export const POINTS_PER_TREE = 200

export const TREE_SPECIES = [
  'oak',
  'cherry',
  'pine',
  'maple',
  'willow',
  'golden-rain',
] as const

export type TreeSpecies = (typeof TREE_SPECIES)[number]
export type TreeStage = 'seed' | 'sprout' | 'sapling' | 'growing'

export type TaskReward = {
  points: number
  earnedAt: string
  active: boolean
  planted: boolean
}

export type GrownTree = {
  id: string
  species: TreeSpecies
  completedAt: string
  number: number
}

export type GameState = {
  currentPoints: number
  currentSpecies: TreeSpecies
  currentTreeStartedAt: string
  seedBag: TreeSpecies[]
  forest: GrownTree[]
  rewards: Record<string, TaskReward>
}

export type GameUpdate = {
  state: GameState
  grownTrees: GrownTree[]
}

const REWARD_POINTS: Record<TaskPriority, number> = {
  low: 5,
  medium: 10,
  high: 20,
}

export const TREE_LABELS: Record<TreeSpecies, string> = {
  oak: 'Oak',
  cherry: 'Cherry blossom',
  pine: 'Pine',
  maple: 'Maple',
  willow: 'Willow',
  'golden-rain': 'Golden rain tree',
}

function randomIndex(maximum: number): number {
  const values = new Uint32Array(1)
  crypto.getRandomValues(values)
  return values[0] % maximum
}

function shuffledSpecies(avoidFirst?: TreeSpecies): TreeSpecies[] {
  const species = [...TREE_SPECIES]

  for (let index = species.length - 1; index > 0; index -= 1) {
    const target = randomIndex(index + 1)
    ;[species[index], species[target]] = [species[target], species[index]]
  }

  if (avoidFirst !== undefined && species[species.length - 1] === avoidFirst) {
    ;[species[0], species[species.length - 1]] = [species[species.length - 1], species[0]]
  }

  return species
}

function drawSpecies(seedBag: TreeSpecies[], previous?: TreeSpecies): {
  species: TreeSpecies
  seedBag: TreeSpecies[]
} {
  const bag = seedBag.length > 0 ? [...seedBag] : shuffledSpecies(previous)
  return { species: bag.pop()!, seedBag: bag }
}

export function createInitialGameState(): GameState {
  const firstDraw = drawSpecies(shuffledSpecies())

  return {
    currentPoints: 0,
    currentSpecies: firstDraw.species,
    currentTreeStartedAt: new Date().toISOString(),
    seedBag: firstDraw.seedBag,
    forest: [],
    rewards: {},
  }
}

function settleTrees(state: GameState): GameUpdate {
  const grownTrees: GrownTree[] = []

  while (state.currentPoints >= POINTS_PER_TREE) {
    let pointsToPlant = POINTS_PER_TREE

    Object.values(state.rewards)
      .filter((reward) => reward.active && !reward.planted)
      .sort((first, second) => first.earnedAt.localeCompare(second.earnedAt))
      .forEach((reward) => {
        if (pointsToPlant >= reward.points) {
          reward.planted = true
          pointsToPlant -= reward.points
        }
      })

    const grownTree: GrownTree = {
      id: crypto.randomUUID(),
      species: state.currentSpecies,
      completedAt: new Date().toISOString(),
      number: state.forest.length + 1,
    }
    const nextDraw = drawSpecies(state.seedBag, state.currentSpecies)

    state.currentPoints -= POINTS_PER_TREE
    state.forest.push(grownTree)
    state.currentSpecies = nextDraw.species
    state.seedBag = nextDraw.seedBag
    state.currentTreeStartedAt = new Date().toISOString()
    grownTrees.push(grownTree)
  }

  return { state, grownTrees }
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    seedBag: [...state.seedBag],
    forest: state.forest.map((tree) => ({ ...tree })),
    rewards: Object.fromEntries(
      Object.entries(state.rewards).map(([taskId, reward]) => [taskId, { ...reward }]),
    ),
  }
}

export function synchronizeCompletedTasks(state: GameState, tasks: Task[]): GameUpdate {
  const nextState = cloneState(state)

  tasks
    .filter((task) => task.completed && nextState.rewards[task.id] === undefined)
    .sort((first, second) =>
      (first.completedAt ?? first.updatedAt).localeCompare(second.completedAt ?? second.updatedAt),
    )
    .forEach((task) => {
      const points = REWARD_POINTS[task.priority]
      nextState.rewards[task.id] = {
        points,
        earnedAt: task.completedAt ?? task.updatedAt,
        active: true,
        planted: false,
      }
      nextState.currentPoints += points
    })

  return settleTrees(nextState)
}

export function completeTaskReward(state: GameState, task: Task): GameUpdate {
  const nextState = cloneState(state)
  const existingReward = nextState.rewards[task.id]

  if (existingReward?.active) {
    return { state: nextState, grownTrees: [] }
  }

  if (existingReward?.planted) {
    existingReward.active = true
    return { state: nextState, grownTrees: [] }
  }

  const points = existingReward?.points ?? REWARD_POINTS[task.priority]
  nextState.rewards[task.id] = {
    points,
    earnedAt: new Date().toISOString(),
    active: true,
    planted: false,
  }
  nextState.currentPoints += points

  return settleTrees(nextState)
}

export function reopenTaskReward(state: GameState, taskId: string): GameUpdate {
  const nextState = cloneState(state)
  const reward = nextState.rewards[taskId]

  if (reward === undefined || !reward.active) {
    return { state: nextState, grownTrees: [] }
  }

  reward.active = false

  if (!reward.planted) {
    nextState.currentPoints = Math.max(0, nextState.currentPoints - reward.points)
  }

  return { state: nextState, grownTrees: [] }
}

export function getTreeStage(points: number): TreeStage {
  if (points < 25) return 'seed'
  if (points < 60) return 'sprout'
  if (points < 120) return 'sapling'
  return 'growing'
}

export function getTreeStageLabel(stage: TreeStage): string {
  const labels: Record<TreeStage, string> = {
    seed: 'Seed',
    sprout: 'Sprout',
    sapling: 'Young tree',
    growing: 'Growing tree',
  }
  return labels[stage]
}

export function getRewardPoints(priority: TaskPriority): number {
  return REWARD_POINTS[priority]
}
