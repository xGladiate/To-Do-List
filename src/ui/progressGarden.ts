import {
  getTreeStage,
  getTreeStageLabel,
  POINTS_PER_TREE,
  TREE_LABELS,
  type GameState,
} from '../game/gameState.ts'
import { treeIllustration } from './treeIllustration.ts'

export type GardenStats = {
  completedThisWeek: number
  dueToday: number
}

export function renderProgressGarden(
  container: HTMLElement,
  state: GameState,
  stats: GardenStats,
  openForest: () => void,
): void {
  const stage = getTreeStage(state.currentPoints)
  const pointsRemaining = POINTS_PER_TREE - state.currentPoints
  const progressPercent = Math.round((state.currentPoints / POINTS_PER_TREE) * 100)
  const speciesLabel = TREE_LABELS[state.currentSpecies]

  container.innerHTML = `
    <div class="garden-copy">
      <div class="garden-heading-row">
        <div>
          <p class="garden-kicker">Your growing garden</p>
          <h2>${getTreeStageLabel(stage)} ${speciesLabel}</h2>
        </div>
        <button class="forest-button" type="button">View forest <span aria-hidden="true">→</span></button>
      </div>

      <div class="growth-progress">
        <div class="growth-progress__labels">
          <strong>${state.currentPoints} / ${POINTS_PER_TREE} growth points</strong>
          <span>${pointsRemaining} until fully grown</span>
        </div>
        <div class="growth-track" role="progressbar" aria-label="Current tree growth" aria-valuemin="0" aria-valuemax="${POINTS_PER_TREE}" aria-valuenow="${state.currentPoints}">
          <span style="width: ${progressPercent}%"></span>
        </div>
        <p class="point-guide">Low +5 <span>·</span> Medium +10 <span>·</span> High +20</p>
      </div>

      <dl class="garden-stats">
        <div><dt>Trees grown</dt><dd>${state.forest.length}</dd></div>
        <div><dt>Done this week</dt><dd>${stats.completedThisWeek}</dd></div>
        <div><dt>Due today</dt><dd>${stats.dueToday}</dd></div>
      </dl>
    </div>
    <div class="current-tree" data-stage="${stage}">
      ${treeIllustration(state.currentSpecies, stage)}
    </div>
  `

  container.querySelector<HTMLButtonElement>('.forest-button')!.addEventListener('click', openForest)
}

export function renderForest(container: HTMLElement, state: GameState): void {
  if (state.forest.length === 0) {
    container.innerHTML = `
      <div class="forest-empty">
        ${treeIllustration(state.currentSpecies, 'seed')}
        <h3>Your first tree is growing</h3>
        <p>Reach 200 growth points and it will be planted here permanently.</p>
      </div>`
    return
  }

  const cards = [...state.forest]
    .reverse()
    .map((tree) => {
      const completionDate = new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(tree.completedAt))

      return `
        <li class="forest-tree-card">
          ${treeIllustration(tree.species, 'full')}
          <strong>${TREE_LABELS[tree.species]}</strong>
          <span>Tree ${tree.number} · ${completionDate}</span>
        </li>`
    })
    .join('')

  container.innerHTML = `<ul class="forest-grid">${cards}</ul>`
}
