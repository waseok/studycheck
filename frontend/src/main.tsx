import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

// Google Client ID가 있을 때만 GoogleOAuthProvider 사용
const AppWithProviders = () => {
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.trim() !== '') {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    )
  }
  return <App />
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppWithProviders />
    </ErrorBoundary>
  </React.StrictMode>,
)

