import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const C = {
  bg: '#FFFBF5', peach: '#FFCBAD', deepPeach: '#FF8C61',
  green: '#9DC08B', rose: '#F28C8C', text: '#2D3436',
  muted: '#A89D98', card: '#FFFFFF', border: '#FFE5D4',
}

const SUPABASE = 'https://pbluwnkettebcfpvumio.supabase.co/storage/v1/object/public/assets'
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY

type Produto = {
  id: string
  nome: string
  marca: string
  categoria: string
  areas: string[]
  periodos: string[]
  ordem: number
  status: string
  em_uso: boolean
  descricao_ia: string
}

type Sugestao = {
  produto_id: string
  nome: string
  acao: 'pausar' | 'reativar' | 'mudar_ordem' | 'mudar_periodo'
  valor?: number | string
}

type MsgChat = {
  role: 'user' | 'ai'
  text: string
  sugestoes?: Sugestao[]
}

const AREAS = [
  { id: 'rosto',  label: 'Rosto',  icon: `${SUPABASE}/icon-rosto.png`  },
  { id: 'colo',   label: 'Colo',   icon: `${SUPABASE}/icon-colo.png`   },
  { id: 'costas', label: 'Costas', icon: `${SUPABASE}/icon-costas.png` },
  { id: 'cabelo', label: 'Cabelo', icon: `${SUPABASE}/icon-cabelo.png` },
  { id: 'pernas', label: 'Pernas', icon: `${SUPABASE}/icon-pernas.png` },
]

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 4, fontFamily: "'Outfit', sans-serif",
    }}>
      <style>{`
        @keyframes float-loading { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-16px); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .loading-mascot { animation: float-loading 2s ease-in-out infinite, fade-in 0.5s ease; }
        @keyframes dot-pulse { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
        .dot1 { animation: dot-pulse 1.2s ease-in-out infinite 0s; }
        .dot2 { animation: dot-pulse 1.2s ease-in-out infinite 0.2s; }
        .dot3 { animation: dot-pulse 1.2s ease-in-out infinite 0.4s; }
      `}</style>
      <img src={`${SUPABASE}/mascote2.png`} alt="Pesseguinho" className="loading-mascot"
        style={{ width: 200, height: 200, objectFit: 'contain' }} />
      <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginTop: 0 }}>Pesseguinho</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {['dot1', 'dot2', 'dot3'].map((cls) => (
          <div key={cls} className={cls} style={{ width: 8, height: 8, borderRadius: '50%', background: C.deepPeach }} />
        ))}
      </div>
    </div>
  )
}


function formatMd(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^#{1,3}\s+(.+)$/gm, '<strong style="font-size:13px;display:block;margin-top:8px">$1</strong>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #FFE5D4;margin:8px 0"/>')
    .replace(/^[\*\-]\s+(.+)$/gm, '<span style="display:block;padding-left:8px">• $1</span>')
    .replace(/^\d+\.\s+(.+)$/gm, '<span style="display:block;padding-left:8px">$&</span>')
    .replace(/\n/g, '<br/>')
}

function ChatIA({ produtos, onAplicar }: { produtos: Produto[], onAplicar: (sugestoes: Sugestao[]) => void }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<MsgChat[]>([
    { role: 'ai', text: 'Olá! Sou o Dr. Pessê 🍑 Pode me perguntar qualquer coisa sobre sua rotina!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function enviar() {
    if (!input.trim() || loading) return
    const pergunta = input.trim()
    setInput('')
    setMsgs(m => [...m, { role: 'user', text: pergunta }])
    setLoading(true)

    const listaProdutos = produtos.map(p =>
      `- ${p.nome} (${p.marca}) | Categoria: ${p.categoria} | Áreas: ${p.areas.join(', ')} | Período: ${p.periodos.join('/')} | Ordem: ${p.ordem} | Em uso: ${p.em_uso} | ID: ${p.id}`
    ).join('\n')

    const prompt = `Você é uma especialista em skincare. Responda em português brasileiro de forma direta e concisa — máximo 5 frases na resposta, sem introduções longas.

Rotina atual:
${listaProdutos || 'Nenhum produto cadastrado ainda.'}

Pergunta: "${pergunta}"

Retorne SOMENTE um JSON válido, sem markdown, sem backticks, sem texto fora do JSON:
{"resposta":"resposta curta e direta aqui","sugestoes":[{"produto_id":"id","nome":"nome","acao":"pausar|reativar|mudar_ordem|mudar_periodo","valor":null}]}

Se não houver sugestões, retorne "sugestoes":[].`

    try {
      if (!GEMINI_KEY) {
        setMsgs(m => [...m, { role: 'ai', text: 'Chave da IA não configurada. Verifique as variáveis de ambiente no Vercel.' }])
        setLoading(false)
        return
      }
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            
          })
        }
      )
      const data = await res.json()
      if (data.error) {
        setMsgs(m => [...m, { role: 'ai', text: `Erro da IA: ${data.error.message}` }])
        setLoading(false)
        return
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      try {
        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(clean)
        setMsgs(m => [...m, {
          role: 'ai',
          text: parsed.resposta,
          sugestoes: parsed.sugestoes?.length > 0 ? parsed.sugestoes : undefined
        }])
      } catch {
        setMsgs(m => [...m, { role: 'ai', text: text || 'Não consegui interpretar a resposta.' }])
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setMsgs(m => [...m, { role: 'ai', text: `Erro: ${msg}` }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Botão flutuante do chat */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 90, right: 20,
          width: 52, height: 52, borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.deepPeach}, #FF6B35)`,
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(255,140,97,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, zIndex: 50,
          transition: 'transform 0.2s',
        }}
        title="Perguntar à IA"
      >✨</button>

      {/* Modal do chat */}
      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'flex-end', zIndex: 200, paddingBottom: 65,
        }}>
          <div style={{
            background: C.card, width: '100%', maxWidth: 430, margin: '0 auto',
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            height: '80dvh', maxHeight: '80vh', display: 'flex', flexDirection: 'column', paddingBottom: 0,
          }}>
            {/* Header */}
            <div style={{
              padding: '14px 20px 12px', borderBottom: `1px solid ${C.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src="https://pbluwnkettebcfpvumio.supabase.co/storage/v1/object/public/assets/mascote-drpesse.png"
                  alt="Dr. Pesse"
                  style={{ width: 80, height: 80, objectFit: 'contain' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Dr. Pessê 🍑</div>
                  <div style={{ fontSize: 10, color: C.muted }}>Seu consultor pessoal de skincare</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: C.muted, flexShrink: 0 }}>✕</button>
            </div>

            {/* Mensagens */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {msgs.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%', padding: '10px 14px', borderRadius: 16,
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                    borderBottomLeftRadius: msg.role === 'ai' ? 4 : 16,
                    background: msg.role === 'user' ? C.deepPeach : C.bg,
                    color: msg.role === 'user' ? 'white' : C.text,
                    fontSize: 13, lineHeight: 1.5,
                    border: msg.role === 'ai' ? `1px solid ${C.border}` : 'none',
                  }}>
                    {msg.role === 'ai' ? (
                      <span dangerouslySetInnerHTML={{ __html: formatMd(msg.text) }} />
                    ) : msg.text}
                  </div>

                  {/* Sugestoes da IA */}
                  {msg.sugestoes && msg.sugestoes.length > 0 && (
                    <div style={{
                      marginTop: 8, background: `${C.peach}33`,
                      borderRadius: 12, padding: '10px 14px', maxWidth: '85%',
                      border: `1px solid ${C.peach}`,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.deepPeach, marginBottom: 6 }}>
                        💡 Sugestões de ajuste:
                      </div>
                      {msg.sugestoes.map((s, j) => (
                        <div key={j} style={{ fontSize: 12, color: C.text, marginBottom: 4 }}>
                          • <b>{s.nome}</b>: {
                            s.acao === 'pausar' ? 'Pausar temporariamente' :
                            s.acao === 'reativar' ? 'Reativar' :
                            s.acao === 'mudar_ordem' ? `Mover para posição ${s.valor}` :
                            `Mudar para período ${s.valor}`
                          }
                        </div>
                      ))}
                      <button
                        onClick={() => { onAplicar(msg.sugestoes!); setOpen(false) }}
                        style={{
                          marginTop: 8, width: '100%', padding: '8px',
                          borderRadius: 10, border: 'none',
                          background: C.deepPeach, color: 'white',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        Aplicar sugestões ✓
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: 16, borderBottomLeftRadius: 4,
                    background: C.bg, border: `1px solid ${C.border}`,
                    fontSize: 13, color: C.muted,
                  }}>
                    Analisando sua rotina...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: '12px 16px 16px', borderTop: `1px solid ${C.border}`,
              display: 'flex', gap: 8,
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && enviar()}
                placeholder="Ex: minha pele está descascando..."
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 20,
                  border: `1.5px solid ${C.border}`, fontSize: 13,
                  background: C.bg, outline: 'none', color: C.text,
                  fontFamily: 'inherit',
                }}
              />
              <button onClick={enviar} disabled={!input.trim() || loading}
                style={{
                  width: 40, height: 40, borderRadius: '50%', border: 'none',
                  background: input.trim() ? C.deepPeach : C.border,
                  color: 'white', fontSize: 16, cursor: input.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>→</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const FASES = [
  { id: 'limpeza',   label: 'Limpeza & Preparo',    categorias: ['Limpeza'] },
  { id: 'tratamento', label: 'Tratamento Específico', categorias: ['Vitamina C','Clareador','Peptídeos','Niacinamida','Sérum','Sérum Antiacne','Esfoliante','Retinoide','Tratamento','Peeling'] },
  { id: 'olhos',     label: 'Área dos Olhos',        categorias: ['Sérum Olhos','Creme Olhos'] },
  { id: 'reparo',    label: 'Reparo & Selagem',      categorias: ['Hidratante','Barreira/Reparador','Óleo Facial','Labial'] },
  { id: 'protecao',  label: 'Proteção',              categorias: ['Protetor Solar'] },
]

const ALTO_RISCO = ['retinoide','esfoliante','peeling','tratamento']

function isAltoRisco(categoria: string): boolean {
  return ALTO_RISCO.some(r => categoria.toLowerCase().includes(r))
}

function ProductCard({ p, isChecked, onClick, peleSensivel }: {
  p: Produto, isChecked: boolean, onClick: () => void, peleSensivel: boolean
}) {
  const altoRisco = isAltoRisco(p.categoria)
  const [showToast, setShowToast] = useState(false)

  function handleClick() {
    if (peleSensivel && altoRisco && !isChecked) {
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2500)
    }
    onClick()
  }

  return (
    <div style={{ position: 'relative' }}>
      {showToast && (
        <div style={{
          position: 'absolute', top: -36, left: 0, right: 0, zIndex: 10,
          background: C.deepPeach, color: 'white', borderRadius: 10,
          padding: '6px 12px', fontSize: 11, fontWeight: 600, textAlign: 'center',
        }}>
          Pele sensível hoje. Use com cautela! 🧡
        </div>
      )}
      <div onClick={handleClick}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: C.card,
          border: `1.5px solid ${isChecked ? C.green : C.border}`,
          borderRadius: 16, padding: '12px 16px', cursor: 'pointer',
          transition: 'all 0.2s ease',
          opacity: isChecked ? 0.7 : (peleSensivel && altoRisco ? 0.6 : 1),
          transform: isChecked ? 'scale(0.98)' : 'scale(1)',
          filter: peleSensivel && altoRisco && !isChecked ? 'grayscale(40%)' : 'none',
        }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: isChecked ? C.green : C.peach,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: isChecked ? 'white' : C.deepPeach,
        }}>{p.ordem}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: C.text,
              textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.5 : 1,
            }}>{p.categoria}</div>
            {peleSensivel && altoRisco && <span style={{ fontSize: 12 }}>⚠️</span>}
            {peleSensivel && !altoRisco && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#3B6D11',
                background: '#EAF3DE', borderRadius: 6, padding: '2px 6px',
              }}>SKIN FRIENDLY</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: C.muted }}>
            {p.marca} · <span style={{ fontWeight: 500 }}>{p.nome}</span>
          </div>
          {p.descricao_ia && (
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2, fontStyle: 'italic' }}>
              {p.descricao_ia.slice(0, 60)}{p.descricao_ia.length > 60 ? '…' : ''}
            </div>
          )}
        </div>
        <div style={{
          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
          border: `2px solid ${isChecked ? C.green : C.border}`,
          background: isChecked ? C.green : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isChecked && (
            <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
              <path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductList({ produtos, peleSensivel }: { produtos: Produto[], peleSensivel: boolean }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const total = produtos.length
  const done = Object.values(checked).filter(Boolean).length

  if (produtos.length === 0) return (
    <div style={{ textAlign: 'center', padding: '20px 0', color: C.muted, fontSize: 13 }}>
      Nenhum produto cadastrado para esta área e período.
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ height: 4, background: C.border, borderRadius: 2, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${total > 0 ? (done / total) * 100 : 0}%`,
          background: C.green, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
      {FASES.map(fase => {
        const itens = produtos.filter(p => fase.categorias.some(c => p.categoria.includes(c)))
        if (itens.length === 0) return null
        return (
          <div key={fase.id} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: C.muted,
              letterSpacing: 1.5, textTransform: 'uppercase',
              paddingBottom: 8, marginBottom: 8,
              borderBottom: `1px solid ${C.border}`,
            }}>
              {fase.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {itens.map(p => (
                <ProductCard
                  key={p.id}
                  p={p}
                  isChecked={checked[p.id] ?? false}
                  onClick={() => setChecked(prev => ({ ...prev, [p.id]: !(prev[p.id] ?? false) }))}
                  peleSensivel={peleSensivel}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Rotina() {
  const [activeTab, setActiveTab] = useState(AREAS[0].id)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [peleSensivel, setPeleSensivel] = useState(false)
  const [periodo, setPeriodo] = useState<'manha' | 'noite'>(() => {
    const hora = new Date().getHours()
    return hora >= 6 && hora < 18 ? 'manha' : 'noite'
  })

  const diaSemana = new Date().toLocaleDateString('pt-BR', { weekday: 'long' })
    .replace(/^./, (c) => c.toUpperCase())

  useEffect(() => {
    carregarProdutos()
  }, [])

  async function carregarProdutos() {
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .eq('em_uso', true)
      .order('ordem', { ascending: true })
    setProdutos(data ?? [])
  }

  async function aplicarSugestoes(sugestoes: Sugestao[]) {
    for (const s of sugestoes) {
      if (s.acao === 'pausar') {
        await supabase.from('produtos').update({ em_uso: false }).eq('id', s.produto_id)
      } else if (s.acao === 'reativar') {
        await supabase.from('produtos').update({ em_uso: true }).eq('id', s.produto_id)
      } else if (s.acao === 'mudar_ordem') {
        await supabase.from('produtos').update({ ordem: s.valor }).eq('id', s.produto_id)
      } else if (s.acao === 'mudar_periodo') {
        const p = produtos.find(p => p.id === s.produto_id)
        if (p) {
          const novosPeriodos = s.valor === 'Manha' ? ['Manha'] : ['Noite']
          await supabase.from('produtos').update({ periodos: novosPeriodos }).eq('id', s.produto_id)
        }
      }
    }
    carregarProdutos()
  }

  const produtosFiltrados = produtos.filter(p =>
    p.areas.includes(AREAS.find(a => a.id === activeTab)?.label ?? '') &&
    p.periodos.includes(periodo === 'manha' ? 'Manha' : 'Noite')
  )

  const current = AREAS.find((a) => a.id === activeTab)!

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif", background: C.bg, minHeight: '100vh',
      maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Header */}
      <div style={{ padding: '52px 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {diaSemana}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>
            Rotina {periodo === 'manha' ? 'Manhã' : 'Noite'}
          </div>
          <div style={{
            display: 'flex', marginTop: 8, background: C.border,
            borderRadius: 20, padding: 3, gap: 2, width: 'fit-content',
          }}>
            {(['manha', 'noite'] as const).map((p) => (
              <button key={p} onClick={() => setPeriodo(p)}
                style={{
                  padding: '4px 12px', borderRadius: 16, border: 'none',
                  cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  background: periodo === p ? C.deepPeach : 'transparent',
                  color: periodo === p ? 'white' : C.muted,
                  transition: 'all 0.2s',
                }}>
                {p === 'manha' ? '☀️ Manhã' : '🌙 Noite'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: 'white',
            border: `2.5px solid ${C.peach}`, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(255,203,173,0.4)',
          }}>
            <img
              src={periodo === 'manha' ? `${SUPABASE}/mascote-manha.png` : `${SUPABASE}/mascote-noite.png`}
              alt="Pesseguinho"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = `${SUPABASE}/mascote2.png` }}
            />
          </div>
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login' }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 10, color: C.muted,
              display: 'flex', alignItems: 'center', gap: 3, padding: 0,
            }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sair
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8, padding: '0 20px 16px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {AREAS.map((area) => {
          const isActive = area.id === activeTab
          return (
            <button key={area.id} onClick={() => setActiveTab(area.id)}
              style={{
                flexShrink: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4, padding: '8px 10px', borderRadius: 16,
                border: isActive ? 'none' : `1.5px solid ${C.border}`,
                cursor: 'pointer', minWidth: 64,
                background: isActive ? C.deepPeach : C.card,
                boxShadow: isActive ? `0 4px 12px ${C.deepPeach}44` : 'none',
                transition: 'all 0.2s ease',
              }}>
              <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={area.icon} alt={area.label}
                  style={{
                    width: 28, height: 28, objectFit: 'contain',
                    filter: isActive ? 'brightness(0) invert(1)' : 'none',
                    transition: 'filter 0.2s',
                  }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? 'white' : C.muted, lineHeight: 1 }}>
                {area.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Card conteúdo */}
      <div style={{
        flex: 1, padding: '24px 20px 100px',
        background: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32,
        boxShadow: '0 -8px 24px rgba(0,0,0,0.04)',
      }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            background: `${C.peach}44`, color: C.deepPeach,
            padding: '4px 12px', borderRadius: 10, fontSize: 11, fontWeight: 800,
          }}>{current.label.toUpperCase()}</span>
          <button
            onClick={() => setPeleSensivel(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: peleSensivel ? `${C.deepPeach}22` : C.border,
              transition: 'all 0.25s',
            }}>
            <div style={{
              width: 28, height: 16, borderRadius: 8,
              background: peleSensivel ? C.deepPeach : C.muted,
              position: 'relative', transition: 'background 0.25s',
            }}>
              <div style={{
                position: 'absolute', top: 2,
                left: peleSensivel ? 14 : 2,
                width: 12, height: 12, borderRadius: '50%',
                background: 'white', transition: 'left 0.25s',
              }} />
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: peleSensivel ? C.deepPeach : C.muted,
            }}>
              {peleSensivel ? '🌸 Sensível' : 'Pele normal'}
            </span>
          </button>
        </div>
        <ProductList produtos={produtosFiltrados} peleSensivel={peleSensivel} />
      </div>

      {/* Chat IA */}
      <ChatIA produtos={produtos} onAplicar={aplicarSugestoes} />
    </div>
  )
}
