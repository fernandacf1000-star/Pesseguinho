import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const C = {
  bg: '#FFFBF5', peach: '#FFCBAD', deepPeach: '#FF8C61',
  green: '#9DC08B', text: '#2D3436', muted: '#A89D98',
  card: '#FFFFFF', border: '#FFE5D4',
}

const SUPABASE_URL = 'https://pbluwnkettebcfpvumio.supabase.co'
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY

const ASSETS = 'https://pbluwnkettebcfpvumio.supabase.co/storage/v1/object/public/assets'

const AREAS = [
  { id: 'rosto',  label: 'Rosto',  icon: `${ASSETS}/icon-rosto.png`  },
  { id: 'colo',   label: 'Colo',   icon: `${ASSETS}/icon-colo.png`   },
  { id: 'costas', label: 'Costas', icon: `${ASSETS}/icon-costas.png` },
  { id: 'cabelo', label: 'Cabelo', icon: `${ASSETS}/icon-cabelo.png` },
  { id: 'pernas', label: 'Pernas', icon: `${ASSETS}/icon-pernas.png` },
]

type Foto = {
  id: string
  area: string
  foto_url: string
  angulo: string | null
  data_foto: string
  analise_ia: {
    vermelhidao: string
    hidratacao: string
    textura: string
    resumo: string
  } | null
  signed_url?: string
}

// Resize image before sending to AI
async function resizeImage(file: File, maxWidth = 700): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1])
    }
    img.src = url
  })
}

// Analyze photo with Gemini Vision
async function analisarFotoIA(base64: string): Promise<Foto['analise_ia']> {
  if (!GEMINI_KEY) return null
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: { mime_type: 'image/jpeg', data: base64 }
              },
              {
                text: `Analise esta foto de pele e responda SOMENTE com JSON válido, sem markdown:
{"vermelhidao":"baixa|moderada|alta","hidratacao":"baixa|moderada|boa","textura":"irregular|moderada|uniforme","resumo":"uma frase curta sobre o estado da pele"}`
              }
            ]
          }]
        })
      }
    )
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return null
  }
}

function BadgeIA({ analise }: { analise: NonNullable<Foto['analise_ia']> }) {
  const cores: Record<string, string> = {
    baixa: '#9DC08B', moderada: '#FFCA7A', alta: '#F28C8C',
    boa: '#9DC08B', uniforme: '#9DC08B', irregular: '#F28C8C',
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
      {[
        { label: `🩸 ${analise.vermelhidao}`, cor: cores[analise.vermelhidao] },
        { label: `💧 ${analise.hidratacao}`, cor: cores[analise.hidratacao] },
        { label: `🔬 ${analise.textura}`, cor: cores[analise.textura] },
      ].map((b, i) => (
        <span key={i} style={{
          fontSize: 9, fontWeight: 700, padding: '2px 7px',
          borderRadius: 8, background: `${b.cor}33`, color: b.cor.replace('33',''),
          border: `1px solid ${b.cor}66`,
        }}>{b.label}</span>
      ))}
    </div>
  )
}

function BeforeAfterSlider({ foto1, foto2 }: { foto1: string, foto2: string }) {
  const [pos, setPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  function getPos(clientX: number) {
    const rect = containerRef.current!.getBoundingClientRect()
    const p = ((clientX - rect.left) / rect.width) * 100
    setPos(Math.max(5, Math.min(95, p)))
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={() => { dragging.current = true }}
      onMouseUp={() => { dragging.current = false }}
      onMouseMove={e => { if (dragging.current) getPos(e.clientX) }}
      onTouchMove={e => getPos(e.touches[0].clientX)}
      style={{
        position: 'relative', width: '100%', height: 280,
        borderRadius: 20, overflow: 'hidden', cursor: 'col-resize',
        userSelect: 'none', touchAction: 'none',
      }}
    >
      <img src={foto2} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, width: `${pos}%`, overflow: 'hidden' }}>
        <img src={foto1} style={{ width: containerRef.current?.offsetWidth ?? 300, height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: `${pos}%`,
        width: 2, background: 'white', transform: 'translateX(-50%)',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 32, height: 32, borderRadius: '50%',
          background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: C.deepPeach,
        }}>↔</div>
      </div>
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.45)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8 }}>ANTES</div>
      <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,140,97,0.85)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8 }}>DEPOIS</div>
    </div>
  )
}

function AreaDetail({
  area, fotos, onBack, onDeepDive
}: {
  area: typeof AREAS[0]
  fotos: Foto[]
  onBack: () => void
  onDeepDive: (fotos: Foto[]) => void
}) {
  const [idx1, setIdx1] = useState(0)
  const [idx2, setIdx2] = useState(Math.min(1, fotos.length - 1))

  const fotosSorted = [...fotos].sort((a, b) => new Date(a.data_foto).getTime() - new Date(b.data_foto).getTime())

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>←</button>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={area.icon} style={{ width: 24, height: 24, objectFit: 'contain' }} />
          {area.label}
        </div>
      </div>

      {fotosSorted.length >= 2 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Comparar evolução</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <select value={idx1} onChange={e => setIdx1(Number(e.target.value))}
              style={{ flex: 1, padding: '6px 10px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 11, background: C.bg, color: C.text }}>
              {fotosSorted.map((f, i) => (
                <option key={f.id} value={i}>{new Date(f.data_foto).toLocaleDateString('pt-BR')}</option>
              ))}
            </select>
            <select value={idx2} onChange={e => setIdx2(Number(e.target.value))}
              style={{ flex: 1, padding: '6px 10px', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 11, background: C.bg, color: C.text }}>
              {fotosSorted.map((f, i) => (
                <option key={f.id} value={i}>{new Date(f.data_foto).toLocaleDateString('pt-BR')}</option>
              ))}
            </select>
          </div>
          {fotosSorted[idx1]?.signed_url && fotosSorted[idx2]?.signed_url && (
            <BeforeAfterSlider foto1={fotosSorted[idx1].signed_url!} foto2={fotosSorted[idx2].signed_url!} />
          )}

          <button
            onClick={() => onDeepDive(fotosSorted.slice(-2))}
            style={{
              width: '100%', marginTop: 12, padding: '12px',
              borderRadius: 14, border: 'none', cursor: 'pointer',
              background: C.deepPeach, color: 'white',
              fontSize: 13, fontWeight: 700,
            }}>
            🍑 Análise Detalhada com Dr. Pessê
          </button>
        </div>
      )}

      <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        Histórico — {fotosSorted.length} foto{fotosSorted.length !== 1 ? 's' : ''}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {fotosSorted.map(f => (
          <div key={f.id} style={{ borderRadius: 12, overflow: 'hidden', background: C.card, border: `1px solid ${C.border}` }}>
            {f.signed_url
              ? <img src={f.signed_url} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
              : <div style={{ width: '100%', aspectRatio: '1', background: C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📸</div>
            }
            <div style={{ padding: '6px 8px' }}>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>
                {new Date(f.data_foto).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </div>
              {f.analise_ia && <BadgeIA analise={f.analise_ia} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Evolucao() {
  const [fotos, setFotos] = useState<Foto[]>([])
  const [areaAtiva, setAreaAtiva] = useState<typeof AREAS[0] | null>(null)
  const [uploading, setUploading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [chatDeepDive, setChatDeepDive] = useState<Foto[] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
        carregarFotos(data.user.id)
      }
    })
  }, [])

  async function carregarFotos(uid: string) {
    const { data } = await supabase
      .from('evolucao_fotos')
      .select('*')
      .eq('user_id', uid)
      .order('data_foto', { ascending: false })

    if (!data) return

    const fotosComUrl = await Promise.all(
      data.map(async (f) => {
        const { data: urlData } = await supabase.storage
          .from('evolucao')
          .createSignedUrl(f.foto_url, 3600)
        return { ...f, signed_url: urlData?.signedUrl }
      })
    )
    setFotos(fotosComUrl)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length || !userId || !areaAtiva) return
    setUploading(true)

    for (const file of Array.from(e.target.files)) {
      const base64 = await resizeImage(file)
      const path = `${userId}/${areaAtiva.id}/${Date.now()}.jpg`

      const blob = await fetch(`data:image/jpeg;base64,${base64}`).then(r => r.blob())
      const { error } = await supabase.storage.from('evolucao').upload(path, blob, { contentType: 'image/jpeg' })
      if (error) continue

      const analise = await analisarFotoIA(base64)

      await supabase.from('evolucao_fotos').insert({
        user_id: userId,
        area: areaAtiva.id,
        foto_url: path,
        angulo: 'frontal',
        analise_ia: analise,
      })
    }

    await carregarFotos(userId)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function diasAtras(dataStr: string) {
    const dias = Math.floor((Date.now() - new Date(dataStr).getTime()) / 86400000)
    if (dias === 0) return 'Hoje'
    if (dias === 1) return 'Ontem'
    return `Há ${dias} dias`
  }

  const fotosPorArea = (areaId: string) => fotos.filter(f => f.area === areaId)
  const ultimaFoto = (areaId: string) => fotosPorArea(areaId)[0]

  if (chatDeepDive) {
    return (
      <DeepDiveChat
        fotos={chatDeepDive}
        onClose={() => setChatDeepDive(null)}
      />
    )
  }

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif", background: C.bg, minHeight: '100vh',
      maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ padding: '52px 20px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Acompanhamento
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>
            Evolução da Pele
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            Registre e compare sua evolução ao longo do tempo
          </div>
        </div>
        <img
          src="https://pbluwnkettebcfpvumio.supabase.co/storage/v1/object/public/assets/mascote-foto.png"
          alt="Pesseguinho"
          style={{ width: 90, height: 90, objectFit: 'contain', flexShrink: 0 }}
        />
      </div>

      <div style={{
        flex: 1, padding: '0 20px',
        background: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32,
        boxShadow: '0 -8px 24px rgba(0,0,0,0.04)', paddingTop: 24,
        paddingBottom: 120,
      }}>
        {areaAtiva ? (
          <>
            <AreaDetail
              area={areaAtiva}
              fotos={fotosPorArea(areaAtiva.id)}
              onBack={() => setAreaAtiva(null)}
              onDeepDive={(f) => setChatDeepDive(f)}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                position: 'fixed', bottom: 80, right: 20,
                width: 52, height: 52, borderRadius: '50%',
                background: uploading ? C.muted : C.deepPeach,
                border: 'none', cursor: uploading ? 'default' : 'pointer',
                boxShadow: '0 4px 16px rgba(255,140,97,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, zIndex: 50,
              }}>
              {uploading ? '⏳' : '📸'}
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {AREAS.map(area => {
              const ultima = ultimaFoto(area.id)
              const total = fotosPorArea(area.id).length
              return (
                <div
                  key={area.id}
                  onClick={() => setAreaAtiva(area)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: C.card, border: `1.5px solid ${C.border}`,
                    borderRadius: 18, padding: '14px 16px', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14, overflow: 'hidden',
                    background: C.border, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {ultima?.signed_url
                      ? <img src={ultima.signed_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <img src={area.icon} style={{ width: 32, height: 32, objectFit: 'contain' }} />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{area.label}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                      {ultima ? diasAtras(ultima.data_foto) : 'Nenhuma foto ainda'}
                    </div>
                    {ultima?.analise_ia && <BadgeIA analise={ultima.analise_ia} />}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.deepPeach }}>{total}</div>
                    <div style={{ fontSize: 9, color: C.muted }}>fotos</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function DeepDiveChat({ fotos, onClose }: { fotos: Foto[], onClose: () => void }) {
  const [msgs, setMsgs] = useState<{ role: string, text: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  useEffect(() => {
    const resumos = fotos.map(f =>
      f.analise_ia ? `${new Date(f.data_foto).toLocaleDateString('pt-BR')}: vermelhidão ${f.analise_ia.vermelhidao}, hidratação ${f.analise_ia.hidratacao}, textura ${f.analise_ia.textura}` : ''
    ).filter(Boolean).join('\n')

    setMsgs([{
      role: 'ai',
      text: `Olá! Estou analisando suas ${fotos.length} fotos mais recentes 🍑\n\n${resumos}\n\nMe pergunte qualquer coisa sobre sua evolução!`
    }])
  }, [])

  async function enviar() {
    if (!input.trim() || loading) return
    const pergunta = input.trim()
    setInput('')
    setMsgs(m => [...m, { role: 'user', text: pergunta }])
    setLoading(true)

    const contexto = fotos.map(f =>
      `Foto de ${new Date(f.data_foto).toLocaleDateString('pt-BR')}: ${JSON.stringify(f.analise_ia)}`
    ).join('\n')

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `Você é Dr. Pessê, especialista em skincare. Responda em português, de forma direta e empática, máximo 4 frases.\n\nContexto das fotos:\n${contexto}\n\nPergunta: ${pergunta}` }]
            }]
          })
        }
      )
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Não consegui analisar.'
      setMsgs(m => [...m, { role: 'ai', text }])
    } catch {
      setMsgs(m => [...m, { role: 'ai', text: 'Erro ao conectar com a IA.' }])
    }
    setLoading(false)
  }

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif", background: C.bg,
      minHeight: '100vh', maxWidth: 430, margin: '0 auto',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>←</button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>🍑 Dr. Pessê</div>
          <div style={{ fontSize: 11, color: C.muted }}>Análise visual das suas fotos</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {msgs.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '10px 14px', borderRadius: 16,
              borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
              borderBottomLeftRadius: msg.role === 'ai' ? 4 : 16,
              background: msg.role === 'user' ? C.deepPeach : C.card,
              color: msg.role === 'user' ? 'white' : C.text,
              fontSize: 13, lineHeight: 1.5,
              border: msg.role === 'ai' ? `1px solid ${C.border}` : 'none',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ padding: '10px 14px', borderRadius: 16, background: C.card, border: `1px solid ${C.border}`, fontSize: 13, color: C.muted, width: 'fit-content' }}>
            Analisando...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '12px 16px 80px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && enviar()}
          placeholder="Pergunte sobre sua evolução..."
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 20,
            border: `1.5px solid ${C.border}`, fontSize: 13,
            background: C.bg, outline: 'none', color: C.text, fontFamily: 'inherit',
          }}
        />
        <button onClick={enviar} disabled={!input.trim() || loading}
          style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none',
            background: input.trim() ? C.deepPeach : C.border,
            color: 'white', fontSize: 16, cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>→</button>
      </div>
    </div>
  )
}
