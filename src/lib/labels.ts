import type { Category, Difficulty, Equipment, Exercise, Space } from '../types'

/*
  Human-readable labels and display order for the fixed sets of values.
  Editing a label here changes it everywhere in the app.
*/

export const CATEGORY_ORDER: Category[] = [
  'dribbling',
  'passing',
  'first-touch',
  'shooting',
  'defending',
  'athleticism',
  'strength',
  'recovery',
]

export const CATEGORY_LABELS: Record<Category, string> = {
  dribbling: 'Dribbling',
  passing: 'Passing',
  'first-touch': 'First touch',
  shooting: 'Shooting',
  defending: 'Defending',
  athleticism: 'Athleticism',
  strength: 'Strength',
  recovery: 'Recovery',
}

// A small, muted accent per category — used only for little dots and headers.
export const CATEGORY_ACCENT: Record<Category, string> = {
  dribbling: '#1F6F4B',
  passing: '#2E7DA6',
  'first-touch': '#B4791F',
  shooting: '#FF5A2C',
  defending: '#6B7A72',
  athleticism: '#8A5CC4',
  strength: '#C13E3E',
  recovery: '#4E9E7E',
}

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  ball: 'Ball',
  cones: 'Cones',
  wall: 'Wall',
  goal: 'Goal',
  partner: 'Partner',
  weights: 'Weights',
  bar: 'Pull-up bar',
  none: 'No kit',
}

export const SPACE_LABELS: Record<Space, string> = {
  small: 'Small space',
  medium: 'Medium space',
  'full-pitch': 'Full pitch',
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

// Space is nested: a small-space drill also works in bigger areas.
export const SPACE_RANK: Record<Space, number> = {
  small: 0,
  medium: 1,
  'full-pitch': 2,
}

/*
  --- Efficiency ---

  Every built-in drill carries a 1–100 score for how much a minute spent on it moves
  your match performance. The rubric behind the numbers is written out at the top of
  src/data/exercises.ts; this file only decides how one is displayed.

  A bare number is hard to read, so each one also gets a band. The bands are what
  people actually act on ("do the elite ones first"), and they keep the number from
  reading as a precision it doesn't have — 78 and 80 mean the same thing in practice.
*/
export interface EfficiencyBand {
  label: string
  color: string
  blurb: string
}

const BANDS: { min: number; band: EfficiencyBand }[] = [
  {
    min: 85,
    band: {
      label: 'Elite return',
      color: '#1F6F4B',
      blurb: 'Opposed, decision-heavy or exceptionally well evidenced. Do these first, and often.',
    },
  },
  {
    min: 70,
    band: {
      label: 'Strong',
      color: '#3E8E68',
      blurb: 'Reliably worth the time. The backbone of a training week.',
    },
  },
  {
    min: 55,
    band: {
      label: 'Solid',
      color: '#B4791F',
      blurb: 'Earns its place, but the payoff is narrower than the drills above it.',
    },
  },
  {
    min: 40,
    band: {
      label: 'Narrow',
      color: '#8A7C6B',
      blurb: 'A real but limited effect — often best as a warm-up or a top-up, not a session.',
    },
  },
  {
    min: 0,
    band: {
      label: 'Novelty',
      color: '#9A6B6B',
      blurb: "Fun, and low return per minute. Worth doing because you want to, not because it's efficient.",
    },
  },
]

export function efficiencyBand(score: number): EfficiencyBand {
  return BANDS.find((b) => score >= b.min)!.band
}

/*
  Every skill a drill works — the one it's filed under first, then the rest.
  One list, so no screen has to remember that the extras live in a second field.
*/
export function trainedCategories(ex: Exercise): Category[] {
  return [ex.category, ...(ex.alsoTrains ?? [])]
}

export function trains(ex: Exercise, cat: Category): boolean {
  return ex.category === cat || (ex.alsoTrains?.includes(cat) ?? false)
}

/*
  Library order: best return first.

  Drills you wrote stay at the top of their group regardless. They have no score —
  rating your own drills is the library's judgement to make, not yours — and sorting
  the unscored to the bottom would bury them under 172 built-ins, which is exactly
  what putting yours first was meant to prevent.
*/
export function byEfficiency(a: Exercise, b: Exercise): number {
  if (!!a.isCustom !== !!b.isCustom) return a.isCustom ? -1 : 1
  return (b.efficiency ?? 0) - (a.efficiency ?? 0)
}
