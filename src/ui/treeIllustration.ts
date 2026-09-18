import type { TreeSpecies, TreeStage } from '../game/gameState.ts'

type TreePalette = {
  leaf: string
  leafLight: string
  accent: string
  trunk: string
}

const PALETTES: Record<TreeSpecies, TreePalette> = {
  oak: { leaf: '#52794b', leafLight: '#7fa76a', accent: '#a4bd78', trunk: '#76523d' },
  cherry: { leaf: '#d9899b', leafLight: '#f2b6bd', accent: '#fff0df', trunk: '#725048' },
  pine: { leaf: '#315f51', leafLight: '#548372', accent: '#8dac76', trunk: '#705040' },
  maple: { leaf: '#c85f3c', leafLight: '#e99b4a', accent: '#f1c15c', trunk: '#74513b' },
  willow: { leaf: '#668956', leafLight: '#98af65', accent: '#c0c982', trunk: '#74543d' },
  'golden-rain': { leaf: '#627d45', leafLight: '#91a95b', accent: '#e7ba4f', trunk: '#76533d' },
}

function roundCanopy(palette: TreePalette, scale: number): string {
  return `
    <g transform="translate(100 76) scale(${scale}) translate(-100 -76)">
      <circle cx="75" cy="72" r="25" fill="${palette.leaf}" />
      <circle cx="103" cy="57" r="31" fill="${palette.leafLight}" />
      <circle cx="130" cy="75" r="27" fill="${palette.leaf}" />
      <circle cx="103" cy="82" r="32" fill="${palette.leaf}" />
      <circle cx="93" cy="49" r="11" fill="${palette.accent}" opacity=".72" />
      <circle cx="124" cy="66" r="9" fill="${palette.accent}" opacity=".55" />
      <circle cx="76" cy="82" r="8" fill="${palette.leafLight}" opacity=".8" />
    </g>`
}

function pineCanopy(palette: TreePalette, scale: number): string {
  return `
    <g transform="translate(100 82) scale(${scale}) translate(-100 -82)">
      <path d="M100 25 63 79h20L55 113h90l-28-34h20z" fill="${palette.leaf}" />
      <path d="M100 35 82 67h36zM100 66 73 101h54z" fill="${palette.leafLight}" opacity=".8" />
    </g>`
}

function willowCanopy(palette: TreePalette, scale: number): string {
  return `
    <g transform="translate(100 77) scale(${scale}) translate(-100 -77)">
      <ellipse cx="100" cy="59" rx="42" ry="31" fill="${palette.leafLight}" />
      <path d="M65 55q-9 43-2 68M78 47q-8 53-3 82M91 42q-5 55 0 91M109 42q5 55 0 91M122 47q8 53 3 82M135 55q9 43 2 68" fill="none" stroke="${palette.leaf}" stroke-width="8" stroke-linecap="round" />
      <path d="M74 66q-4 34 1 52M126 66q4 34-1 52" fill="none" stroke="${palette.accent}" stroke-width="4" stroke-linecap="round" opacity=".75" />
    </g>`
}

function speciesCanopy(species: TreeSpecies, palette: TreePalette, scale: number): string {
  if (species === 'pine') return pineCanopy(palette, scale)
  if (species === 'willow') return willowCanopy(palette, scale)

  const canopy = roundCanopy(palette, scale)

  if (species === 'cherry') {
    return `${canopy}<g fill="#fff4ec"><circle cx="75" cy="66" r="3"/><circle cx="112" cy="51" r="3"/><circle cx="129" cy="82" r="3"/><circle cx="91" cy="88" r="2.5"/></g>`
  }

  if (species === 'golden-rain') {
    return `${canopy}<g fill="#f4cc62"><circle cx="75" cy="74" r="4"/><circle cx="112" cy="54" r="4"/><circle cx="129" cy="81" r="4"/><circle cx="93" cy="91" r="3.5"/></g>`
  }

  return canopy
}

export function treeIllustration(species: TreeSpecies, stage: TreeStage | 'full'): string {
  const palette = PALETTES[species]
  let tree = ''

  if (stage === 'seed') {
    tree = `
      <path d="M100 132c-15 0-27 7-33 17h66c-6-10-18-17-33-17z" fill="#886b4d" opacity=".85" />
      <path d="M94 131c0-10 5-17 11-20 5 8 4 16-2 22z" fill="#76533b" />`
  } else if (stage === 'sprout') {
    tree = `
      <path d="M100 143c0-27 1-38 2-50" fill="none" stroke="#557744" stroke-width="5" stroke-linecap="round" />
      <path d="M101 108c-16-1-23-9-23-20 14-1 23 6 23 20z" fill="${palette.leaf}" />
      <path d="M102 96c4-14 14-20 25-17-1 13-10 20-25 17z" fill="${palette.leafLight}" />`
  } else {
    const full = stage === 'full'
    const growing = stage === 'growing' || full
    const scale = full ? 1.08 : growing ? 0.95 : 0.64
    const trunkTop = growing ? 70 : 91
    const trunkWidth = growing ? 18 : 12
    tree = `
      <path d="M${100 - trunkWidth / 2} 145Q96 113 ${100 - trunkWidth / 3} ${trunkTop}h${trunkWidth / 1.5}Q104 113 ${100 + trunkWidth / 2} 145z" fill="${palette.trunk}" />
      <path d="M100 111 78 87M103 105l24-25" fill="none" stroke="${palette.trunk}" stroke-width="7" stroke-linecap="round" />
      ${speciesCanopy(species, palette, scale)}`
  }

  return `
    <svg class="tree-illustration tree-illustration--${stage}" viewBox="0 0 200 170" role="img" aria-label="${stage} ${species.replace('-', ' ')} tree">
      <ellipse cx="100" cy="149" rx="70" ry="10" fill="#526746" opacity=".2" />
      ${tree}
    </svg>`
}
