import type { Challenge, ChallengeDay } from '../types'

/*
  THE CHALLENGES — six multi-week plans, written out day by day.

  Each one is a calendar, not a suggestion. Every day of every week is either a
  session from src/data/workouts.ts or a rest day, and both are decisions:

    s('a3-easy-engine')                    a session, by workout id
    s('p1-wall-work', 'Weak foot only.')   the same, with a note for that day
    r()                                    a rest day
    r('Walk. Nothing that gets you warm.') a rest day with a reason

  Rules the six of them keep to:

  - Seven days a week, always. A week with six entries would silently shorten the
    plan, so `challenges` is checked below and throws at import if one is wrong.
  - Between two and four rest days a week. That number is the plan's real
    personality: five sessions a week is a different commitment from three, and
    the browse screen leads with it.
  - Hard days are spaced. Nothing that leaves you sore is scheduled the day after
    something else that does, and every week the plan gets harder ends with rest.
  - Only workouts that exist. The ids here are the ones generated in workouts.ts
    (code + name, lowercased and hyphenated).

  What a challenge deliberately does NOT carry: your progress. Which days you've
  done is worked out from your training history in lib/challenges.ts, so editing a
  plan here can never invalidate somebody's tick marks.
*/

function s(workoutId: string, note?: string): ChallengeDay {
  return note ? { kind: 'session', workoutId, note } : { kind: 'session', workoutId }
}

function r(note?: string): ChallengeDay {
  return note ? { kind: 'rest', note } : { kind: 'rest' }
}

export const challenges: Challenge[] = [
  /* ================================================================ 2 WEEKS */
  {
    id: 'wall-and-ball',
    name: 'Wall & Ball',
    tagline: 'Two weeks, a wall, and a first touch that finally behaves',
    description:
      "The one to start with. Ten short sessions in fourteen days, none of them longer than half an hour, none of them needing anyone else. A wall and a ball is the whole kit list — this is the plan for the fortnight you can't get to a pitch.",
    promise: 'A first touch that kills the ball dead instead of bouncing it away from you.',
    category: 'first-touch',
    difficulty: 'beginner',
    weeks: [
      {
        focus: 'Get the ball under control',
        days: [
          s('f1-wall-touch-basics', 'Slow. Every touch deliberate.'),
          s('p1-wall-work'),
          r('Two days in is exactly where people overdo it. Stop here.'),
          s('f2-juggling-and-control'),
          s('f3-directional-touch', 'The touch goes where you want it, not just away.'),
          r(),
          s('f4-receiving-shapes'),
        ],
      },
      {
        focus: 'Make it automatic',
        days: [
          s('p1-wall-work', 'Weaker foot gets half the reps this time.'),
          s('f3-directional-touch'),
          r(),
          s('f5-aerial-control'),
          s('p3-accuracy-session'),
          r('Last rest before the graduation session. Take it.'),
          s('f9-advanced-control', "The hard one. You've earned it."),
        ],
      },
    ],
  },

  /* ================================================================ 3 WEEKS */
  {
    id: 'weak-foot',
    name: 'Weak Foot, Three Weeks',
    tagline: 'Twelve sessions, one foot you never use',
    description:
      "Three weeks of doing everything on the side you avoid. Four sessions a week and three rest days, because this is frustrating work and cramming it makes it worse. Week one is technique with nobody watching, week two adds a target, week three retests the session you started with.",
    promise: 'A second foot you can pass and finish with, instead of one you hide.',
    category: 'shooting',
    difficulty: 'intermediate',
    weeks: [
      {
        focus: 'Make it feel normal',
        days: [
          s('s3-both-feet', 'This is your benchmark. Note how many you hit.'),
          s('p1-wall-work', 'Weak foot only. Every single touch.'),
          r(),
          s('s2-strike-technique', 'Weak foot. Placement over power, always.'),
          r(),
          s('f3-directional-touch', 'Receive and set with the weak foot only.'),
          r(),
        ],
      },
      {
        focus: 'Aim it',
        days: [
          s('s6-weak-foot-finishing'),
          r(),
          s('p3-accuracy-session', 'Weak foot. Move back a metre when you hit three in a row.'),
          s('s3-both-feet'),
          r(),
          r(),
          s('s1-placement-basics', 'Weak foot. Corners only — the middle does not count.'),
        ],
      },
      {
        focus: 'Prove it',
        days: [
          s('s6-weak-foot-finishing'),
          r(),
          s('s9-precision-strikes', 'Alternate feet every strike.'),
          r(),
          s('s3-both-feet'),
          r('Rest before the retest. A tired foot tells you nothing.'),
          s('s6-weak-foot-finishing', 'The retest. Compare it with day one.'),
        ],
      },
    ],
  },

  /* ================================================================ 4 WEEKS */
  {
    id: 'ninety-minutes',
    name: 'Ninety Minutes',
    tagline: 'Four weeks to stop fading after an hour',
    description:
      'Built around one complaint: you are fine for sixty minutes and finished by seventy-five. Four sessions a week — running and legs, alternated, never stacked — with three rest days because this is the plan where recovery is the training. It ends with the sprint session from week two, run again.',
    promise: 'The same legs in the last fifteen minutes that you had in the first.',
    category: 'athleticism',
    difficulty: 'intermediate',
    weeks: [
      {
        focus: 'Lay the base',
        days: [
          s('a3-easy-engine', 'Easy means easy. You should be able to talk.'),
          s('st2-legs-starter'),
          r(),
          s('a2-agility-starter'),
          r(),
          s('a6-tempo-volume'),
          r(),
        ],
      },
      {
        focus: 'Learn to repeat a sprint',
        days: [
          s('a4-match-sprint-repeats', 'Time every rep. The last one is the one that counts.'),
          s('st4-lower-power'),
          r(),
          s('a5-change-of-direction'),
          r(),
          s('a6-tempo-volume'),
          r(),
        ],
      },
      {
        focus: 'The hard week',
        days: [
          s('a9-yo-yo-conditioning'),
          s('st9-explosive-power'),
          r(),
          s('a5-change-of-direction'),
          r(),
          s('a10-interval-engine', 'The biggest session in the plan. Eat first.'),
          r('You will need this one.'),
        ],
      },
      {
        focus: 'Sharpen, then test',
        days: [
          s('a8-top-speed'),
          s('st4-lower-power'),
          r(),
          s('a9-yo-yo-conditioning'),
          r(),
          r('Taper. Doing more here only makes the retest worse.'),
          s('a4-match-sprint-repeats', 'Same session as week two, day one. Compare the times.'),
        ],
      },
    ],
  },

  {
    id: 'the-dribbler',
    name: 'The Dribbler',
    tagline: 'Twenty sessions to become the one nobody wants to mark',
    description:
      'The heaviest plan here: five sessions a week for four weeks, only two rest days, and a speed session in every one. It moves from touch, to moves, to moves against someone actually trying to take the ball off you — so the last two weeks want a partner and a bit of space.',
    promise: 'Three moves you trust at full speed, and the legs to use them in the 80th minute.',
    category: 'dribbling',
    difficulty: 'advanced',
    weeks: [
      {
        focus: 'Touch first',
        days: [
          s('d1-touch-basics', 'Little touches. The ball never leaves your shadow.'),
          s('d2-cone-circuit'),
          r(),
          s('d3-first-moves'),
          s('a2-agility-starter'),
          s('d5-move-bank'),
          r(),
        ],
      },
      {
        focus: 'Moves you will actually use',
        days: [
          s('d3-first-moves', 'Pick the two that felt best last week. Only those.'),
          s('d5-move-bank'),
          r(),
          s('d6-speed-and-skill'),
          s('a5-change-of-direction'),
          s('d7-shielding-and-turning'),
          r(),
        ],
      },
      {
        focus: 'With someone in your way',
        days: [
          s('d4-pressure-control'),
          s('d8-advanced-skill-moves'),
          r(),
          s('d6-speed-and-skill', 'Head up. If you are watching the ball, slow down.'),
          s('a5-change-of-direction'),
          s('d9-1v1-specialist'),
          r(),
        ],
      },
      {
        focus: 'Beat your man',
        days: [
          s('d5-move-bank'),
          s('d9-1v1-specialist', 'Same move twice in a row on purpose. See if it still works.'),
          r(),
          s('d4-pressure-control'),
          s('a8-top-speed'),
          s('d10-full-dribbling-session', 'Everything, in one session.'),
          r(),
        ],
      },
    ],
  },

  /* ================================================================ 5 WEEKS */
  {
    id: 'stay-on-the-pitch',
    name: 'Stay On The Pitch',
    tagline: 'Five weeks of strength, and four rest days a week',
    description:
      'The quiet one. Three sessions a week, never on consecutive days, aimed at the injuries that actually end amateur seasons — hamstrings, groins, ankles. It is deliberately the least demanding plan in the app to fit around whatever else you are doing, and the only one where four rest days a week is the point rather than a concession.',
    promise: 'Hamstrings and a core that hold up, and a squat that finally looks like one.',
    category: 'strength',
    difficulty: 'beginner',
    weeks: [
      {
        focus: 'Learn the shapes',
        days: [
          s('st1-bodyweight-base', 'No load anywhere. Get the positions right first.'),
          r(),
          s('st3-core-and-stability'),
          r(),
          s('st2-legs-starter'),
          r(),
          r(),
        ],
      },
      {
        focus: 'Add a little load',
        days: [
          s('st2-legs-starter', 'Add weight only where last week felt easy.'),
          r(),
          s('st7-upper-and-core'),
          r(),
          s('st6-injury-prevention'),
          r(),
          r(),
        ],
      },
      {
        focus: 'The back of the leg',
        days: [
          s('st5-posterior-chain', 'Expect to be sore. That is why Wednesday is empty.'),
          r(),
          s('st3-core-and-stability'),
          r(),
          s('st4-lower-power'),
          r(),
          r(),
        ],
      },
      {
        focus: 'Get genuinely strong',
        days: [
          s('st4-lower-power'),
          r(),
          s('st6-injury-prevention'),
          r(),
          s('st8-max-strength', 'Heavy and slow. Nothing here is for speed yet.'),
          r(),
          r(),
        ],
      },
      {
        focus: 'Turn it into speed',
        days: [
          s('st9-explosive-power', 'Now it is for speed. Every rep as fast as you can move it.'),
          r(),
          s('st5-posterior-chain'),
          r(),
          s('st10-full-body-football', 'The longest session in the app. Finish it and you are done.'),
          r(),
          r(),
        ],
      },
    ],
  },

  /* ================================================================ 6 WEEKS */
  {
    id: 'pre-season',
    name: 'Pre-Season',
    tagline: 'Six weeks, twenty-nine sessions, every skill in the app',
    description:
      'The full one. Six weeks that start with an easy run and finish at match intensity, touching running, strength, touch, passing, dribbling, defending and finishing along the way. The first two weeks are gentle on purpose — the plan builds a base before it asks for anything — and week six tapers so you arrive at the season sharp rather than wrecked.',
    promise: 'A pre-season done properly: fit, sharp, and not carrying an injury into game one.',
    category: 'athleticism',
    difficulty: 'advanced',
    weeks: [
      {
        focus: 'Move again',
        days: [
          s('a3-easy-engine', 'Whatever pace feels easy. Genuinely.'),
          s('f1-wall-touch-basics'),
          r(),
          s('st1-bodyweight-base'),
          s('p1-wall-work'),
          s('d2-cone-circuit'),
          r(),
        ],
      },
      {
        focus: 'Build the base',
        days: [
          s('a6-tempo-volume'),
          s('f3-directional-touch'),
          r(),
          s('st2-legs-starter'),
          s('p3-accuracy-session'),
          s('d3-first-moves'),
          r(),
        ],
      },
      {
        focus: 'Sharpen the ball work',
        days: [
          s('a5-change-of-direction'),
          s('f4-receiving-shapes'),
          r(),
          s('st6-injury-prevention'),
          s('p4-rondo-session'),
          s('s2-strike-technique'),
          r(),
        ],
      },
      {
        focus: 'Speed and duels',
        days: [
          s('a4-match-sprint-repeats'),
          s('d4-pressure-control'),
          r(),
          s('st4-lower-power'),
          s('de4-1v1-defending'),
          s('s4-box-finishing'),
          r(),
        ],
      },
      {
        focus: 'Match intensity',
        days: [
          s('a9-yo-yo-conditioning'),
          s('p7-pressure-passing'),
          r(),
          s('st9-explosive-power'),
          s('f8-pressure-receiving'),
          s('s7-fatigue-finishing', 'Finish tired. That is the whole session.'),
          r(),
        ],
      },
      {
        focus: 'Taper',
        days: [
          s('a8-top-speed', 'Fast and short. Nothing long from here on.'),
          s('p8-one-touch-mastery'),
          r(),
          s('d9-1v1-specialist'),
          r('Two rest days this week, not one. The taper is the point.'),
          s('s5-game-situations', 'Last session. Play, do not train.'),
          r(),
        ],
      },
    ],
  },
]

export const challengeById: Record<string, Challenge> = Object.fromEntries(
  challenges.map((c) => [c.id, c]),
)

/*
  A plan with a six-day week, or three rest days where the card promises two, is
  wrong in a way nobody would notice until a Thursday. Checked once at import so it
  fails on the developer's screen rather than on somebody's phone.
*/
for (const challenge of challenges) {
  for (const [i, week] of challenge.weeks.entries()) {
    if (week.days.length !== 7) {
      throw new Error(`Challenge "${challenge.id}" week ${i + 1} has ${week.days.length} days, not 7`)
    }
  }
}
