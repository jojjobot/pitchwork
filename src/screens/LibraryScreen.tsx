import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCustomExercise, useAllExercises } from '../lib/customExercises'
import { KIT, toggledKit, useLibraryFilters } from '../lib/filters'
import type { Equipment } from '../types'
import {
  byEfficiency,
  CATEGORY_ACCENT,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  SPACE_LABELS,
  SPACE_RANK,
  trains,
} from '../lib/labels'
import ExerciseCard from '../components/ExerciseCard'
import { Chip, Segmented } from '../components/Filters'

export default function LibraryScreen() {
  const navigate = useNavigate()
  const allExercises = useAllExercises()
  // Held outside the screen so opening a drill and coming back doesn't wipe it.
  const { filters, set, clear } = useLibraryFilters()
  const { search, category, space, difficulty, available, panelOpen } = filters

  const activeFilters =
    (space !== 'any' ? 1 : 0) +
    (difficulty !== 'any' ? 1 : 0) +
    (available.size !== KIT.length ? 1 : 0)

  // What the Clear button clears: the panel filters plus the search box and the
  // skill chip, since those are just as much "what am I looking at" as the rest.
  const anythingSet = activeFilters > 0 || search !== '' || category !== 'all'

  function toggleKit(item: Equipment) {
    set({ available: toggledKit(available, item) })
  }

  // Apply every active filter to the full list.
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allExercises.filter((ex) => {
      // A drill matches a skill it also trains, not just the one it's filed under —
      // asking for defending work and not being shown the rondo would be a bad answer.
      if (category !== 'all' && !trains(ex, category)) return false
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

  /*
    Group results by category, preserving our display order, best return first.

    When you've picked a skill the answer is one list — everything that trains it,
    however it happens to be filed. Only the unfiltered view splits into sections,
    and there each drill appears once, under its primary skill, so the section counts
    still add up to the number in the header.
  */
  const groups = useMemo(() => {
    const sorted = [...matches].sort(byEfficiency)
    if (category !== 'all') return [{ cat: category, items: sorted }]
    return CATEGORY_ORDER.map((cat) => ({
      cat,
      items: sorted.filter((e) => e.category === cat),
    })).filter((g) => g.items.length > 0)
  }, [matches, category])

  return (
    <section>
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Exercise library</h1>
        <div className="chalk-line mt-2 w-20" aria-hidden="true" />
        <p className="mt-3 text-slate">
          {matches.length} {matches.length === 1 ? 'drill' : 'drills'}, best return first.
          {mineCount > 0 && ` ${mineCount} of them ${mineCount === 1 ? 'is' : 'are'} yours.`}
        </p>
        <p className="mt-1 text-sm text-slate">
          The number on each drill is its efficiency out of 100 — how much one minute there moves
          your actual game, not how hard it is.
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
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Search drills or skills…"
          className="w-full rounded-xl border border-slate/25 bg-white px-4 h-12 text-base outline-none focus:border-pitch"
          aria-label="Search the exercise library"
        />
      </div>

      {/* Category chips */}
      <div className="mt-3 -mx-5 overflow-x-auto px-5">
        <div className="flex gap-2 w-max">
          <Chip active={category === 'all'} onClick={() => set({ category: 'all' })}>
            All
          </Chip>
          {CATEGORY_ORDER.map((cat) => (
            <Chip
              key={cat}
              active={category === cat}
              onClick={() => set({ category: cat })}
              dot={CATEGORY_ACCENT[cat]}
            >
              {CATEGORY_LABELS[cat]}
            </Chip>
          ))}
        </div>
      </div>

      {/* Filters toggle */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => set({ panelOpen: !panelOpen })}
          className="inline-flex items-center gap-2 rounded-xl border border-slate/25 bg-white px-4 h-11 text-sm font-semibold"
          aria-expanded={panelOpen}
        >
          Filters
          {activeFilters > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-pitch px-1 text-xs font-bold text-white">
              {activeFilters}
            </span>
          )}
        </button>
        {anythingSet && (
          <button onClick={clear} className="px-2 h-11 text-sm font-semibold text-pitch">
            Clear filters
          </button>
        )}
      </div>

      {/* Filter panel */}
      {panelOpen && (
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
            onChange={(v) => set({ space: v })}
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
            onChange={(v) => set({ difficulty: v })}
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
            {anythingSet && (
              <button onClick={clear} className="mt-4 rounded-xl bg-ink px-4 h-11 font-semibold text-chalk">
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
