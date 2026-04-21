import { Navigate, Route, Routes } from 'react-router-dom'

import { JdKeywordsPage } from './pages/JdKeywordsPage.tsx'
import { JsonScorePage } from './pages/JsonScorePage.tsx'
import { LandingPage } from './pages/LandingPage.tsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/json-score" element={<JsonScorePage />} />
      <Route path="/jd-keywords" element={<JdKeywordsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
