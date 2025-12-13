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

// GoogleOAuthProvider는 항상 렌더링하되, client_id가 없을 때는 더미 값 사용
// (실제로는 Google 로그인 버튼이 조건부로 렌더링되므로 문제 없음)
const AppWithProviders = () => {
  // client_id가 없을 때는 더미 값 사용 (Provider는 필수이지만 실제로는 사용되지 않음)
  const clientId = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.trim() !== '' 
    ? GOOGLE_CLIENT_ID 
    : 'dummy-client-id'
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  )
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppWithProviders />
    </ErrorBoundary>
  </React.StrictMode>,
)

