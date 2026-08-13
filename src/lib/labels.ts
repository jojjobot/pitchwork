import type { Category, Difficulty, Equipment, Space } from '../types'

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
