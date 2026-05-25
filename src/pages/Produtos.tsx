import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const C = {
  bg: '#FFFBF5', peach: '#FFCBAD', deepPeach: '#FF8C61',
  green: '#9DC08B', rose: '#F28C8C', text: '#2D3436',
  muted: '#A89D98', card: '#FFFFFF', border: '#FFE5D4',
}

const SUPABASE_URL = 'https://pbluwnkettebcfpvumio.supabase.co/storage/v1/object/public/assets'

const AREAS_LIST = ['Rosto', 'Colo', 'Costas', 'Oral', 'Cabelo']
const PERIODOS_LIST = ['Manha', 'Noite']
const CATEGORIAS_LIST = ['Limpeza','Vitamina C','Clareador','Peptídeos','Niacinamida','Sérum','Sérum Antiacne','Esfoliante','Retinoide','Tratamento','Peeling','Sérum Olhos','Creme Olhos','Hidratante','Barreira/Reparador','Óleo Facial','Labial','Protetor Solar']
const STATUS_LIST = ['ativo', 'pausado', 'acabou']

const AREA_ICONS: Record<string, string> = {
  Rosto:  `${SUPABASE_URL}/icon-rosto.png`,
  Colo:   `${SUPABASE_URL}/icon-colo.png`,
  Costas: `${SUPABASE_URL}/icon-costas.png`,
  Oral: `${SUPABASE_URL}/icon-oral.png`,
  Cabelo: `${SUPABASE_URL}/icon-cabelo.png`,
}

const STATUS_COLORS: Record<string, string> = {
  ativo:   '#9DC08B',
  pausado: '#FFCBAD',
  acabou:  '#F28C8C',
}

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
  dias_da_semana: string[] | null
  principio_ativo?: string
}

const EMPTY_PRODUTO = {
  nome: '', marca: '', categoria: '', areas: [] as string[],
  periodos: [] as string[], dias_da_semana: ['Todos'] as string[], ordem: 5, status: 'ativo',
  em_uso: true, descricao_ia: '', principio_ativo: '',
}

async function gerarDescricaoIA(nome: string, marca: string, categoria: string, areas: string[], periodos: string[], produtosExistentes: Produto[], principioAtivo?: string) {
  const key = import.meta.env.VITE_GEMINI_API_KEY
  if (!key) return null

  const listaProdutos = produtosExistentes.map(p => `${p.nome} (${p.categoria})`).join(', ')
  const isMedicacao = areas?.includes('Oral')

  const prompt = isMedicacao
    ? `Você é um especialista em farmacologia. Responda APENAS com JSON, sem texto extra.

Nome comercial: "${nome}" | Fabricante: "${marca}"${principioAtivo ? ` | Princípio ativo: "${principioAtivo}"` : ''}

Instruções:
- Se houver princípio ativo, use-o como base para descrever a medicação — ignore se o nome comercial é desconhecido
- Se houver apenas nome comercial, tente identificar
- Pode ser medicamento manipulado, marca regional, ou genérico — ainda assim forneça descrição útil
- NUNCA recuse descrever ou retorne erro — sempre forneça indicação clínica baseada no que foi informado

Retorne exatamente este JSON:
{
  "descricao": "descrição de 1-2 frases sobre indicação e mecanismo desta medicação",
  "ordem": 1,
  "nomeCorrigido": "nome corrigido se houver erro de grafia óbvio, senão igual ao original"
}`
    : `Você é um especialista em produtos de saúde e beleza. Responda APENAS com JSON, sem texto extra.

Produto: "${nome}" da marca "${marca}"
Categoria: ${categoria}
Áreas: ${areas.join(', ')}
Períodos: ${periodos.join(', ')}
Outros produtos na rotina: ${listaProdutos || 'nenhum'}

Instruções:
- Pode ser skincare, suplemento, vitamina, creme corporal ou qualquer produto de saúde/beleza
- NUNCA recuse descrever — sempre forneça descrição útil

Retorne exatamente este JSON:
{
  "descricao": "descrição concisa de 1-2 frases da função do produto",
  "ordem": número de 1 a 10 indicando posição ideal na rotina (1=primeiro, 10=último),
  "interacoes": "observação breve sobre interação com os outros produtos (ou 'Nenhuma interação relevante' se não houver)"
}`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        })
      }
    )
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return null
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return null
  }
}

function TagPeriodo({ periodo }: { periodo: string }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
      background: periodo === 'Manha' ? '#FFF3CD' : '#E8E0F0',
      color: periodo === 'Manha' ? '#B7860B' : '#6B4FA0',
    }}>
      {periodo === 'Manha' ? '☀️ Manhã' : '🌙 Noite'}
    </span>
  )
}

function ProdutoCard({ produto, onToggle, onEdit }: {
  produto: Produto
  onToggle: (id: string, val: boolean) => void
  onEdit: (p: Produto) => void
}) {
  return (
    <div style={{
      background: C.card, borderRadius: 12,
      border: `1px solid ${produto.em_uso ? C.border : '#eee'}`,
      padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8,
      opacity: produto.em_uso ? 1 : 0.6,
      transition: 'all 0.2s',
    }}>
      {/* Ícone da área principal */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: C.bg, border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {produto.areas[0] && AREA_ICONS[produto.areas[0]] ? (
          <img src={AREA_ICONS[produto.areas[0]]} style={{ width: 24, height: 24, objectFit: 'contain' }} />
        ) : (
          <span style={{ fontSize: 20 }}>🧴</span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {produto.nome}
        </div>
        <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>{produto.marca}</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {produto.areas.slice(0, 2).map(a => (
            <span key={a} style={{
              fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
              background: `${C.peach}66`, color: C.deepPeach,
            }}>{a}</span>
          ))}
          {produto.periodos.map(p => <TagPeriodo key={p} periodo={p} />)}
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
            background: `${STATUS_COLORS[produto.status]}33`,
            color: STATUS_COLORS[produto.status],
          }}>#{produto.ordem}</span>
        </div>
        {produto.descricao_ia && (
          <div style={{ fontSize: 10, color: C.muted, marginTop: 4, fontStyle: 'italic', lineHeight: 1.3 }}>
            {produto.descricao_ia.slice(0, 80)}{produto.descricao_ia.length > 80 ? '…' : ''}
          </div>
        )}
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => onEdit(produto)}
          style={{
            background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '4px 8px', cursor: 'pointer',
            fontSize: 10, color: C.muted, fontWeight: 600,
          }}
        >✏️</button>
        {/* Toggle em uso */}
        <div
          onClick={() => onToggle(produto.id, !produto.em_uso)}
          style={{
            width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
            background: produto.em_uso ? C.green : '#DDD',
            position: 'relative', transition: 'background 0.2s',
          }}
        >
          <div style={{
            position: 'absolute', top: 2,
            left: produto.em_uso ? 18 : 2,
            width: 16, height: 16, borderRadius: '50%',
            background: 'white', transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </div>
      </div>
    </div>
  )
}

function FormProduto({ inicial, produtos, onSave, onClose }: {
  inicial: Partial<Produto>
  produtos: Produto[]
  onSave: (p: Partial<Produto>) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({ ...EMPTY_PRODUTO, ...inicial })
  const [loadingIA, setLoadingIA] = useState(false)
  const [iaResult, setIaResult] = useState<{ descricao: string; ordem: number; interacoes: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const toggle = (field: 'areas' | 'periodos' | 'dias_da_semana', val: string) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val]
    }))
  }

  const handleIA = async () => {
    if (!form.nome) return
    setLoadingIA(true)
    const res = await gerarDescricaoIA(form.nome, form.marca, form.categoria, form.areas, form.periodos, produtos, form.principio_ativo)
    if (res) {
      setIaResult(res)
      setForm(f => ({ 
        ...f, 
        descricao_ia: res.descricao, 
        ordem: res.ordem,
        nome: res.nomeCorrigido || f.nome
      }))
    }
    setLoadingIA(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end', zIndex: 100,
    }}>
      <div style={{
        background: C.card, width: '100%', maxWidth: 430, margin: '0 auto',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '24px 20px 60px', maxHeight: '92vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
            {inicial.id ? 'Editar Produto' : 'Novo Produto'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: C.muted }}>✕</button>
        </div>

        {/* Nome e Marca */}
        {['nome', 'marca'].map(field => (
          <div key={field} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
              {field === 'nome' ? 'Nome do Produto' : 'Marca'}
            </label>
            <input
              value={(form as any)[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              placeholder={field === 'nome' ? 'Ex: Niacinamide 10%' : 'Ex: The Ordinary'}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 12, boxSizing: 'border-box',
                border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text,
                background: C.bg, outline: 'none',
              }}
            />
          </div>
        ))}

        {/* Princípio Ativo — só para medicamentos orais */}
        {form.areas.includes('Oral') && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>
              Princípio Ativo
            </label>
            <input
              value={form.principio_ativo ?? ''}
              onChange={e => setForm(f => ({ ...f, principio_ativo: e.target.value }))}
              placeholder="Ex: Vortioxetina, Escitalopram, Minoxidil..."
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 12, boxSizing: 'border-box',
                border: `1.5px solid ${C.deepPeach}66`, fontSize: 13, color: C.text,
                background: `${C.deepPeach}08`, outline: 'none',
              }}
            />
          </div>
        )}

        {/* Categoria */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Categoria</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIAS_LIST.map(cat => (
              <button key={cat} onClick={() => setForm(f => ({ ...f, categoria: cat }))}
                style={{
                  padding: '6px 12px', borderRadius: 10, border: `1.5px solid ${form.categoria === cat ? C.deepPeach : C.border}`,
                  background: form.categoria === cat ? `${C.deepPeach}22` : 'transparent',
                  color: form.categoria === cat ? C.deepPeach : C.muted,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>{cat}</button>
            ))}
          </div>
        </div>

        {/* Áreas */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Áreas</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {AREAS_LIST.map(area => (
              <button key={area} onClick={() => toggle('areas', area)}
                style={{
                  padding: '6px 12px', borderRadius: 10, border: `1.5px solid ${form.areas.includes(area) ? C.deepPeach : C.border}`,
                  background: form.areas.includes(area) ? `${C.deepPeach}22` : 'transparent',
                  color: form.areas.includes(area) ? C.deepPeach : C.muted,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>{area}</button>
            ))}
          </div>
        </div>

        {/* Períodos */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Período</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {PERIODOS_LIST.map(p => (
              <button key={p} onClick={() => toggle('periodos', p)}
                style={{
                  padding: '6px 16px', borderRadius: 10, border: `1.5px solid ${form.periodos.includes(p) ? C.deepPeach : C.border}`,
                  background: form.periodos.includes(p) ? `${C.deepPeach}22` : 'transparent',
                  color: form.periodos.includes(p) ? C.deepPeach : C.muted,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>{p === 'Manha' ? '☀️ Manhã' : '🌙 Noite'}</button>
            ))}
          </div>
        </div>


        {/* Dias da Semana */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Dias da Semana</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Todos','Segunda','Terca','Quarta','Quinta','Sexta','Sabado','Domingo'].map(dia => {
              const selected = (form.dias_da_semana || ['Todos']).includes(dia)
              return (
                <button key={dia} onClick={() => {
                  if (dia === 'Todos') {
                    setForm(f => ({ ...f, dias_da_semana: ['Todos'] }))
                  } else {
                    setForm(f => {
                      const cur = (f.dias_da_semana || ['Todos']).filter(d => d !== 'Todos')
                      const next = cur.includes(dia) ? cur.filter(d => d !== dia) : [...cur, dia]
                      return { ...f, dias_da_semana: next.length === 0 ? ['Todos'] : next }
                    })
                  }
                }}
                  style={{
                    padding: '6px 10px', borderRadius: 10,
                    border: `1.5px solid ${selected ? C.deepPeach : C.border}`,
                    background: selected ? `${C.deepPeach}22` : 'transparent',
                    color: selected ? C.deepPeach : C.muted,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>
                  {dia === 'Terca' ? 'Terça' : dia === 'Sabado' ? 'Sábado' : dia}
                </button>
              )
            })}
          </div>
        </div>

        {/* Ordem */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
            Ordem de Aplicação: <span style={{ color: C.deepPeach }}>{form.ordem}</span>
          </label>
          <input type="range" min={1} max={10} value={form.ordem}
            onChange={e => setForm(f => ({ ...f, ordem: Number(e.target.value) }))}
            style={{ width: '100%', accentColor: C.deepPeach }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted }}>
            <span>1 (primeiro)</span><span>10 (último)</span>
          </div>
        </div>

        {/* Status */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Status</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUS_LIST.map(s => (
              <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                style={{
                  padding: '6px 12px', borderRadius: 10, border: `1.5px solid ${form.status === s ? STATUS_COLORS[s] : C.border}`,
                  background: form.status === s ? `${STATUS_COLORS[s]}22` : 'transparent',
                  color: form.status === s ? STATUS_COLORS[s] : C.muted,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                }}>{s}</button>
            ))}
          </div>
        </div>


        {/* Delete inline */}
        {inicial.id && (
          <div style={{ marginBottom: 12 }}>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                style={{
                  width: '100%', padding: '11px', borderRadius: 14, border: `1.5px solid #F28C8C`,
                  background: 'transparent', color: '#F28C8C',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>
                🗑️ Excluir produto
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmDelete(false)}
                  style={{
                    flex: 1, padding: '11px', borderRadius: 14, border: `1.5px solid ${C.border}`,
                    background: 'transparent', color: C.muted,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}>Cancelar</button>
                <button onClick={() => onSave({ ...form, _delete: true } as any)}
                  style={{
                    flex: 1, padding: '11px', borderRadius: 14, border: 'none',
                    background: '#F28C8C', color: 'white',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}>Confirmar exclusão</button>
              </div>
            )}
          </div>
        )}

        {/* Botão IA */}
        <button onClick={handleIA} disabled={!form.nome || loadingIA}
          style={{
            width: '100%', padding: '11px', borderRadius: 14, border: 'none',
            background: !form.nome ? '#eee' : `linear-gradient(135deg, #FF8C61, #FFCBAD)`,
            color: !form.nome ? C.muted : 'white',
            fontSize: 13, fontWeight: 700, cursor: form.nome ? 'pointer' : 'default',
            marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          {loadingIA ? '⏳ Analisando...' : '✨ Preencher com IA'}
        </button>

        {/* Resultado IA */}
        {iaResult && (
          <div style={{
            background: `${C.peach}33`, borderRadius: 12, padding: '12px 14px', marginBottom: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.deepPeach, marginBottom: 6 }}>✨ Sugestão da IA</div>
            <div style={{ fontSize: 12, color: C.text, marginBottom: 4 }}>{iaResult.descricao}</div>
            {iaResult.interacoes !== 'Nenhuma interação relevante' && (
              <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>💡 {iaResult.interacoes}</div>
            )}
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Ordem sugerida: <b style={{ color: C.deepPeach }}>#{iaResult.ordem}</b></div>
          </div>
        )}

        {/* Descrição editável */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Descrição</label>
          <textarea
            value={form.descricao_ia}
            onChange={e => setForm(f => ({ ...f, descricao_ia: e.target.value }))}
            placeholder="Gerada pela IA ou escreva manualmente..."
            rows={2}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12, boxSizing: 'border-box',
              border: `1.5px solid ${C.border}`, fontSize: 12, color: C.text,
              background: C.bg, outline: 'none', resize: 'none', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Salvar */}
        <button onClick={() => onSave(form)}
          style={{
            width: '100%', padding: '13px', borderRadius: 14, border: 'none',
            background: C.deepPeach, color: 'white',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(255,140,97,0.35)',
          }}>
          Salvar Produto
        </button>
      </div>
    </div>
  )
}

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroArea, setFiltroArea] = useState<string | null>(null)
  const [filtroPeriodo, setFiltroPeriodo] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Partial<Produto> | null>(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .order('ordem', { ascending: true })
    setProdutos(data ?? [])
    setLoading(false)
  }

  async function salvar(form: Partial<Produto> & { _delete?: boolean }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (form._delete && form.id) {
      await supabase.from('produtos').delete().eq('id', form.id)
    } else if (form.id) {
      const { _delete, ...data } = form as any
      await supabase.from('produtos').update({ ...data }).eq('id', form.id)
    } else {
      await supabase.from('produtos').insert({
        ...form,
        user_id: user.id,
        dias_da_semana: form.dias_da_semana || ['Todos'],
      })
    }
    setShowForm(false)
    setEditando(null)
    carregar()
  }

  async function toggleEmUso(id: string, val: boolean) {
    await supabase.from('produtos').update({ em_uso: val }).eq('id', id)
    setProdutos(ps => ps.map(p => p.id === id ? { ...p, em_uso: val } : p))
  }

  const filtrados = produtos.filter(p => {
    if (filtroArea && !p.areas.includes(filtroArea)) return false
    if (filtroPeriodo && !p.periodos.includes(filtroPeriodo)) return false
    return true
  })

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: C.bg, minHeight: '100vh', maxWidth: 430, margin: '0 auto', paddingBottom: 100 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Header */}
      <div style={{ padding: 'max(env(safe-area-inset-top), 8px) 20px 6px' }}>
        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>Minha Coleção</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Produtos</div>
      </div>

      {/* Filtros por período */}
      <div style={{ display: 'flex', gap: 6, padding: '0 20px 8px' }}>
        {[null, 'Manha', 'Noite'].map(p => (
          <button key={p ?? 'todos'} onClick={() => setFiltroPeriodo(p)}
            style={{
              padding: '5px 14px', borderRadius: 10,
              border: `1.5px solid ${filtroPeriodo === p ? C.deepPeach : C.border}`,
              background: filtroPeriodo === p ? C.deepPeach : '#FFF5F0',
              color: filtroPeriodo === p ? 'white' : C.muted,
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
              transition: 'all 0.2s',
            }}>
            {p === null ? 'Todos' : p === 'Manha' ? '☀️ Manhã' : '🌙 Noite'}
          </button>
        ))}
      </div>

      {/* Filtros por área — igual ao estilo da Rotina */}
      <div style={{ display: 'flex', gap: 4, padding: '0 12px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <button onClick={() => setFiltroArea(null)}
          style={{
            flexShrink: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 2, padding: '6px 6px', borderRadius: 14,
            border: filtroArea === null ? 'none' : `1.5px solid ${C.border}`,
            cursor: 'pointer', minWidth: 48,
            background: filtroArea === null ? C.deepPeach : C.card,
            boxShadow: filtroArea === null ? `0 4px 12px ${C.deepPeach}44` : 'none',
            transition: 'all 0.2s ease',
          }}>
          <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            🧴
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: filtroArea === null ? 'white' : C.muted, lineHeight: 1 }}>Todas</span>
        </button>
        {AREAS_LIST.map(area => (
          <button key={area} onClick={() => setFiltroArea(area === filtroArea ? null : area)}
            style={{
              flexShrink: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 4, padding: '8px 10px', borderRadius: 16,
              border: filtroArea === area ? 'none' : `1.5px solid ${C.border}`,
              cursor: 'pointer', minWidth: 64,
              background: filtroArea === area ? C.deepPeach : C.card,
              boxShadow: filtroArea === area ? `0 4px 12px ${C.deepPeach}44` : 'none',
              transition: 'all 0.2s ease',
            }}>
            <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={AREA_ICONS[area]}
                style={{
                  width: 32, height: 32, objectFit: 'contain',
                  filter: filtroArea === area ? 'brightness(0) invert(1)' : 'none',
                  transition: 'filter 0.2s',
                }}
              />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: filtroArea === area ? 'white' : C.muted, lineHeight: 1 }}>
              {area}
            </span>
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <img
              src="https://pbluwnkettebcfpvumio.supabase.co/storage/v1/object/public/assets/mascote-confuso.png"
              alt="Pesseguinho"
              style={{ width: 120, height: 120, objectFit: 'contain', marginBottom: 8, opacity: 0.85 }}
            />
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>
              Nenhum produto ainda
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
              Toque no botão <b style={{ color: C.deepPeach }}>+</b> para cadastrar<br />seu primeiro produto!
            </div>
          </div>
        ) : filtrados.map(p => (
          <ProdutoCard
            key={p.id}
            produto={p}
            onToggle={toggleEmUso}
            onEdit={(prod) => { setEditando(prod); setShowForm(true) }}
          />
        ))}
      </div>

      {/* Botão flutuante + */}
      <button
        onClick={() => { setEditando(null); setShowForm(true) }}
        style={{
          position: 'fixed', bottom: 90, right: 20,
          width: 56, height: 56, borderRadius: '50%',
          background: C.deepPeach, border: 'none', cursor: 'pointer',
          fontSize: 28, color: 'white', fontWeight: 300,
          boxShadow: '0 6px 20px rgba(255,140,97,0.55), 0 2px 8px rgba(255,140,97,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >+</button>

      {/* Formulário */}
      {showForm && (
        <FormProduto
          inicial={editando ?? {}}
          produtos={produtos}
          onSave={salvar}
          onClose={() => { setShowForm(false); setEditando(null) }}
        />
      )}
    </div>
  )
}
