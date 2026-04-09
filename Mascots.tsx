import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from './hooks/useAuth'
import BottomNav from './components/BottomNav'
import AuthPage from './pages/AuthPage'
import Rotina from './pages/Rotina'

const qc = new QueryClient()

const Placeholder = ({ label }: { label: string }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', fontFamily: "'Outfit',sans-serif",
    color: '#A89D98', fontSize: 16,
  }}>
    {label} — em breve
  </div>
)

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth()
  if (authState.status === 'loading') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#FFFBF5', fontSize: 36,
      }}>🍑</div>
    )
  }
  if (authState.status === 'unauthenticated') return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppLayout() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FFFBF5; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
      <Routes>
        <Route path="/"         element={<Rotina />} />
        <Route path="/produtos" element={<Placeholder label="Meus Produtos" />} />
        <Route path="/evolucao" element={<Placeholder label="Evolução da Pele" />} />
        <Route path="/financas" element={<Placeholder label="Finanças" />} />
        <Route path="/analise"  element={<Placeholder label="Análise IA" />} />
      </Routes>
      <BottomNav />
    </>
  )
}

function Root() {
  const { authState } = useAuth()
  if (authState.status === 'loading') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#FFFBF5', fontSize: 36,
      }}>🍑</div>
    )
  }
  return (
    <Routes>
      <Route
        path="/login"
        element={authState.status === 'authenticated' ? <Navigate to="/" replace /> : <AuthPage />}
      />
      <Route
        path="/*"
        element={<ProtectedRoute><AppLayout /></ProtectedRoute>}
      />
    </Routes>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Root />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
