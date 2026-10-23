import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import '../index.css'
import Blog from './Blog.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Blog />
    {/* Vercel Analytics only exists on the Vercel deployment, not GitHub Pages */}
    {!location.hostname.endsWith('github.io') && <Analytics />}
  </StrictMode>,
)
