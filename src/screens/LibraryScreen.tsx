import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCustomExercise, useAllExercises } from '../lib/customExercises'
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
import ExerciseCard from '../components/ExerciseCard'
import { Chip, Segmented } from '../components/Filters'

// The kit the user can toggle on/off ("what have you got with you?").
const KIT: Equipment[] = ['ball', 'cones', 'wall', 'goal', 'partner', 'weights', 'bar']

export default function LibraryScreen() {
  const navigate = useNavigate()
  const allExercises = useAllExercises()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [space, setSpace] = useState<Space | 'any'>('any')
  const [difficulty, setDifficulty] = useState<Difficulty | 'any'>('any')
  const [available, setAvailable] = useState<Set<Equipment>>(new Set(KIT))
  const [filtersOpen, setFiltersOpen] = useState(false)

  const activeFilters =
    (space !== 'any' ? 1 : 0) +
    (difficulty !== 'any' ? 1 : 0) +
    (available.size !== KIT.length ? 1 : 0)

  function toggleKit(item: Equipment) {
    setAvailable((prev) => {
      const next = new Set(prev)
      next.has(item) ? next.delete(item) : next.add(item)
      return next
    })
  }

  function resetFilters() {
    setSpace('any')
    setDifficulty('any')
    setAvailable(new Set(KIT))
  }

  // Apply every active filter to the full list.
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allExercises.filter((ex) => {
      if (category !== 'all' && ex.category !== category) return false
      if (difficulty !== 'any' && ex.difficulty !== difficulty) return false
      if (space !== 'any' && SPACE_RANK[ex.spaceNeeded] > SPACE_RANK[space]) return false
      // an exercise needs "none", or every piece of its kit must be available
      const kitOk = ex.equipment.every((e) => e === 'none' || available.has(e))
      if (!kitOk) return false
      if (q) {
        const haystack = (ex.name + ' ' + ex.shortDescription + ' ' + ex.skillTags.join(' ')).toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [search, category, space, difficulty, available, allExercises])

  const mineCount = allExercises.filter((ex) => ex.isCustom).length

  // A new drill is created empty and opened straight in the editor, the same way a
  // new session is — there is nothing useful to ask before it exists.
  function startNewDrill() {
    const ex = createCustomExercise()
    navigate(`/library/${ex.id}/edit`)
  }

  // Group results by category, preserving our display order.
  const groups = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: matches.filter((e) => e.category === cat),
  })).filter((g) => g.items.length > 0)

  return (
    <section>
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Exercise library</h1>
        <div className="chalk-line mt-2 w-20" aria-hidden="true" />
        <p className="mt-3 text-slate">
          {matches.length} {matches.length === 1 ? 'drill' : 'drills'}, ready when you are.
          {mineCount > 0 && ` ${mineCount} of them ${mineCount === 1 ? 'is' : 'are'} yours.`}
        </p>
      </header>

      {/* A drill you wrote behaves like any other one: it can be filtered to, opened,
          and dropped into a session. This is just where it starts. */}
      <button
        onClick={startNewDrill}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate/25 bg-white font-semibold active:bg-white/60"
      >
        <span aria-hidden="true">+</span> Write your own drill
      </button>

      {/* Search */}
      <div className="mt-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search drills or skills…"
          className="w-full rounded-xl border border-slate/25 bg-white px-4 h-12 text-base outline-none focus:border-pitch"
          aria-label="Search the exercise library"
        />
      </div>

      {/* Category chips */}
      <div className="mt-3 -mx-5 overflow-x-auto px-5">
        <div className="flex gap-2 w-max">
          <Chip active={category === 'all'} onClick={() => setCategory('all')}>
            All
          </Chip>
          {CATEGORY_ORDER.map((cat) => (
            <Chip key={cat} active={category === cat} onClick={() => setCategory(cat)} dot={CATEGORY_ACCENT[cat]}>
              {CATEGORY_LABELS[cat]}
            </Chip>
          ))}
        </div>
      </div>

      {/* Filters toggle */}
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

      {/* Filter panel */}
      {filtersOpen && (
        <div className="mt-3 space-y-4 rounded-2xl border border-slate/15 bg-white/70 p-4">
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
        </div>
      )}

      {/* Results */}
      <div className="mt-6 space-y-8">
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate/30 p-8 text-center">
            <p className="font-display text-lg font-bold">No drills match those filters</p>
            <p className="mt-1 text-slate">Try turning a filter off, or add some kit back.</p>
            {activeFilters > 0 && (
              <button onClick={resetFilters} className="mt-4 rounded-xl bg-ink px-4 h-11 font-semibold text-chalk">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.cat}>
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-lg font-bold">{CATEGORY_LABELS[g.cat]}</h2>
                <span className="text-sm text-slate">{g.items.length}</span>
              </div>
              <div className="space-y-2">
                {g.items.map((ex) => (
                  <ExerciseCard key={ex.id} exercise={ex} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
