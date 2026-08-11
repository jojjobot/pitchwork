import { Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import HomeScreen from './screens/HomeScreen'
import WorkoutsScreen from './screens/WorkoutsScreen'
import WorkoutDetailScreen from './screens/WorkoutDetailScreen'
import SessionPlayer from './screens/SessionPlayer'
import LibraryScreen from './screens/LibraryScreen'
import ExerciseDetailScreen from './screens/ExerciseDetailScreen'
import BuilderScreen from './screens/BuilderScreen'
import HistoryScreen from './screens/HistoryScreen'
import SettingsScreen from './screens/SettingsScreen'

/*
  All routes live here. Screens with the bottom nav are nested inside <AppShell>.
  The full-screen session player sits on its own, outside the shell (no bottom nav
  while you're training).
*/
export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/workouts" element={<WorkoutsScreen />} />
        <Route path="/workouts/:workoutId" element={<WorkoutDetailScreen />} />
        <Route path="/library" element={<LibraryScreen />} />
        <Route path="/library/:exerciseId" element={<ExerciseDetailScreen />} />
        <Route path="/builder" element={<BuilderScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Route>

      {/* Full-screen training mode, no bottom nav */}
      <Route path="/session/:workoutId" element={<SessionPlayer />} />
    </Routes>
  )
}
