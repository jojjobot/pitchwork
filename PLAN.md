# The road to publishable — Phases 5–10

Phases 0–4 built the app. These six take it from *works on my laptop* to *a stranger
can rely on it*. Ordered cheap-to-expensive, with a real decision point in the middle.

Readable version: https://claude.ai/code/artifact/7dc86dc7-7ccd-492c-a1b6-ffdbbbb75d30

## Built out of order (2026-08-17)

**Challenges shipped** — six multi-week plans, two to six weeks, written out day by day
with two to four rest days a week. It was on the *deliberately not in this plan* list
below and was asked for anyway, which is a fair thing to happen to a plan: the list was
never a refusal, only a record of what was being kept out of the next six evenings.

It changes the phases below in two places. Phase 5's "look at every screen" now has two
more screens to look at (both were screenshotted when they were built, so they are ahead
rather than behind). And the decision point's fallback — "the honest next move is content
and habit" — has had its biggest piece done early, so if retention is poor, that reading
is now *tested* rather than merely available.

## Settled before planning (2026-08-15)

- **Local-first, cloud optional.** The app keeps working offline and signed out. An
  account is something you opt into for backup and sync, never a wall at the door.
- **Friends first, public maybe.** Public-launch work is the last phase and is allowed
  to never happen.
- **€0 to start.** GitHub Pages + Supabase free tier cover everything up to Phase 10.
  A domain (~€12/yr) is the only thing worth paying for, later.

---

## Phase 5 — Fit to show someone
*one evening · €0*

Goal: nothing makes you wince when a friend opens the link — or opens the repo.

- [ ] **Real README.** The public repo's front page still says "React + TypeScript +
      Vite — this template provides a minimal setup…". It's the first thing anyone
      curious sees.
- [ ] **Look at every screen.** Home, library, browse, both detail screens, the player,
      builder and settings all went public build-verified only. Screenshot each at phone
      width and at 1100px (headless Edge — see the memory note on the recipe).
- [ ] **Error boundary** around the router with a reload button. Today one bad render is
      a white screen with no way back, and a friend with a white screen just closes it.
- [ ] **Empty states.** Day one is a Home of zeros, an empty History, an empty Builder.
      Each should say what to do next instead of reporting nothing.
- [ ] **One line on training safely.** 46 strength drills incl. loaded lifts and neck
      isometrics. "Work inside your own limits, stop if it hurts", once at first run.
- [ ] **Register GoatCounter.** The beacon is in `index.html` and silently failing
      because `pitchwork.goatcounter.com` doesn't exist yet. Two minutes, no redeploy —
      and Phase 7 needs the data.

Done when: someone who has never seen it can open the link, understand it, finish a
session, and never hit a screen that looks unfinished.

---

## Phase 6 — Lives on the home screen, works with no signal
*one to two evenings · €0*

Goal: it behaves like an app on a pitch, one bar of signal, cold hands.

- [ ] **`manifest.webmanifest`** — name, `start_url`, `display: standalone`, theme
      `#14231A`, 192/512 + maskable icons, plus `apple-touch-icon` (iOS ignores manifest
      icons).
- [ ] **Service worker precaching the build.** Assets are content-hashed, which is what
      makes it safe. `vite-plugin-pwa` is the least code.
- [ ] **Update prompt shipped with it.** This is the fix for the recurring "I deployed
      and still see the old app". Without it, a service worker makes stale caching
      *worse*.
- [ ] **Self-host the two fonts** (`index.html` has promised this since it was written).
      Removes a third-party request, fixes offline, and deletes the Google-Fonts-and-EU-
      IP-addresses question before a privacy page is ever needed.
- [ ] **Test offline for real.** Aeroplane mode, launch from home screen, full session.
      Wake lock and audio cues exist — this is where you learn if they hold.

Done when: installed on your phone, aeroplane mode, complete a session, history still
there afterwards.

---

## Phase 7 — Send it to your friends
*one evening + whatever they break · €0*

Goal: the first people who aren't you, and a way for them to tell you what broke.

- [ ] **Real iPhone pass.** Safe-area insets under the bottom nav, `100vh` vs `dvh` in
      the player, audio after the silent switch + first tap, wake lock. Everything so far
      was verified on Windows.
- [ ] **Install instructions.** Two lines: open link → Share → Add to Home Screen. Most
      people have never done this deliberately.
- [ ] **A way to complain.** `mailto:` in Settings prefilled with version + browser, or a
      form link. Without one you hear nothing and assume it's fine.
- [ ] **Watch what they do.** Analytics sends route patterns only, enough for the one
      question that matters: do they reach the player, or stop at the library?

Done when: three or four people have it on their home screen and at least one finished a
session you didn't watch them start.

---

## ◆ Decision point — roughly two weeks in

If people came back a second and third week, sync is what stands between this and a real
product → build Phase 9.

If nobody came back twice, sync is **not** the problem and a week of evenings on Supabase
buys nothing. The honest next move is content and habit — reminders, and streaks that mean
something — not infrastructure. The multi-week plans this line used to point at are built
(see the top of this file), so that reading now comes with something to measure: if people
start a challenge and stop in week one, the problem is not that their data lives on one
phone.

---

## Phase 8 — A net under the app
*two evenings · €0*

Goal: tests **before** the backend. Sync is the first feature that can silently destroy
someone's history; pin the merge rules down while they're still local.

- [ ] **Vitest**, replacing the throwaway jiti scripts. Cover what can't be eyeballed:
      `progress.ts` (streak rule, Monday weeks, the DST case), `workout.ts` (computed
      minutes, work-time-weighted efficiency, unscored drills leaving both halves),
      `auth.ts`, `transfer.ts` merge-by-id rules. Keep the MemStorage polyfill pattern.
- [ ] **Accessibility pass.** Focus rings, thumb-sized tap targets, labels on icon-only
      buttons, `prefers-reduced-motion` honoured by the new motion, contrast checked
      wherever text sits on a category accent (that palette is already known to be tight).
- [ ] **Version string in Settings**, so a bug report can name a build.

Done when: `npm test` runs green in one command, and breaking a merge rule on purpose
turns it red.

---

## Phase 9 — An account that survives a lost phone
*a week of evenings · €0 on the Supabase free tier · gated on the decision point*

Goal: history outlives the browser it was made in, and a forgotten password stops being
permanent — without undoing anything from Phase 6.

- [ ] **Local-first stays literal.** Local storage remains what the screens read; the
      cloud is a mirror behind it. If the app stops working signed out or offline, this
      phase has broken the last one.
- [ ] **Supabase Auth (email + password)** — brings the one thing a browser-only lock
      never can: a real password reset email. Existing local profiles keep working
      untouched; "back this profile up" is a button in Settings, not a gate.
- [ ] **Four tables, RLS on from the first migration** (sessions, custom drills, custom
      sessions, settings), each keyed by user. Turning RLS on afterwards is how weekend
      projects leak strangers' data to each other.
- [ ] **Sync = the `transfer.ts` rules over the wire.** Merge by id, never overwrite,
      re-syncing adds zero. Deletes need one decision written down once — tombstones or
      explicitly not synced — because "it came back" and "it vanished on my other phone"
      are the same bug from opposite ends.
- [ ] **Keep the transfer file.** It's the offline path and the fallback for anyone who
      doesn't want an account.
- [ ] **Fix the copy per account type.** "A lock, not a safe" stays true for local
      profiles and stops being the whole story for cloud ones. One screen must not imply
      both.

Done when: you sign in on a browser that has never seen the app and your history is
there — and killing the network mid-session loses nothing.

---

## Phase 10 — The launch kit
*a weekend · ~€12/yr if you want the domain · only if you decide to go public*

Goal: the paperwork and the shopfront — the parts that only matter once strangers are
involved.

- [ ] **Privacy policy, terms, training disclaimer.** Once emails and training data land
      in your database you're a data controller under GDPR: what's stored, where, how to
      delete it. The delete-account plumbing exists — point at it.
- [ ] **A landing page that isn't the sign-in screen.** Lead with what no other free app
      has: 172 drills scored 1–100 against a written rubric, where an opposed 1v1 beats a
      cone slalom and the app says why. That's the story, not "track your training".
- [ ] **Domain**, if the name still fits: ~€12/yr, a CNAME at Pages, and the username
      leaves the URL. A free GitHub org does most of it for nothing.
- [ ] **Support address + changelog**, so "it broke" has somewhere to go.
- [ ] **Post it where footballers are** — coaching/football subreddits, the club group
      chat. Not Product Hunt.

Done when: a stranger can find it, understand it, install it, use it for a month, and get
their data out or deleted without emailing you.

---

## Deliberately not in this plan

~~Multi-week plans~~ (built 2026-08-17) · coach/team accounts · video demonstrations ·
German translation · native apps · social feed.

Each is a phase of its own, and none of them is what stops a friend using the app
tomorrow. Writing them down is how they stay out of the next six evenings.
