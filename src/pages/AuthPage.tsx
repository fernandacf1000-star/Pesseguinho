import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { checkInvite, markInviteUsed } from '../lib/inviteList'

const C = {
  bg: '#FFFBF5', peach: '#FFCBAD', deepPeach: '#FF8C61',
  green: '#9DC08B', rose: '#F28C8C', text: '#2D3436',
  muted: '#A89D98', card: '#FFFFFF', border: '#FFE5D4',
}

const MASCOTE = 'https://pbluwnkettebcfpvumio.supabase.co/storage/v1/object/public/assets/mascote2.png'

type Mode = 'login' | 'signup'

export default function AuthPage() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        const invited = await checkInvite(email)
        if (!invited) {
          setError('Este email nao esta na lista de convidados.')
          setLoading(false)
          return
        }
        await signUpWithEmail(email, password)
        await markInviteUsed(email)
        setSuccess('Conta criada! Verifique seu email.')
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      if (msg.includes('Invalid login credentials')) setError('Email ou senha incorretos.')
      else if (msg.includes('Email not confirmed')) setError('Confirme seu email antes de entrar.')
      else if (msg.includes('User already registered')) setError('Este email ja tem uma conta.')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar com Google')
      setLoading(false)
    }
  }

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif",
      background: C.bg,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
        input { outline: none; font-family: 'Outfit', sans-serif; }
        input:focus { border-color: #FF8C61 !important; }
        .auth-btn:active { transform: scale(0.98); }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .mascot-float { animation: float 3.5s ease-in-out infinite; }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: -50 }}>
        <div className="mascot-float">
          <img
            src={MASCOTE}
            alt="Pesseguinho"
            style={{ width: 200, height: 200, objectFit: 'contain', display: 'block', margin: '0 auto' }}
          />
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.text }}>Pesseguinho</div>
        <div style={{ fontSize: 12, color: C.deepPeach, marginTop: 4, fontStyle: 'italic', letterSpacing: '0.02em' }}>
          Sua pele como p&ecirc;ssego &#129392;
        </div>
      </div>

      <div style={{
        width: '100%', maxWidth: 380,
        background: C.card, borderRadius: 24,
        border: `1.5px solid ${C.border}`,
        padding: '28px 24px',
        boxShadow: '0 8px 32px rgba(255,203,173,0.15)',
        marginTop: 70,
      }}>
        <div style={{
          display: 'flex', background: C.bg, borderRadius: 12,
          padding: 4, marginBottom: 24, gap: 4,
        }}>
          {(['login', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null) }}
              style={{
                flex: 1, padding: '8px', borderRadius: 10, border: 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: mode === m ? C.deepPeach : 'transparent',
                color: mode === m ? 'white' : C.muted,
                transition: 'all 0.2s',
              }}
            >
              {m === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          ))}
        </div>

        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 4 }}>Email</label>
            <input
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com" required
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 12,
                border: `1.5px solid ${C.border}`, fontSize: 14,
                color: C.text, background: C.bg, boxSizing: 'border-box' as const,
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 4 }}>Senha</label>
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Minimo 6 caracteres' : ''}
              required minLength={6}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 12,
                border: `1.5px solid ${C.border}`, fontSize: 14,
                color: C.text, background: C.bg, boxSizing: 'border-box' as const,
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#FFF0F0', border: `1px solid ${C.rose}44`,
              borderRadius: 10, padding: '10px 12px',
              fontSize: 12, color: C.rose, fontWeight: 500,
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              background: '#F0FFF4', border: `1px solid ${C.green}44`,
              borderRadius: 10, padding: '10px 12px',
              fontSize: 12, color: C.green, fontWeight: 500,
            }}>{success}</div>
          )}

          <button type="submit" disabled={loading} className="auth-btn"
            style={{
              width: '100%', padding: '13px', borderRadius: 14, border: 'none',
              background: loading ? C.peach : C.deepPeach,
              color: 'white', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              transition: 'all 0.2s', marginTop: 4,
              boxShadow: loading ? 'none' : '0 4px 14px rgba(255,140,97,0.35)',
            }}>
            {loading ? '...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontSize: 12, color: C.muted }}>ou</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        <button onClick={handleGoogle} disabled={loading} className="auth-btn"
          style={{
            width: '100%', padding: '12px', borderRadius: 14,
            border: `1.5px solid ${C.border}`,
            background: 'white', cursor: loading ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontSize: 13, fontWeight: 600, color: C.text, transition: 'all 0.2s',
          }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
            <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/>
          </svg>
          Continuar com Google
        </button>

        <div style={{
          marginTop: 20, padding: '10px 12px',
          background: `${C.peach}33`, borderRadius: 10,
          fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 1.5,
        }}>
          App restrito a convidados. Solicite acesso.
        </div>
      </div>
    </div>
  )
}
