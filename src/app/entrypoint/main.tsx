import '~/app/styles/index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Providers } from '~/app/providers'

const rootElement = document.getElementById('root')

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <Providers />
    </StrictMode>,
  )
}
