import { Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import HomeScreen from './screens/HomeScreen'
import WorkoutsScreen from './screens/WorkoutsScreen'
import LibraryScreen from './screens/LibraryScreen'
import BuilderScreen from './screens/BuilderScreen'
import HistoryScreen from './screens/HistoryScreen'
import SettingsScreen from './screens/SettingsScreen'

/*
  All routes live here. Screens with the bottom nav are nested inside <AppShell>.
  (The full-screen session player will later be its own route, outside the shell.)
*/
export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/workouts" element={<WorkoutsScreen />} />
        <Route path="/library" element={<LibraryScreen />} />
        <Route path="/builder" element={<BuilderScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Route>
    </Routes>
  )
}
