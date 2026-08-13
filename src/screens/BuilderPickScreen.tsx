import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAllExercises } from '../lib/customExercises'
import { updateBlocks, useWorkout } from '../lib/customWorkouts'
import { newBlockFor } from '../lib/builder'
import { prescription } from '../lib/format'
import { byEfficiency, CATEGORY_ACCENT, CATEGORY_LABELS, CATEGORY_ORDER, trains } from '../lib/labels'
import { Chip } from '../components/Filters'
import NotFound from '../components/NotFound'
import type { Category, Exercise } from '../types'

/*
  Choosing the next drill. Deliberately lighter than the full library screen: when
  you're mid-build you want to find one drill and get back, so it's a search box,
  the skill chips, and a list. The library remains the place to browse properly.
*/
export default function BuilderPickScreen() {
  const { workoutId } = useParams()
  const navigate = useNavigate()
  const workout = useWorkout(workoutId)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category | 'all'>('all')
  const allExercises = useAllExercises()

  // Same rules as the library: a skill chip finds everything that trains that skill,
  // and the best return per minute comes first.
  const matches = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allExercises
      .filter((ex) => {
        if (category !== 'all' && !trains(ex, category)) return false
        if (!q) return true
        return (ex.name + ' ' + ex.shortDescription + ' ' + ex.skillTags.join(' ')).toLowerCase().includes(q)
      })
      .sort(byEfficiency)
  }, [search, category, allExercises])

  if (!workout || !workout.isCustom) {
    return (
      <NotFound title="Session not found" to="/builder" cta="Back to your sessions">
        It may have been deleted.
      </NotFound>
    )
  }

  // Add it, then open its numbers straight away — the sets and reps are the reason
  // you added it, not an afterthought.
  const add = (ex: Exercise) => {
    const index = workout.blocks.length
    updateBlocks(workout.id, (blocks) => [...blocks, newBlockFor(ex)])
    navigate(`/builder/${workout.id}/block/${index}`, { replace: true })
  }

  return (
    <section>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate"
      >
        <span aria-hidden="true">←</span> Back to {workout.name}
      </button>

      <h1 className="text-3xl font-extrabold tracking-tight">Add a drill</h1>
      <div className="chalk-line mt-2 w-20" aria-hidden="true" />

      <div className="mt-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search drills or skills…"
          className="w-full rounded-xl border border-slate/25 bg-white px-4 h-12 text-base outline-none focus:border-pitch"
          aria-label="Search drills to add"
        />
      </div>

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

      <p className="mt-4 text-sm text-slate">
        {matches.length} {matches.length === 1 ? 'drill' : 'drills'} · it lands at the end, with the
        drill's own sets and reps.
      </p>

      <div className="mt-3 space-y-2">
        {matches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate/30 p-8 text-center">
            <p className="font-display text-lg font-bold">Nothing matches</p>
            <p className="mt-1 text-slate">Try a different word, or another skill.</p>
          </div>
        ) : (
          matches.map((ex) => (
            <button
              key={ex.id}
              onClick={() => add(ex)}
              className="flex w-full items-center gap-3 rounded-2xl border border-slate/15 bg-white/70 p-4 text-left active:bg-white"
            >
              <span
                className="h-10 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: CATEGORY_ACCENT[ex.category] }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-display font-bold leading-tight text-ink">
                  {ex.name}
                  {ex.isCustom && <span className="ml-1.5 text-xs font-semibold text-pitch">Yours</span>}
                </span>
                <span className="mt-0.5 block truncate text-sm text-slate">{ex.shortDescription}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-display font-bold text-ink">{prescription(ex)}</span>
                <span className="block text-xs font-semibold text-pitch">Add</span>
              </span>
            </button>
          ))
        )}
      </div>
    </section>
  )
}
