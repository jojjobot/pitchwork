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
        'grid shrink-0 place-items-center rounded-xl font-display font-extrabold text-white',
        size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10 text-base',
      ].join(' ')}
      style={{ backgroundColor: band.color }}
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
    <div className="flex items-start gap-3 rounded-2xl border border-slate/15 bg-white/70 p-4">
      <span
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-lg font-extrabold text-white"
        style={{ backgroundColor: band.color }}
      >
        {score}
      </span>
      <div className="min-w-0">
        <p className="font-display font-bold text-ink">
          {band.label}{' '}
          <span className="font-body text-sm font-normal text-slate">· {score}/100 efficiency</span>
        </p>
        <p className="mt-0.5 text-sm text-slate">{band.blurb}</p>
        <p className="mt-1 text-xs text-slate">{what}</p>
      </div>
    </div>
  )
}
