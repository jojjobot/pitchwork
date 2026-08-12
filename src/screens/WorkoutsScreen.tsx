import { useMemo, useState } from 'react'
import { useAllWorkouts } from '../lib/customWorkouts'
import { workoutMeta } from '../lib/workout'
import type { Category, Difficulty, Equipment, Space } from '../types'
import {
  CATEGORY_ACCENT,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  SPACE_LABELS,
  SPACE_RANK,
} from '../lib/labels'
import { Chip, Segmented } from '../components/Filters'
import WorkoutCard from '../components/WorkoutCard'

const KIT: Equipment[] = ['ball', 'cones', 'wall', 'goal', 'partner']
type DurationBand = 'any' | 'short' | 'medium' | 'long'
// The skill chips, plus two that aren't skills: everything, and everything you built.
type Filing = Category | 'all' | 'mine'

export default function WorkoutsScreen() {
  const allWorkouts = useAllWorkouts()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Filing>('all')
  const [difficulty, setDifficulty] = useState<Difficulty | 'any'>('any')
  const [duration, setDuration] = useState<DurationBand>('any')
  const [space, setSpace] = useState<Space | 'any'>('any')
  const [available, setAvailable] = useState<Set<Equipment>>(new Set(KIT))
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Pre-compute each workout's length, kit, categories, and space once.
  const withMeta = useMemo(
    () => allWorkouts.map((w) => ({ workout: w, meta: workoutMeta(w) })),
    [allWorkouts],
  )

  // Only offer a chip for a skill that actually has sessions filed under it.
  const categoriesInUse = useMemo(
    () => CATEGORY_ORDER.filter((c) => allWorkouts.some((w) => w.category === c)),
    [allWorkouts],
  )
  const anyCustom = allWorkouts.some((w) => w.isCustom)

  const activeFilters =
    (category !== 'all' ? 1 : 0) +
    (difficulty !== 'any' ? 1 : 0) +
    (duration !== 'any' ? 1 : 0) +
    (space !== 'any' ? 1 : 0) +
    (available.size !== KIT.length ? 1 : 0)

  function toggleKit(item: Equipment) {
    setAvailable((prev) => {
      const next = new Set(prev)
      next.has(item) ? next.delete(item) : next.add(item)
      return next
    })
  }

  function resetFilters() {
    setCategory('all')
    setDifficulty('any')
    setDuration('any')
    setSpace('any')
    setAvailable(new Set(KIT))
  }

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    return withMeta.filter(({ workout, meta }) => {
      if (category === 'mine' && !workout.isCustom) return false
      if (category !== 'all' && category !== 'mine' && workout.category !== category) return false
      if (difficulty !== 'any' && workout.difficulty !== difficulty) return false
      if (space !== 'any' && SPACE_RANK[meta.space] > SPACE_RANK[space]) return false
      if (duration === 'short' && meta.minutes > 15) return false
      if (duration === 'medium' && (meta.minutes <= 15 || meta.minutes > 30)) return false
      if (duration === 'long' && meta.minutes <= 30) return false
      // every piece of kit the workout needs must be available
      for (const e of meta.equipment) if (!available.has(e)) return false
      if (q) {
        const hay = (
          workout.code + ' ' + workout.name + ' ' + workout.goal + ' ' + workout.focus + ' ' + workout.description
        ).toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [withMeta, search, category, difficulty, duration, space, available])

  return (
    <section>
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Workouts</h1>
        <div className="chalk-line mt-2 w-20" aria-hidden="true" />
        <p className="mt-3 text-slate">
          {results.length} {results.length === 1 ? 'session' : 'sessions'} to choose from. Pick one and press start.
        </p>
      </header>

      <div className="mt-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workouts…"
          className="w-full rounded-xl border border-slate/25 bg-white px-4 h-12 text-base outline-none focus:border-pitch"
          aria-label="Search workouts"
        />
      </div>

      {/* Category chips */}
      <div className="mt-3 -mx-5 overflow-x-auto px-5">
        <div className="flex gap-2 w-max">
          <Chip active={category === 'all'} onClick={() => setCategory('all')}>
            All
          </Chip>
          {anyCustom && (
            <Chip active={category === 'mine'} onClick={() => setCategory('mine')}>
              Yours
            </Chip>
          )}
          {categoriesInUse.map((cat) => (
            <Chip key={cat} active={category === cat} onClick={() => setCategory(cat)} dot={CATEGORY_ACCENT[cat]}>
              {CATEGORY_LABELS[cat]}
            </Chip>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate/25 bg-white px-4 h-11 text-sm font-semibold"
          aria-expanded={filtersOpen}
        >
          Filters
          {activeFilters > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-pitch px-1 text-xs font-bold text-white">
              {activeFilters}
            </span>
          )}
        </button>
        {activeFilters > 0 && (
          <button onClick={resetFilters} className="px-2 h-11 text-sm font-semibold text-pitch">
            Reset
          </button>
        )}
      </div>

      {filtersOpen && (
        <div className="mt-3 space-y-4 rounded-2xl border border-slate/15 bg-white/70 p-4">
          <Segmented
            label="Length"
            value={duration}
            onChange={setDuration}
            options={[
              ['any', 'Any'],
              ['short', '≤ 15 min'],
              ['medium', '15–30 min'],
              ['long', '30 min +'],
            ]}
          />
          <Segmented
            label="Difficulty"
            value={difficulty}
            onChange={setDifficulty}
            options={[
              ['any', 'Any'],
              ['beginner', DIFFICULTY_LABELS.beginner],
              ['intermediate', DIFFICULTY_LABELS.intermediate],
              ['advanced', DIFFICULTY_LABELS.advanced],
            ]}
          />
          <Segmented
            label="Space"
            value={space}
            onChange={setSpace}
            options={[
              ['any', 'Any'],
              ['small', SPACE_LABELS.small],
              ['medium', SPACE_LABELS.medium],
              ['full-pitch', SPACE_LABELS['full-pitch']],
            ]}
          />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate">What you've got</p>
            <div className="flex flex-wrap gap-2">
              {KIT.map((item) => (
                <Chip key={item} active={available.has(item)} onClick={() => toggleKit(item)}>
                  {EQUIPMENT_LABELS[item]}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="mt-6 space-y-3">
        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate/30 p-8 text-center">
            <p className="font-display text-lg font-bold">No workouts match those filters</p>
            <p className="mt-1 text-slate">Try adding some kit back, or widen the length range.</p>
            {activeFilters > 0 && (
              <button onClick={resetFilters} className="mt-4 rounded-xl bg-ink px-4 h-11 font-semibold text-chalk">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          results.map(({ workout }) => <WorkoutCard key={workout.id} workout={workout} />)
        )}
      </div>
    </section>
  )
}
