import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './demo/App'
// The component's stylesheet, imported the same way a consumer would import 'delivery-journey-3d/styles.css'.
import './lib/styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
