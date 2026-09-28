import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const Root = () => {
  if (!PUBLISHABLE_KEY) {
    return (
      <StrictMode>
        <ThemeProvider>
          <BrowserRouter>
            <App mockupAuth={true} />
          </BrowserRouter>
        </ThemeProvider>
      </StrictMode>
    )
  }

  return (
    <StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <ThemeProvider>
          <BrowserRouter>
            <App mockupAuth={false} />
          </BrowserRouter>
        </ThemeProvider>
      </ClerkProvider>
    </StrictMode>
  )
}

createRoot(document.getElementById('root')).render(<Root />)
