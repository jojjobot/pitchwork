import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CATEGORY_CHOICES,
  DIFFICULTY_CHOICES,
  EQUIPMENT_CHOICES,
  MEASURE_CHOICES,
  SPACE_CHOICES,
  deleteCustomExercise,
  exerciseProblem,
  updateCustomExercise,
  useExercise,
} from '../lib/customExercises'
import { formatKg } from '../lib/builder'
import { formatSeconds, prescription } from '../lib/format'
import {
  CATEGORY_ACCENT,
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  EQUIPMENT_LABELS,
  SPACE_LABELS,
} from '../lib/labels'
import { Chip, Segmented } from '../components/Filters'
import Stepper from '../components/Stepper'
import NotFound from '../components/NotFound'
import type { Equipment, Exercise, MeasureType } from '../types'

/*
  Writing a drill of your own.

  Everything here writes through on the tap, exactly like the session builder — there
  is no Save button and nothing to lose by leaving. "Done" is only navigation.

  The shape being filled in is the same one the 172 built-in drills use, which is the
  whole point: once it exists there is nothing second-class about it. It appears in
  the library, it can be filtered to, and it drops into a session like any other.
*/
export default function ExerciseBuilderScreen() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const ex = useExercise(exerciseId)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  if (!ex || !ex.isCustom) {
    return (
      <NotFound title="Drill not found" to="/library" cta="Back to the library">
        {ex
          ? 'The built-in drills are read-only — use "Make my own version" to change one.'
          : 'It may have been deleted.'}
      </NotFound>
    )
  }

  const edit = (patch: Partial<Exercise>) => updateCustomExercise(ex.id, patch)
  const problem = exerciseProblem(ex)
  const isTimed = ex.measureType !== 'reps'

  /*
    Switching how a drill is measured has to leave the other half in a usable state:
    a rep drill with no reps can't be added to a session, and a timed drill that keeps
    its reps would show a countdown and a rep count at once.
  */
  const setMeasure = (measureType: MeasureType) =>
    edit({
      measureType,
      defaultReps: measureType === 'reps' ? ex.defaultReps ?? 10 : null,
      defaultDuration: ex.defaultDuration || 45,
    })

  const toggleKit = (item: Equipment) => {
    const has = ex.equipment.includes(item)
    const next = has ? ex.equipment.filter((e) => e !== item) : [...ex.equipment.filter((e) => e !== 'none'), item]
    // "No kit" is the absence of kit, not a thing you own alongside cones.
    edit({ equipment: next.length === 0 ? ['none'] : next })
  }

  const remove = () => {
    deleteCustomExercise(ex.id)
    navigate('/library')
  }

  return (
    <section className="pb-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate"
      >
        <span aria-hidden="true">←</span> Back
      </button>

      <h1 className="text-3xl font-extrabold tracking-tight">Your drill</h1>
      <div className="chalk-line mt-2 w-20" aria-hidden="true" />

      {/* What it will look like in a list, updating as you type. */}
      <div className="mt-5 rounded-2xl bg-ink p-4 text-chalk">
        <p className="text-xs font-semibold uppercase tracking-wider text-lime">
          {CATEGORY_LABELS[ex.category]} · {DIFFICULTY_LABELS[ex.difficulty]}
        </p>
        <p className="mt-1 font-display text-2xl font-extrabold leading-tight">{ex.name || 'Untitled drill'}</p>
        <p className="mt-1 text-sm text-chalk/70">
          {prescription(ex)}
          {ex.defaultSets > 1 && ` · ${formatSeconds(ex.restBetweenSets)} rest`}
          {ex.usesWeight && ex.defaultWeightKg != null && ` · ${formatKg(ex.defaultWeightKg)}`}
        </p>
      </div>

      {problem && (
        <p className="mt-3 rounded-xl bg-blaze/10 px-4 py-3 text-sm font-medium text-blaze">
          {problem} You can still leave — it's saved either way.
        </p>
      )}

      <div className="mt-6 space-y-6 rounded-2xl border border-slate/15 bg-white/70 p-4">
        <Field label="Name">
          <input
            value={ex.name}
            onChange={(e) => edit({ name: e.target.value })}
            placeholder="e.g. Wall pass under pressure"
            className="w-full rounded-xl border border-slate/25 bg-white px-4 h-12 outline-none focus:border-pitch"
          />
        </Field>

        <Field label="One-line description" hint="What shows under the name in the library.">
          <input
            value={ex.shortDescription}
            onChange={(e) => edit({ shortDescription: e.target.value })}
            placeholder="e.g. 4 × 40s — first touch away from pressure"
            className="w-full rounded-xl border border-slate/25 bg-white px-4 h-12 outline-none focus:border-pitch"
          />
        </Field>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate">Main skill</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_CHOICES.map((cat) => (
              <Chip
                key={cat}
                active={ex.category === cat}
                // Promoting a skill to main removes it from the extras, so the same
                // category can never be listed twice.
                onClick={() =>
                  edit({ category: cat, alsoTrains: (ex.alsoTrains ?? []).filter((c) => c !== cat) })
                }
                dot={CATEGORY_ACCENT[cat]}
              >
                {CATEGORY_LABELS[cat]}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate">Where the drill is filed, and where its minutes are counted.</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate">Also trains</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_CHOICES.filter((cat) => cat !== ex.category).map((cat) => (
              <Chip
                key={cat}
                active={(ex.alsoTrains ?? []).includes(cat)}
                onClick={() => {
                  const also = ex.alsoTrains ?? []
                  edit({
                    alsoTrains: also.includes(cat) ? also.filter((c) => c !== cat) : [...also, cat],
                  })
                }}
                dot={CATEGORY_ACCENT[cat]}
              >
                {CATEGORY_LABELS[cat]}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate">
            Pick as many as it honestly works. A 1v1 trains dribbling and athleticism; a rondo trains
            passing, first touch and defending. These make it findable under each one.
          </p>
        </div>

        <Segmented
          label="Difficulty"
          value={ex.difficulty}
          onChange={(difficulty) => edit({ difficulty })}
          options={DIFFICULTY_CHOICES.map((d) => [d, DIFFICULTY_LABELS[d]])}
        />

        <Segmented
          label="Space"
          value={ex.spaceNeeded}
          onChange={(spaceNeeded) => edit({ spaceNeeded })}
          options={SPACE_CHOICES.map((s) => [s, SPACE_LABELS[s]])}
        />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate">Kit you need</p>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_CHOICES.map((item) => (
              <Chip key={item} active={ex.equipment.includes(item)} onClick={() => toggleKit(item)}>
                {EQUIPMENT_LABELS[item]}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate">
            Nothing selected means no kit — the drill shows up whatever you've got with you.
          </p>
        </div>
      </div>

      {/* --- How much of it --- */}
      <h2 className="mt-8 text-lg font-bold">How much</h2>
      <div className="chalk-line mt-2 w-14" aria-hidden="true" />

      <div className="mt-4 space-y-6 rounded-2xl border border-slate/15 bg-white/70 p-4">
        <Segmented
          label="Measured in"
          value={ex.measureType}
          onChange={setMeasure}
          options={MEASURE_CHOICES.map((m) => [m, m === 'reps' ? 'Reps' : 'Time'])}
        />

        {isTimed ? (
          <Stepper
            label="Seconds per set"
            value={ex.defaultDuration}
            min={5}
            max={900}
            step={5}
            format={formatSeconds}
            onChange={(defaultDuration) => edit({ defaultDuration })}
          />
        ) : (
          <Stepper
            label="Reps per set"
            value={ex.defaultReps ?? 10}
            min={1}
            max={200}
            onChange={(defaultReps) => edit({ defaultReps })}
          />
        )}

        <Stepper label="Sets" value={ex.defaultSets} min={1} max={30} onChange={(defaultSets) => edit({ defaultSets })} />

        <Stepper
          label="Rest between sets"
          value={ex.restBetweenSets}
          min={0}
          max={300}
          step={5}
          format={formatSeconds}
          onChange={(restBetweenSets) => edit({ restBetweenSets })}
        />

        {/* Loaded drills get kilos, here and in every session that uses this drill. */}
        <div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={ex.usesWeight ?? false}
              onChange={(e) =>
                edit({
                  usesWeight: e.target.checked,
                  defaultWeightKg: e.target.checked ? ex.defaultWeightKg ?? 20 : null,
                })
              }
              className="h-5 w-5 accent-pitch"
            />
            <span className="text-sm font-semibold">This drill uses a weight</span>
          </label>
          {ex.usesWeight && (
            <div className="mt-4">
              <Stepper
                label="Suggested weight"
                value={ex.defaultWeightKg ?? 20}
                min={0}
                max={300}
                step={2.5}
                format={formatKg}
                onChange={(defaultWeightKg) => edit({ defaultWeightKg })}
                hint="Changeable per session"
              />
            </div>
          )}
        </div>
      </div>

      {/* --- The words --- */}
      <h2 className="mt-8 text-lg font-bold">How to do it</h2>
      <div className="chalk-line mt-2 w-14" aria-hidden="true" />
      <p className="mt-2 text-sm text-slate">Numbered steps, shown on screen while you train. Add as many as you need.</p>
      <EditableList
        items={ex.instructions}
        onChange={(instructions) => edit({ instructions })}
        placeholder="e.g. Play the ball against the wall with your left foot."
        addLabel="Add a step"
        numbered
      />

      <h2 className="mt-8 text-lg font-bold">Coaching cues</h2>
      <div className="chalk-line mt-2 w-14" aria-hidden="true" />
      <p className="mt-2 text-sm text-slate">The short reminders of what "doing it well" means.</p>
      <EditableList
        items={ex.coachingCues}
        onChange={(coachingCues) => edit({ coachingCues })}
        placeholder="e.g. First touch out of your feet, not into them."
        addLabel="Add a cue"
      />

      <h2 className="mt-8 text-lg font-bold">Keywords</h2>
      <div className="chalk-line mt-2 w-14" aria-hidden="true" />
      <p className="mt-2 text-sm text-slate">Comma separated. Only used to help you find this drill in a search.</p>
      <input
        value={ex.skillTags.join(', ')}
        onChange={(e) =>
          edit({
            skillTags: e.target.value
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean),
          })
        }
        placeholder="e.g. weak foot, close control"
        className="mt-3 w-full rounded-xl border border-slate/25 bg-white px-4 h-12 outline-none focus:border-pitch"
      />

      <button
        onClick={() => navigate(-1)}
        className="mt-8 h-12 w-full rounded-xl bg-ink font-semibold text-chalk active:brightness-110"
      >
        Done
      </button>

      {/*
        Deleting leaves any session holding this drill alone: the session simply gets
        shorter, and the block sits there in case you write the drill again. Silently
        rewriting your sessions would be the more destructive choice.
      */}
      {confirmingDelete ? (
        <div className="mt-4 rounded-2xl border border-blaze/30 bg-blaze/5 p-4">
          <p className="font-semibold">Delete this drill?</p>
          <p className="mt-1 text-sm text-slate">
            Sessions using it will skip it. There's no undo — nothing is stored anywhere else.
          </p>
          <div className="mt-3 flex gap-2">
            <button onClick={remove} className="h-12 flex-1 rounded-xl bg-blaze font-semibold text-white">
              Delete
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="h-12 flex-1 rounded-xl border border-slate/25 bg-white font-semibold"
            >
              Keep it
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmingDelete(true)}
          className="mt-3 h-12 w-full rounded-xl border border-slate/25 bg-white font-semibold text-blaze"
        >
          Delete drill
        </button>
      )}
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs text-slate">{hint}</span>}
    </label>
  )
}

/*
  A list of lines you can add to, edit and remove — used for both the steps and the
  cues, which are the same problem twice.

  Rows are keyed by index rather than by content. That is normally a mistake, but here
  the value IS the content: keying by it would remount the input on every keystroke
  and lose the cursor.
*/
function EditableList({
  items,
  onChange,
  placeholder,
  addLabel,
  numbered = false,
}: {
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
  addLabel: string
  numbered?: boolean
}) {
  const setAt = (index: number, value: string) => onChange(items.map((item, i) => (i === index ? value : item)))
  const removeAt = (index: number) => onChange(items.filter((_, i) => i !== index))
  const move = (index: number, delta: number) => {
    const to = index + delta
    if (to < 0 || to >= items.length) return
    const next = items.slice()
    const [moved] = next.splice(index, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  return (
    <div className="mt-3 space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          {numbered && (
            <span className="mt-3 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink font-display text-sm font-bold text-chalk">
              {i + 1}
            </span>
          )}
          <textarea
            value={item}
            onChange={(e) => setAt(i, e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="min-w-0 flex-1 rounded-xl border border-slate/25 bg-white px-4 py-3 text-sm leading-relaxed outline-none focus:border-pitch"
          />
          <div className="flex shrink-0 flex-col gap-1">
            <button
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label="Move up"
              className="grid h-7 w-8 place-items-center rounded-lg border border-slate/25 bg-white text-xs disabled:opacity-30"
            >
              ↑
            </button>
            <button
              onClick={() => move(i, 1)}
              disabled={i === items.length - 1}
              aria-label="Move down"
              className="grid h-7 w-8 place-items-center rounded-lg border border-slate/25 bg-white text-xs disabled:opacity-30"
            >
              ↓
            </button>
            <button
              onClick={() => removeAt(i)}
              aria-label="Remove"
              className="grid h-7 w-8 place-items-center rounded-lg border border-slate/25 bg-white text-xs font-bold text-blaze"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={() => onChange([...items, ''])}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate/40 text-sm font-semibold text-pitch active:bg-white"
      >
        <span aria-hidden="true">+</span> {addLabel}
      </button>
    </div>
  )
}
