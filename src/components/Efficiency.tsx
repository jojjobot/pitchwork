import { efficiencyBand } from '../lib/labels'

/*
  The efficiency score, drawn the two ways the app needs it.

  Drills and sessions share this on purpose: they're the same 1–100 scale — a
  session's is the work-time-weighted average of its drills — so showing them in two
  different visual languages would imply two different measurements.
*/

// The compact square, for list rows.
export function EfficiencyBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const band = efficiencyBand(score)
  return (
    <span
      className={[
        'grid shrink-0 place-items-center rounded-xl font-display font-extrabold text-white tnum',
        size === 'sm' ? 'h-8 w-8 text-sm' : 'h-11 w-11 text-lg',
      ].join(' ')}
      style={{
        // A slight lift inside the swatch stops 172 of these reading as flat stickers.
        backgroundImage: `linear-gradient(155deg, color-mix(in oklab, ${band.color} 82%, white) 0%, ${band.color} 100%)`,
        boxShadow: `0 4px 12px -4px color-mix(in oklab, ${band.color} 70%, transparent)`,
      }}
      title={`${band.label} — ${score}/100 efficiency`}
    >
      {score}
    </span>
  )
}

/*
  The explained version, for detail screens. The number on its own invites the wrong
  reading — that a 50 is a bad session rather than a narrower one — so the band and
  its sentence travel with it.
*/
export function EfficiencyTile({ score, what }: { score: number; what: string }) {
  const band = efficiencyBand(score)
  return (
    <div className="card flex items-start gap-3.5 p-4">
      <span
        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-xl font-extrabold text-white tnum"
        style={{
          backgroundImage: `linear-gradient(155deg, color-mix(in oklab, ${band.color} 82%, white) 0%, ${band.color} 100%)`,
          boxShadow: `0 6px 16px -6px color-mix(in oklab, ${band.color} 70%, transparent)`,
        }}
      >
        {score}
      </span>
      <div className="min-w-0">
        <p className="font-display font-bold text-ink">
          {band.label}{' '}
          <span className="font-body text-sm font-normal text-slate">· {score}/100 efficiency</span>
        </p>
        {/* The scale, drawn once. Seeing where 62 sits between 1 and 100 does more
            than the sentence does, and it's the same bar on every drill. */}
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate/15">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{ width: `${score}%`, backgroundColor: band.color }}
          />
        </div>
        <p className="mt-2 text-sm text-slate">{band.blurb}</p>
        <p className="mt-1 text-xs text-slate">{what}</p>
      </div>
    </div>
  )
}
