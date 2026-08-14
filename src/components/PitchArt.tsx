import type { ReactNode } from 'react'
import type { Category } from '../types'
import { CATEGORY_ACCENT, CATEGORY_LABELS } from '../lib/labels'

/*
  PITCHWORK ARTWORK
  =================

  Every skill gets its own picture: a top-down coach's-whiteboard diagram of the
  thing you actually do — cones to weave, a wall to pass off, a goal to hit.

  Why drawings and not photographs:
  - There are 172 drills. Eight scenes cover all of them, because a drill's
    *category* is what a picture can honestly say. A stock photo of a man kicking
    a ball says nothing and would be a lie on 171 of them.
  - It's ~2KB of markup instead of megabytes, it stays sharp on any screen, and it
    can't be wrong in the dark or on a slow connection.
  - It's ours. Nothing here is licensed from anyone.

  Every scene shares one viewBox and is drawn with the same chalk-on-grass
  vocabulary, so a wall of them reads as one set rather than eight clip-arts.
*/

const VIEW = '0 0 120 80'
const CHALK = 'rgba(255,255,255,0.9)'
const CHALK_SOFT = 'rgba(255,255,255,0.42)'

/*
  THE SAFE ZONE — x 16→104, y 10→70.

  Every scene is drawn once and then cropped (`slice`) to whatever shape the caller
  asks for, so the same drawing has to survive two opposite crops:

  - a 56px SQUARE thumbnail scales to cover, losing ~14 units off each SIDE
  - a full-width BANNER scales to cover, losing ~8 units off the TOP and BOTTOM

  So anything that matters — the ball, the player, the arrowhead — lives inside the
  intersection of those. Backgrounds (the wall, the goal net, the mow stripes) can
  and should run past the edges; that's what makes it read as a crop of a real
  pitch instead of a logo floating in a box.
*/

/* --------------------------------------------------------------- the plate */

/*
  --- VARIATION ---

  There are eight scenes and 172 drills, and the library groups drills by category —
  so without this, one section is twenty pixel-identical thumbnails in a column,
  which reads as a rendering fault rather than as a category marker.

  A `seed` (the drill's id) deterministically picks the light direction, the mow
  angle and whether the diagram is mirrored. Same drill, same picture, every time;
  neighbours in a list never match. Mirroring is safe because the scenes' safe zone
  is symmetric about x=60, and a cone weave running right-to-left is still a
  perfectly correct diagram.
*/
function hash(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

const LIGHT_ANGLES = [152, 128, 168, 196]
const MOW_ANGLES = [118, 62, 96]

/*
  The grass under the diagram. Its colour is mixed from the category's own accent
  towards the darkest green, which is what makes eight thumbnails distinguishable
  at 56px while keeping them obviously the same family.
*/
function plateStyle(category: Category, v: number): React.CSSProperties {
  const accent = CATEGORY_ACCENT[category]
  const light = LIGHT_ANGLES[v % LIGHT_ANGLES.length]
  const mow = MOW_ANGLES[v % MOW_ANGLES.length]
  return {
    backgroundImage: [
      `linear-gradient(${light}deg, color-mix(in oklab, ${accent} 78%, #0a1c14) 0%, color-mix(in oklab, ${accent} 34%, #0a1c14) 100%)`,
      // the mow stripes, same idea as the app background but tighter
      `repeating-linear-gradient(${mow}deg, rgba(255,255,255,0.055) 0 8px, rgba(255,255,255,0) 8px 16px)`,
    ].join(','),
  }
}

/*
  One picture. The caller sizes it (`className`), the scene fills it — cropping
  rather than squashing, exactly like a photograph would.
*/
export default function PitchArt({
  category,
  className = 'h-14 w-14 rounded-xl',
  label,
  seed,
}: {
  category: Category
  className?: string
  label?: string
  /** Any stable string (a drill or session id). Varies the light, mow angle and
   *  mirroring so a column of same-category thumbnails doesn't look duplicated. */
  seed?: string
}) {
  const v = seed ? hash(seed) : 0
  const mirrored = seed ? v % 2 === 1 : false

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${className}`}
      style={plateStyle(category, v)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox={VIEW} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <g transform={mirrored ? 'translate(120 0) scale(-1 1)' : undefined}>{SCENES[category]}</g>
      </svg>
      {/* a touch of light from the top-left, so the plate isn't flat colour */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'linear-gradient(150deg, rgba(255,255,255,0.16), transparent 55%)' }}
      />
    </div>
  )
}

/*
  The same scene used as a watermark behind real content — the home hero and the
  session player. Big, faint, and cropped hard so it reads as texture, not as a
  picture competing with the text on top of it.
*/
export function PitchBackdrop({
  category,
  opacity = 0.16,
}: {
  category: Category
  opacity?: number
}) {
  return (
    <svg
      viewBox={VIEW}
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity }}
      aria-hidden="true"
    >
      {SCENES[category]}
    </svg>
  )
}

/* ------------------------------------------------------------ the primitives */

/* A training cone: the single most recognisable object in the whole set. */
function Cone({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -7 L5 5 L-5 5 Z" fill={CHALK} />
      <ellipse cx="0" cy="5" rx="6.5" ry="1.8" fill="rgba(255,255,255,0.35)" />
    </g>
  )
}

/* A ball. At thumbnail size the panels vanish, so the ring does the work. */
function Ball({ x, y, r = 6 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill="#ffffff" />
      <circle r={r} fill="none" stroke="rgba(10,28,20,0.35)" strokeWidth="0.8" />
      <path
        d={`M0 ${-r * 0.55} L${r * 0.5} ${-r * 0.15} L${r * 0.32} ${r * 0.48} L${-r * 0.32} ${r * 0.48} L${-r * 0.5} ${-r * 0.15} Z`}
        fill="rgba(10,28,20,0.72)"
      />
    </g>
  )
}

/* A player marker: filled = you, open = whoever you're up against. */
function Player({ x, y, open = false, r = 7 }: { x: number; y: number; open?: boolean; r?: number }) {
  return open ? (
    <circle cx={x} cy={y} r={r} fill="none" stroke={CHALK} strokeWidth="2.4" />
  ) : (
    <circle cx={x} cy={y} r={r} fill={CHALK} />
  )
}

/* A run, a pass, a shot — always dashed, always going somewhere. */
function Path({ d, dashed = true, width = 2.4, color = CHALK }: { d: string; dashed?: boolean; width?: number; color?: string }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={dashed ? '5 5' : undefined}
    />
  )
}

function Arrow({ x, y, angle = 0, s = 1 }: { x: number; y: number; angle?: number; s?: number }) {
  return (
    <path
      d="M-5 -5 L5 0 L-5 5 Z"
      fill={CHALK}
      transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}
    />
  )
}

/* ---------------------------------------------------------------- the scenes */

const SCENES: Record<Category, ReactNode> = {
  /* Weaving a ball through a cone gate line. */
  dribbling: (
    <>
      <Path d="M14 64 C 28 64 26 28 40 28 S 54 64 66 64 S 80 28 92 28 L 100 28" />
      <Cone x={40} y={15} s={0.95} />
      <Cone x={66} y={51} s={0.95} />
      <Cone x={92} y={15} s={0.95} />
      <Arrow x={101} y={28} angle={0} s={0.9} />
      <Ball x={21} y={64} r={6.5} />
    </>
  ),

  /* Off the wall and back — the drill you can do anywhere with nobody. */
  passing: (
    <>
      {/* the wall runs off the top and bottom on purpose: it's scenery, not a shape */}
      <rect x="94" y="0" width="26" height="80" fill="rgba(255,255,255,0.16)" />
      <line x1="94" y1="0" x2="94" y2="80" stroke={CHALK} strokeWidth="2.5" />
      {[10, 24, 38, 52, 66].map((y) => (
        <line key={y} x1="94" y1={y} x2="112" y2={y - 9} stroke={CHALK_SOFT} strokeWidth="1.4" />
      ))}
      <Path d="M32 34 Q 62 16 90 26" />
      <Arrow x={91} y={26} angle={20} s={0.85} />
      <Path d="M90 50 Q 60 66 34 50" />
      <Arrow x={33} y={50} angle={200} s={0.85} />
      <Player x={22} y={40} />
      <Ball x={32} y={52} r={5.5} />
    </>
  ),

  /* A dropping ball killed dead inside the control zone. */
  'first-touch': (
    <>
      <circle cx="58" cy="50" r="20" fill="none" stroke={CHALK_SOFT} strokeWidth="2" strokeDasharray="4 5" />
      <circle cx="58" cy="50" r="10" fill="none" stroke={CHALK_SOFT} strokeWidth="1.6" />
      <Path d="M28 12 Q 46 24 54 36" />
      {/* the cushion: the ball comes in hard and leaves gently */}
      <Path d="M62 46 Q 78 43 86 52" width={2} />
      <Arrow x={87} y={53} angle={40} s={0.8} />
      <Player x={58} y={58} r={6.5} />
      <Ball x={57} y={37} r={6.5} />
    </>
  ),

  /* Goal, top corner, and the ball that's going there. */
  shooting: (
    <>
      <rect x="28" y="10" width="64" height="24" fill="rgba(255,255,255,0.12)" />
      {[38, 48, 58, 68, 78].map((x) => (
        <line key={x} x1={x} y1="10" x2={x} y2="34" stroke={CHALK_SOFT} strokeWidth="1.2" />
      ))}
      {[18, 26].map((y) => (
        <line key={y} x1="28" y1={y} x2="92" y2={y} stroke={CHALK_SOFT} strokeWidth="1.2" />
      ))}
      <path d="M28 34 L28 10 L92 10 L92 34" fill="none" stroke={CHALK} strokeWidth="3" strokeLinecap="round" />
      <Path d="M60 60 Q 52 44 38 26" />
      <Arrow x={37} y={24} angle={-118} s={0.9} />
      {/* the strike marks under the ball */}
      <line x1="46" y1="68" x2="54" y2="68" stroke={CHALK_SOFT} strokeWidth="2" strokeLinecap="round" />
      <Ball x={62} y={62} r={6.5} />
    </>
  ),

  /* Jockeying: staying in front of the ball rather than diving in. */
  defending: (
    <>
      <Path d="M26 56 Q 46 56 58 44" />
      <Player x={24} y={56} />
      <Ball x={38} y={62} r={5} />
      <Player x={76} y={38} open />
      {/* the shuffle — the defender's feet never cross */}
      <Path d="M76 54 Q 88 60 96 51" width={2} />
      <Path d="M76 54 Q 64 60 56 51" width={2} />
      <line x1="76" y1="19" x2="76" y2="27" stroke={CHALK_SOFT} strokeWidth="2" strokeLinecap="round" />
      <line x1="88" y1="23" x2="94" y2="17" stroke={CHALK_SOFT} strokeWidth="2" strokeLinecap="round" />
      <line x1="64" y1="23" x2="58" y2="17" stroke={CHALK_SOFT} strokeWidth="2" strokeLinecap="round" />
    </>
  ),

  /* Ladder in, sprint out. */
  athleticism: (
    <>
      <path
        d="M16 32 L58 17 L64 34 L22 49 Z"
        fill="rgba(255,255,255,0.1)"
        stroke={CHALK}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {[0.22, 0.44, 0.66, 0.88].map((t) => (
        <line
          key={t}
          x1={16 + 42 * t}
          y1={32 - 15 * t}
          x2={22 + 42 * t}
          y2={49 - 15 * t}
          stroke={CHALK}
          strokeWidth="1.8"
        />
      ))}
      <Path d="M66 28 Q 86 24 101 40" />
      <Arrow x={102} y={41} angle={45} s={0.95} />
      {/* speed lines */}
      <line x1="70" y1="60" x2="84" y2="60" stroke={CHALK_SOFT} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="78" y1="68" x2="96" y2="68" stroke={CHALK_SOFT} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),

  /* The one scene that isn't top-down, because a barbell from above is a line. */
  strength: (
    <>
      <line x1="20" y1="40" x2="100" y2="40" stroke={CHALK} strokeWidth="4" strokeLinecap="round" />
      <rect x="28" y="25" width="9" height="30" rx="3" fill={CHALK} />
      <rect x="40" y="31" width="7" height="18" rx="2.5" fill="rgba(255,255,255,0.6)" />
      <rect x="83" y="25" width="9" height="30" rx="3" fill={CHALK} />
      <rect x="73" y="31" width="7" height="18" rx="2.5" fill="rgba(255,255,255,0.6)" />
      <Path d="M60 22 L60 13" dashed={false} width={2.4} color={CHALK_SOFT} />
      <Arrow x={60} y={12} angle={-90} s={0.8} />
      <line x1="16" y1="64" x2="104" y2="64" stroke={CHALK_SOFT} strokeWidth="2" strokeLinecap="round" />
    </>
  ),

  /* Slow, open, quiet — the only scene with no arrow in it. */
  recovery: (
    <>
      <circle cx="60" cy="42" r="27" fill="none" stroke={CHALK_SOFT} strokeWidth="1.6" />
      <circle cx="60" cy="42" r="19" fill="none" stroke={CHALK_SOFT} strokeWidth="1.6" />
      <Path d="M26 58 Q 46 22 60 42 Q 74 62 94 34" dashed={false} width={3} />
      <circle cx="60" cy="42" r="7" fill={CHALK} />
      <circle cx="26" cy="58" r="3.5" fill={CHALK} />
      <circle cx="94" cy="34" r="3.5" fill={CHALK} />
    </>
  ),
}

/* ------------------------------------------------------------------ the mark */

/*
  The logo: a centre circle and a halfway line, which is the smallest drawing that
  is unmistakably a pitch. Used in the header and on the sign-in screen.
*/
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-[0.55em]"
      style={{
        width: size,
        height: size,
        backgroundImage: 'linear-gradient(150deg, #2f9463 0%, #14392a 55%, #0a1c14 100%)',
        boxShadow: '0 2px 8px -2px rgba(10,28,20,0.5)',
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" width={size} height={size}>
        <line x1="16" y1="2" x2="16" y2="30" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" />
        <circle cx="16" cy="16" r="7" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" />
        <circle cx="16" cy="16" r="2.4" fill="var(--color-lime, #d8e64a)" />
      </svg>
    </span>
  )
}

/*
  A skill's name with its own picture beside it — the pairing used in headers, so
  "Shooting" always arrives with the goal diagram and the two become one idea.
*/
export function CategoryTag({ category }: { category: Category }) {
  return (
    <span className="inline-flex items-center gap-2">
      <PitchArt category={category} className="h-6 w-6 rounded-md" />
      <span className="text-sm font-bold uppercase tracking-widest" style={{ color: CATEGORY_ACCENT[category] }}>
        {CATEGORY_LABELS[category]}
      </span>
    </span>
  )
}
