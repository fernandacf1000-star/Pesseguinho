import { useState } from 'react'

const C = {
  bg: '#FFFBF5', peach: '#FFCBAD', deepPeach: '#FF8C61',
  text: '#2D3436', muted: '#A89D98', green: '#9DC08B',
}

const SUPABASE = 'https://pbluwnkettebcfpvumio.supabase.co/storage/v1/object/public/assets'

const SLIDES = [
  {
    img: `${SUPABASE}/mascote-drpesse.png`,
    titulo: 'Bem-vinda ao Pesseguinho! 🍑',
    texto: 'Seu assistente dermatológico pessoal e inteligente. Vamos cuidar da sua pele juntos!',
    cor: '#FFCBAD',
  },
  {
    emoji: '☀️',
    titulo: 'Rotina & Inteligência',
    texto: 'O Dr. Pessê organiza sua rotina, faz o Skin Cycling e te avisa quando sua pele precisa de pausa.',
    cor: '#FFE5D4',
  },
  {
    emoji: '📸',
    titulo: 'Evolução Visual',
    texto: 'Acompanhe seu glow-up! Tire fotos e deixe nossa IA analisar a evolução das suas manchas e viço.',
    cor: '#E8F5E9',
  },
  {
    emoji: '💰',
    titulo: 'Finanças Inteligentes',
    texto: 'Skincare é investimento. Monitore preços, calcule o custo por mL e saiba quando repor sua prateleira.',
    cor: '#FFF3CD',
  },
]

export default function Tutorial({ onFinish }: { onFinish: () => void }) {
  const [slide, setSlide] = useState(0)
  const [saindo, setSaindo] = useState(false)

  function avancar() {
    if (slide < SLIDES.length - 1) {
      setSaindo(true)
      setTimeout(() => { setSlide(s => s + 1); setSaindo(false) }, 200)
    } else {
      onFinish()
    }
  }

  const s = SLIDES[slide]

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif",
      minHeight: '100vh', background: C.bg,
      display: 'flex', flexDirection: 'column',
      maxWidth: 430, margin: '0 auto',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        @keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        .slide-content { animation: slideIn 0.3s ease; }
        .float-img { animation: float 3s ease-in-out infinite; }
      `}</style>

      {/* Botão pular */}
      <div style={{ padding: '52px 24px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onFinish}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.muted, fontFamily: 'inherit', fontWeight: 600 }}>
          Pular →
        </button>
      </div>

      {/* Conteúdo do slide */}
      <div className="slide-content" key={slide} style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '24px 32px', textAlign: 'center',
        opacity: saindo ? 0 : 1, transition: 'opacity 0.2s',
      }}>
        {/* Imagem ou emoji */}
        <div className="float-img" style={{ marginBottom: 32 }}>
          {'img' in s ? (
            <img src={s.img} alt="Dr. Pessê"
              style={{ width: 200, height: 200, objectFit: 'contain' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = `${SUPABASE}/mascote2.png` }}
            />
          ) : (
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: s.cor, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 56,
            }}>
              {s.emoji}
            </div>
          )}
        </div>

        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 16, lineHeight: 1.3 }}>
          {s.titulo}
        </div>
        <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, maxWidth: 300 }}>
          {s.texto}
        </div>
      </div>

      {/* Rodapé */}
      <div style={{ padding: '0 32px 52px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        {/* Dots */}
        <div style={{ display: 'flex', gap: 8 }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === slide ? 20 : 8, height: 8, borderRadius: 4,
              background: i === slide ? C.deepPeach : C.peach,
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Botão avançar */}
        <button onClick={avancar}
          style={{
            width: '100%', padding: '15px', borderRadius: 16, border: 'none',
            background: C.deepPeach, color: 'white',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(255,140,97,0.4)',
            transition: 'transform 0.15s',
            fontFamily: 'inherit',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}>
          {slide === SLIDES.length - 1 ? '🍑 Começar!' : 'Próximo →'}
        </button>
      </div>
    </div>
  )
}
