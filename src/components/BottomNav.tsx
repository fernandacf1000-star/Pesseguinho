import { useLocation, useNavigate } from 'react-router-dom'

const C = { peach: '#FFCBAD', deepPeach: '#FF8C61', muted: '#A89D98' }

const TABS = [
  { path: '/',         emoji: '🍑', label: 'Rotina'   },
  { path: '/produtos', emoji: '🧴', label: 'Produtos'  },
  { path: '/evolucao', emoji: '📸', label: 'Evolução'  },
  { path: '/financas', emoji: '💰', label: 'Finanças'  },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: 'rgba(255,251,245,0.95)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid #FFE5D4',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
      display: 'flex', zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {TABS.map((tab) => {
        const active = pathname === tab.path
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3,
              padding: '10px 0 10px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Outfit', sans-serif",
              transition: 'color 0.2s',
            }}
          >
            <div style={{
              width: 40, height: 28,
              borderRadius: 14,
              background: active ? `${C.peach}` : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
              transition: 'background 0.2s',
            }}>
              {tab.emoji}
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              color: active ? C.deepPeach : C.muted,
              transition: 'all 0.2s',
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
