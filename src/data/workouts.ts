import type { Workout, WorkoutBlock } from '../types'

/*
  THE PREMADE WORKOUTS.
  Each workout is an ordered list of blocks. A block points at a drill by its `id`
  (see exercises.ts) and says how many sets and how much rest comes after it.

  The little `b()` helper keeps each block short and readable:
      b('sole-rolls', 3, 30)  ->  3 sets of Sole rolls, 30s rest after.
  Pass a fourth value to add a coaching note for that block. Duration and reps are
  left as the drill's own defaults; a custom workout can override them.
*/
function b(exerciseId: string, sets: number, restAfter: number, note: string | null = null): WorkoutBlock {
  return { exerciseId, duration: null, reps: null, sets, restAfter, note }
}

export const workouts: Workout[] = [
  {
    id: 'ball-mastery-15',
    name: 'Ball mastery',
    description: 'A tight, ball-only session to sharpen your close control. All you need is a ball and a few square metres.',
    goal: 'Sharper close control',
    estimatedMinutes: 15,
    difficulty: 'beginner',
    isCustom: false,
    blocks: [
      b('toe-taps', 3, 30),
      b('sole-rolls', 3, 30),
      b('v-pull', 3, 30),
      b('figure-eight', 3, 30),
      b('cruyff-turn', 3, 40, 'Sell the fake before you turn.'),
    ],
  },
  {
    id: 'wall-work-20',
    name: 'Wall work: passing & first touch',
    description: 'A wall is the best training partner you never have to book. Groove clean passes and a reliable first touch.',
    goal: 'Cleaner passing and first touch',
    estimatedMinutes: 20,
    difficulty: 'beginner',
    isCustom: false,
    blocks: [
      b('wall-pass-both', 3, 30),
      b('one-touch-wall', 4, 30),
      b('wall-touch-set', 3, 30),
      b('first-touch-turn', 3, 30),
      b('weak-foot-wall', 3, 40, 'Weaker foot only — quality over speed.'),
    ],
  },
  {
    id: 'finishing-25',
    name: 'Finishing session',
    description: 'Composure and repetition in front of goal. Bring a ball to a pitch or anywhere with a goal.',
    goal: 'Calm, accurate finishing',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    isCustom: false,
    blocks: [
      b('placement-corners', 3, 45),
      b('driven-laces-shot', 3, 45),
      b('finish-from-layoff', 3, 45),
      b('weak-foot-finish', 3, 45, 'Weaker foot — placement first, power later.'),
      b('first-time-finish', 2, 60),
    ],
  },
  {
    id: 'weak-foot-20',
    name: 'Weak-foot development',
    description: 'Twenty focused minutes on the foot you avoid. A ball, a wall and some cones is enough.',
    goal: 'A more reliable weaker foot',
    estimatedMinutes: 20,
    difficulty: 'intermediate',
    isCustom: false,
    blocks: [
      b('weak-foot-wall', 3, 30, 'Weaker foot only.'),
      b('inside-push-pass', 3, 30, 'Every pass with your weaker foot.'),
      b('drag-push', 3, 30, 'Lead with your weaker foot.'),
      b('first-touch-turn', 3, 30, 'Turn onto your weaker side.'),
      b('cruyff-turn', 3, 40, 'Weaker foot does the work.'),
    ],
  },
  {
    id: 'warmup-15',
    name: 'Match-day warm-up',
    description: 'Wake up your body and your touch before kick-off. Builds from mobility to sharp, game-speed movements.',
    goal: 'Ready to play',
    estimatedMinutes: 15,
    difficulty: 'beginner',
    isCustom: false,
    blocks: [
      b('hip-mobility-flow', 1, 20),
      b('quick-feet', 3, 25),
      b('toe-taps', 2, 20),
      b('acceleration-starts', 3, 40),
      b('cruyff-turn', 2, 30, 'Light and sharp — you are priming, not training.'),
    ],
  },
  {
    id: 'speed-agility-30',
    name: 'Speed & agility',
    description: 'Sharpen your first step and your change of direction. Set up a few cones in an open space.',
    goal: 'A sharper first step',
    estimatedMinutes: 30,
    difficulty: 'intermediate',
    isCustom: false,
    blocks: [
      b('quick-feet', 4, 30),
      b('acceleration-starts', 3, 45),
      b('shuttle-5-10-5', 3, 45),
      b('decel-cut', 3, 40),
      b('pogo-hops', 3, 30),
    ],
  },
  {
    id: 'conditioning-rsa-30',
    name: 'Conditioning: repeated sprints',
    description: 'Build the engine to repeat your sprints late in a game. Hard work — keep the quality high on every rep.',
    goal: 'Repeat your sprints without fading',
    estimatedMinutes: 30,
    difficulty: 'advanced',
    isCustom: false,
    blocks: [
      b('acceleration-starts', 5, 30, 'Short rest on purpose — hold your sprint quality.'),
      b('shuttle-5-10-5', 4, 40),
      b('decel-cut', 3, 35),
      b('tempo-runs', 2, 60, 'Flush out on controlled tempo runs.'),
    ],
  },
  {
    id: 'strength-25',
    name: 'Strength for footballers',
    description: 'Bodyweight strength that protects your hamstrings, knees and groin. No gym, just a step or a bench.',
    goal: 'Robust, injury-resistant legs',
    estimatedMinutes: 25,
    difficulty: 'intermediate',
    isCustom: false,
    blocks: [
      b('glute-bridge', 3, 30),
      b('single-leg-rdl', 3, 40),
      b('bulgarian-split-squat', 3, 40),
      b('calf-raises', 3, 30),
      b('copenhagen-plank', 3, 45, 'Bend the top knee if the full version is too much.'),
    ],
  },
  {
    id: 'recovery-15',
    name: 'Recovery & mobility',
    description: 'A calm, restorative flow for the day after a hard session. Bring your breathing down and open tight areas.',
    goal: 'Recover and restore range',
    estimatedMinutes: 15,
    difficulty: 'beginner',
    isCustom: false,
    blocks: [
      b('walking-cooldown', 1, 20),
      b('hip-mobility-flow', 1, 20),
      b('hip-flexor-stretch', 1, 20),
      b('calf-adductor-stretch', 1, 20),
      b('downreg-breathing', 1, 0),
    ],
  },
  {
    id: 'complete-45',
    name: 'Complete solo session',
    description: 'A full training day in one session: warm up, sharpen your technique, get your running in, then finish and cool down.',
    goal: 'A balanced, full training day',
    estimatedMinutes: 45,
    difficulty: 'intermediate',
    isCustom: false,
    blocks: [
      b('quick-feet', 2, 20, 'Warm up.'),
      b('sole-rolls', 2, 20),
      b('wall-pass-both', 3, 30),
      b('first-touch-turn', 3, 30),
      b('driven-pass-target', 3, 30),
      b('shuttle-5-10-5', 3, 40),
      b('driven-laces-shot', 3, 45),
      b('single-leg-rdl', 2, 30),
      b('calf-adductor-stretch', 1, 0, 'Cool down and stretch.'),
    ],
  },
]

export const workoutById: Record<string, Workout> = Object.fromEntries(
  workouts.map((w) => [w.id, w]),
)
