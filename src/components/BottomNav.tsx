import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/',         icon: '🕐', label: 'Rotina'   },
  { path: '/produtos', icon: '🧴', label: 'Produtos'  },
  { path: '/evolucao', icon: '📸', label: 'Evolução'  },
  { path: '/financas', icon: '💰', label: 'Finanças'  },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 390,
      background: 'rgba(255,251,245,0.95)',
      backdropFilter: 'blur(12px)',
      borderTop: '1.5px solid #FFE5D4',
      display: 'flex', zIndex: 100,
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
              padding: '10px 0 8px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: active ? '#FF8C61' : '#A89D98',
              fontFamily: "'Outfit', sans-serif",
              fontSize: 11, fontWeight: 500,
              transition: 'color 0.2s',
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
