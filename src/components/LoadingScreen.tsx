const SUPABASE = 'https://pbluwnkettebcfpvumio.supabase.co/storage/v1/object/public/assets'
const C = { bg: '#FFFBF5', text: '#2D3436', deepPeach: '#FF8C61' }

export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 4, fontFamily: "'Outfit', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap');
        @keyframes float-loading { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-16px); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .loading-mascot { animation: float-loading 2s ease-in-out infinite, fade-in 0.5s ease; }
        @keyframes dot-pulse { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
        .dot1 { animation: dot-pulse 1.2s ease-in-out infinite 0s; }
        .dot2 { animation: dot-pulse 1.2s ease-in-out infinite 0.2s; }
        .dot3 { animation: dot-pulse 1.2s ease-in-out infinite 0.4s; }
      `}</style>
      <img
        src={`${SUPABASE}/mascote2.png`}
        alt="Pesseguinho"
        className="loading-mascot"
        style={{ width: 200, height: 200, objectFit: 'contain' }}
      />
      <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 0 }}>
        Pesseguinho
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {['dot1', 'dot2', 'dot3'].map((cls) => (
          <div key={cls} className={cls} style={{ width: 8, height: 8, borderRadius: '50%', background: C.deepPeach }} />
        ))}
      </div>
    </div>
  )
}
