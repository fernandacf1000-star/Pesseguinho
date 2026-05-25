import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const C = {
  bg: '#FFFBF5', peach: '#FFCBAD', deepPeach: '#FF8C61',
  green: '#9DC08B', text: '#2D3436', muted: '#A89D98',
  card: '#FFFFFF', border: '#FFE5D4',
}

const FASES = [
  { id: 'limpeza',    label: 'Limpeza',    cor: '#7B9EC5', categorias: ['Limpeza'] },
  { id: 'tratamento', label: 'Tratamento', cor: '#FF8C61', categorias: ['Vitamina C','Clareador','Peptídeos','Niacinamida','Sérum','Sérum Antiacne','Esfoliante','Retinoide','Tratamento','Peeling'] },
  { id: 'olhos',      label: 'Olhos',      cor: '#C5956A', categorias: ['Sérum Olhos','Creme Olhos'] },
  { id: 'reparo',     label: 'Reparo',     cor: '#9DC08B', categorias: ['Hidratante','Barreira/Reparador','Óleo Facial','Labial'] },
  { id: 'protecao',   label: 'Proteção',   cor: '#F4C842', categorias: ['Protetor Solar'] },
  { id: 'medicamentos', label: 'Medicamentos', cor: '#8B7BA8', categorias: ['Oral'] },
]

function getFase(categoria: string, areas?: string[]) {
  // Se é medicação oral, retorna fase de medicamentos
  if (areas?.includes('Oral')) {
    return { label: 'Medicamentos', cor: '#8B7BA8', id: 'medicamentos' }
  }
  return FASES.find(f => f.categorias.some(c => categoria?.toLowerCase().includes(c.toLowerCase()))) ?? { label: 'Outros', cor: C.muted }
}

type Produto = {
  id: string
  nome: string
  marca: string
  categoria: string
  status: string
  em_uso: boolean
}

type Compra = {
  id: string
  produto_id: string
  preco: number
  volume_ml: number | null
  data_compra: string
  loja: string | null
  produtos?: Produto
}

const EMPTY_FORM = {
  produto_id: '',
  preco: '',
  volume_ml: '',
  loja: '',
  data_compra: new Date().toISOString().split('T')[0],
}

function formatBRL(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ModalCompra({ inicial, produtos, onSave, onClose }: {
  inicial: Partial<typeof EMPTY_FORM> & { id?: string }
  produtos: Produto[]
  onSave: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...inicial })
  const [saving, setSaving] = useState(false)

  async function salvar() {
    if (!form.produto_id || !form.preco) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      produto_id: form.produto_id,
      preco: Number(form.preco),
      volume_ml: form.volume_ml ? Number(form.volume_ml) : null,
      loja: form.loja || null,
      data_compra: form.data_compra,
    }

    if (inicial.id) {
      await supabase.from('compras').update(payload).eq('id', inicial.id)
    } else {
      await supabase.from('compras').insert(payload)
      // Se produto estava 'acabou', reativar
      const prod = produtos.find(p => p.id === form.produto_id)
      if (prod?.status === 'acabou') {
        await supabase.from('produtos').update({ status: 'ativo', em_uso: true }).eq('id', form.produto_id)
      }
    }
    setSaving(false)
    onSave()
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 12,
    border: `1.5px solid ${C.border}`, fontSize: 13, color: C.text,
    background: C.bg, outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  }

  const labelStyle = {
    fontSize: 11, fontWeight: 700 as const, color: C.muted,
    display: 'block' as const, marginBottom: 4, textTransform: 'uppercase' as const,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
      <div style={{
        background: C.card, width: '100%', maxWidth: 430, margin: '0 auto',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: '24px 20px 48px', maxHeight: '92vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
            {inicial.id ? 'Editar Compra' : 'Registrar Compra'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: C.muted }}>✕</button>
        </div>

        {/* Produto */}
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Produto</label>
          <select value={form.produto_id} onChange={e => setForm(f => ({ ...f, produto_id: e.target.value }))} style={inputStyle}>
            <option value="">Selecione...</option>
            {produtos.map(p => (
              <option key={p.id} value={p.id}>{p.nome} — {p.marca}</option>
            ))}
          </select>
        </div>

        {/* Preço e Volume */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Preço (R$)</label>
            <input type="number" step="0.01" placeholder="0,00" value={form.preco}
              onChange={e => setForm(f => ({ ...f, preco: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Volume (mL/g)</label>
            <input type="number" placeholder="30" value={form.volume_ml}
              onChange={e => setForm(f => ({ ...f, volume_ml: e.target.value }))} style={inputStyle} />
          </div>
        </div>

        {/* Loja e Data */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Loja</label>
            <input placeholder="Ex: Sephora" value={form.loja}
              onChange={e => setForm(f => ({ ...f, loja: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Data</label>
            <input type="date" value={form.data_compra}
              onChange={e => setForm(f => ({ ...f, data_compra: e.target.value }))} style={inputStyle} />
          </div>
        </div>

        <button onClick={salvar} disabled={!form.produto_id || !form.preco || saving}
          style={{
            width: '100%', padding: '13px', borderRadius: 14, border: 'none',
            background: form.produto_id && form.preco ? C.deepPeach : '#DDD',
            color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
          {saving ? 'Salvando...' : '💾 Salvar Compra'}
        </button>
      </div>
    </div>
  )
}

export default function Financas() {
  const [compras, setCompras] = useState<Compra[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Partial<typeof EMPTY_FORM> & { id?: string }>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('compras').select('*, produtos(id, nome, marca, categoria, status, em_uso)').order('data_compra', { ascending: false }),
      supabase.from('produtos').select('id, nome, marca, categoria, status, em_uso').order('nome'),
    ])
    setCompras(c ?? [])
    setProdutos(p ?? [])
    setLoading(false)
  }

  // ── Métricas ─────────────────────────────────────────────────────────────
  const anoAtual = new Date().getFullYear()
  const comprasAno = compras.filter(c => new Date(c.data_compra).getFullYear() === anoAtual)
  const totalAno = comprasAno.reduce((s, c) => s + c.preco, 0)
  const custoDia = totalAno / 365

  // Gasto por fase
  const gastoPorFase = FASES.map(fase => {
    let total = 0
    if (fase.id === 'medicamentos') {
      // Para medicamentos, filtrar por área Oral
      total = comprasAno
        .filter(c => c.produtos && c.produtos.areas?.includes('Oral'))
        .reduce((s, c) => s + c.preco, 0)
    } else {
      // Para fases de skincare, filtrar por categoria
      total = comprasAno
        .filter(c => c.produtos && fase.categorias.some(cat => c.produtos!.categoria?.toLowerCase().includes(cat.toLowerCase())))
        .reduce((s, c) => s + c.preco, 0)
    }
    return { ...fase, total }
  }).filter(f => f.total > 0).sort((a, b) => b.total - a.total)

  const maxFase = Math.max(...gastoPorFase.map(f => f.total), 1)

  // Wishlist (produtos com status 'acabou')
  const wishlist = produtos.filter(p => p.status === 'acabou')

  // Histórico agrupado por mês (filtrando removidos)
  const comprasFiltradas = compras.filter(c => c.produtos?.nome)
  const porMes = comprasFiltradas.reduce<Record<string, Compra[]>>((acc, c) => {
    const key = new Date(c.data_compra).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif", background: C.bg, minHeight: '100vh',
      maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Header */}
      <div style={{ padding: '52px 20px 20px' }}>
        <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>Gestão</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Finanças 💰</div>
      </div>

      <div style={{
        flex: 1, background: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32,
        boxShadow: '0 -8px 24px rgba(0,0,0,0.04)', padding: '24px 20px 120px',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>Carregando...</div>
        ) : (
          <>
            {/* ── Cards de resumo ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div style={{ background: C.bg, borderRadius: 16, padding: '16px', border: `1.5px solid ${C.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  Gasto {anoAtual}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>{formatBRL(totalAno)}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{comprasAno.length} compras</div>
              </div>
              <div style={{ background: `${C.deepPeach}11`, borderRadius: 16, padding: '16px', border: `1.5px solid ${C.peach}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  Custo / dia
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.deepPeach }}>{formatBRL(custoDia)}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>sua rotina diária</div>
              </div>
            </div>

            {/* ── Gasto por fase ── */}
            {gastoPorFase.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                  Investimento por fase
                </div>
                {gastoPorFase.map(f => (
                  <div key={f.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{f.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: f.cor }}>{formatBRL(f.total)}</span>
                    </div>
                    <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        width: `${(f.total / maxFase) * 100}%`,
                        background: f.cor,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Wishlist / Reposição ── */}
            {wishlist.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                  🛒 Lista de Reposição
                </div>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
                  {wishlist.map(p => (
                    <div key={p.id} style={{
                      flexShrink: 0, background: C.bg, borderRadius: 16,
                      border: `1.5px solid ${C.border}`, padding: '12px 14px',
                      minWidth: 160,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 2 }}>{p.nome}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 10 }}>{p.marca}</div>
                      <button
                        onClick={() => { setEditando({ produto_id: p.id }); setShowModal(true) }}
                        style={{
                          width: '100%', padding: '7px', borderRadius: 10, border: 'none',
                          background: C.deepPeach, color: 'white',
                          fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        }}>
                        + Registrar Compra
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Histórico por mês ── */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>
                Histórico de compras
              </div>
              <span style={{ fontSize: 10, color: C.muted }}>{comprasFiltradas.length} registros</span>
            </div>

            {comprasFiltradas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: C.muted, fontSize: 13 }}>
                Nenhuma compra registrada ainda.<br />
                <span style={{ fontSize: 11 }}>Toque em + para adicionar!</span>
              </div>
            ) : (
              Object.entries(porMes).map(([mes, items]) => (
                <div key={mes} style={{ marginBottom: 20 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: C.muted,
                    textTransform: 'uppercase', letterSpacing: 1.5,
                    paddingBottom: 8, marginBottom: 10,
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex', justifyContent: 'space-between',
                  }}>
                    <span>{mes}</span>
                    <span style={{ color: C.deepPeach }}>{formatBRL(items.reduce((s, c) => s + c.preco, 0))}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map(c => {
                      const fase = getFase(c.produtos?.categoria ?? '', c.produtos?.areas)
                      const custoPorMl = c.volume_ml ? c.preco / c.volume_ml : null
                      return (
                        <div key={c.id}
                          onClick={() => { setEditando({ id: c.id, produto_id: c.produto_id, preco: String(c.preco), volume_ml: c.volume_ml ? String(c.volume_ml) : '', loja: c.loja ?? '', data_compra: c.data_compra }); setShowModal(true) }}
                          style={{
                            background: C.card, borderRadius: 14,
                            border: `1.5px solid ${C.border}`, padding: '12px 14px',
                            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                          }}>
                          <div style={{
                            width: 6, height: 40, borderRadius: 3,
                            background: fase.cor, flexShrink: 0,
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.produtos?.nome ?? 'Produto removido'}
                            </div>
                            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                              {c.loja && `${c.loja} · `}
                              {new Date(c.data_compra + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                              {c.volume_ml && ` · ${c.volume_ml}mL`}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{formatBRL(c.preco)}</div>
                            {custoPorMl && (
                              <div style={{ fontSize: 9, color: C.deepPeach, fontWeight: 700, marginTop: 2 }}>
                                {formatBRL(custoPorMl)}/mL
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditando({}); setShowModal(true) }}
        style={{
          position: 'fixed', bottom: 90, right: 20,
          width: 56, height: 56, borderRadius: '50%',
          background: C.deepPeach, border: 'none', cursor: 'pointer',
          fontSize: 28, color: 'white',
          boxShadow: '0 6px 20px rgba(255,140,97,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50,
        }}>+</button>

      {showModal && (
        <ModalCompra
          inicial={editando}
          produtos={produtos}
          onSave={() => { setShowModal(false); carregar() }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
