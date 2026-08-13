import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import AppShell from './components/AppShell'
import HomeScreen from './screens/HomeScreen'
import WorkoutsScreen from './screens/WorkoutsScreen'
import WorkoutDetailScreen from './screens/WorkoutDetailScreen'
import SessionPlayer from './screens/SessionPlayer'
import LibraryScreen from './screens/LibraryScreen'
import ExerciseDetailScreen from './screens/ExerciseDetailScreen'
import ExerciseBuilderScreen from './screens/ExerciseBuilderScreen'
import BuilderScreen from './screens/BuilderScreen'
import BuilderEditScreen from './screens/BuilderEditScreen'
import BuilderPickScreen from './screens/BuilderPickScreen'
import BuilderBlockScreen from './screens/BuilderBlockScreen'
import HistoryScreen from './screens/HistoryScreen'
import SessionDetailScreen from './screens/SessionDetailScreen'
import SettingsScreen from './screens/SettingsScreen'
import SignInScreen from './screens/SignInScreen'
import { useAccount } from './lib/auth'
import { countPageview } from './lib/analytics'

/*
  All routes live here. Screens with the bottom nav are nested inside <AppShell>.
  The full-screen session player sits on its own, outside the shell (no bottom nav
  while you're training).
*/
export default function App() {
  const account = useAccount()
  usePageviews(Boolean(account))

  // One gate in front of everything. Signing out swaps this back in, and because
  // the stores reload with it, no screen is ever left holding the last person's data.
  if (!account) return <SignInScreen />

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/workouts" element={<WorkoutsScreen />} />
        <Route path="/workouts/:workoutId" element={<WorkoutDetailScreen />} />
        <Route path="/library" element={<LibraryScreen />} />
        <Route path="/library/:exerciseId" element={<ExerciseDetailScreen />} />
        {/* Writing a drill of your own. Only ever reached for a drill you made — the
            built-in library is read-only, and the screen says so if you arrive anyway. */}
        <Route path="/library/:exerciseId/edit" element={<ExerciseBuilderScreen />} />
        {/* The builder is a few small screens rather than one long form: pick a
            session, pick a drill, set that drill's numbers. Each step is its own URL,
            so Back always undoes exactly one decision. */}
        <Route path="/builder" element={<BuilderScreen />} />
        <Route path="/builder/:workoutId" element={<BuilderEditScreen />} />
        <Route path="/builder/:workoutId/add" element={<BuilderPickScreen />} />
        <Route path="/builder/:workoutId/block/:blockIndex" element={<BuilderBlockScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/history/:sessionId" element={<SessionDetailScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Route>

      {/* Full-screen training mode, no bottom nav */}
      <Route path="/session/:workoutId" element={<SessionPlayer />} />
    </Routes>
  )
}

/*
  Counts one pageview per screen. The GoatCounter script is loaded with
  `no_onload`, so this is the only thing that ever counts a view — otherwise the
  first load would be counted twice, and never again, because hash navigation
  fires no page load at all.

  While signed out every URL renders the sign-in screen, so counting the path
  behind the gate would claim visits to screens nobody actually saw.
*/
function usePageviews(signedIn: boolean): void {
  const { pathname } = useLocation()

  useEffect(() => {
    countPageview(signedIn ? pathname : '/sign-in')
  }, [pathname, signedIn])
}
