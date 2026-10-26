import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.scss'
import CvPage from './CvPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CvPage />
  </StrictMode>,
)
