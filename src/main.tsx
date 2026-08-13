import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

/*
  HashRouter, not BrowserRouter — the URLs read /#/workouts instead of /workouts.

  GitHub Pages is a plain file server: it has no way to answer a request for
  /pitchwork/workouts, because no such file exists, so a refresh or a shared deep
  link would 404. Everything after the # never reaches the server, so routing stays
  entirely ours. Query params still work (/#/library/x?from=y), which is what the
  drill pages rely on to show a session's own prescription.
*/
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
