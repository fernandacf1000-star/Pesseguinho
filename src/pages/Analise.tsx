import { useState } from 'react'
import { detectConflicts, SEVERITY_CONFIG, TYPE_LABELS } from '../lib/conflictRules'
import { useGeminiAnalysis, type SkinAnalysisInput } from '../lib/geminiAnalysis'


// ── Animação de pulse para loading ───────────────────────────────────────
const PULSE_STYLE = `
  @keyframes pesseguinho-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.45; }
  }
  .pesseguinho-pulse {
    animation: pesseguinho-pulse 1.8s ease-in-out infinite;
  }
`

// ── Paleta ────────────────────────────────────────────────────────────────
const C = {
  bg: '#FFFBF5', peach: '#FFCBAD', deepPeach: '#FF8C61',
  green: '#9DC08B', rose: '#F28C8C', text: '#2D3436',
  muted: '#A89D98', card: '#FFFFFF', border: '#FFE5D4',
}

// ── Mock: produtos em uso (substituir por query Supabase real) ─────────────
const MOCK_INPUT: SkinAnalysisInput = {
  daysSinceStart: 45,
  products: [
    { name: 'Gel de Limpeza Suave', brand: 'La Roche-Posay', category: 'Limpeza',    actives: ['niacinamida'],        usageFrequency: 28, period: 'ambos'  },
    { name: 'Niacinamide 10%',      brand: 'The Ordinary',   category: 'Tratamento', actives: ['niacinamida'],        usageFrequency: 25, period: 'noite'  },
    { name: 'Retinal 0.1%',         brand: 'Geek & Gorgeous',category: 'Tratamento', actives: ['retinal'],            usageFrequency: 12, period: 'noite'  },
    { name: 'Hidratante Calmante',  brand: 'Bioderma',        category: 'Hidratação', actives: ['ceramidas', 'zinco'], usageFrequency: 28, period: 'ambos'  },
    { name: 'Protetor Solar FPS50', brand: 'Isdin',           category: 'Proteção',  actives: ['vitamina e'],         usageFrequency: 22, period: 'manha'  },
  ],
  skinNotes: [
    { date: '2025-05-01', notes: 'Pele levemente vermelha após retinal, sem descamação' },
    { date: '2025-05-08', notes: 'Melhora visível na oleosidade, poros menos aparentes' },
    { date: '2025-05-15', notes: 'Pele estabilizou, tolerando bem o retinal. Textura mais uniforme.' },
    { date: '2025-05-22', notes: 'Manchas clarareando levemente. Sem irritação desta semana.' },
  ],
  photos: [], // Conectar ao Supabase Storage em produção
}

// ── Componente de card de conflito ────────────────────────────────────────
function ConflictCard({ conflict }: { conflict: ReturnType<typeof detectConflicts>[0] }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = SEVERITY_CONFIG[conflict.severity]

  return (
    <div style={{
      background: cfg.bg, border: `1.5px solid ${cfg.color}33`,
      borderRadius: 16, overflow: 'hidden',
    }}>
      <div
        onClick={() => setExpanded((v) => !v)}
        style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}
      >
        <span style={{ fontSize: 18, flexShrink: 0 }}>{cfg.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: cfg.color,
              background: `${cfg.color}22`, borderRadius: 6, padding: '2px 7px',
            }}>
              {TYPE_LABELS[conflict.type]}
            </span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 3 }}>
            {conflict.title}
          </div>
        </div>
        <span style={{ fontSize: 16, color: C.muted, flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${cfg.color}22` }}>
          <div style={{ marginTop: 10, fontSize: 12, color: C.text, lineHeight: 1.6 }}>
            {conflict.explanation}
          </div>
          <div style={{
            marginTop: 10, fontSize: 12, fontWeight: 600,
            color: cfg.color, display: 'flex', gap: 6, alignItems: 'flex-start',
          }}>
            <span>💡</span>
            <span>{conflict.recommendation}</span>
          </div>
        </div>
      )}
    </div>
      </div>
  )
}

// ── Componente de sugestão da IA ──────────────────────────────────────────
function SuggestionCard({ s }: { s: { type: string; product?: string; explanation: string; priority: string } }) {
  const icons: Record<string, string> = {
    increase: '📈', reduce: '📉', maintain: '✅', avoid: '🚫', add: '➕',
  }
  const labels: Record<string, string> = {
    increase: 'Aumentar', reduce: 'Reduzir', maintain: 'Manter', avoid: 'Evitar', add: 'Adicionar',
  }
  const priorityColor: Record<string, string> = {
    high: C.rose, medium: C.deepPeach, low: C.green,
  }

  return (
    <div style={{
      background: C.card, border: `1.5px solid ${C.border}`,
      borderRadius: 14, padding: '12px 14px',
      display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icons[s.type] ?? '•'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: priorityColor[s.priority] ?? C.muted,
            background: `${priorityColor[s.priority] ?? C.muted}22`,
            borderRadius: 6, padding: '2px 7px',
          }}>
            {labels[s.type]}
          </span>
          {s.product && (
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{s.product}</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>{s.explanation}</div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────
export default function AnalisePage() {
  const allActives = MOCK_INPUT.products.flatMap((p) => p.actives)
  const conflicts = detectConflicts(allActives)
  const dangers  = conflicts.filter((c) => c.severity === 'danger')
  const warnings = conflicts.filter((c) => c.severity === 'warning')
  const infos    = conflicts.filter((c) => c.severity === 'info' && c.type !== 'synergy')
  const synergies = conflicts.filter((c) => c.type === 'synergy')

  const { state, analyze, reset } = useGeminiAnalysis()

  const reactionColors = {
    positive: C.green, neutral: C.muted, negative: C.rose, mixed: C.deepPeach,
  }
  const reactionLabels = {
    positive: 'Positiva ✨', neutral: 'Neutra', negative: 'Negativa ⚠️', mixed: 'Mista',
  }

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif", background: C.bg,
      minHeight: '100vh', padding: '0 0 100px',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');`}</style>
      <style>{PULSE_STYLE}</style>

      {/* Header */}
      <div style={{ padding: '52px 20px 16px', background: C.bg }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              Pesseguinho
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, marginTop: 2 }}>
              Análise da Rotina
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
              {MOCK_INPUT.products.length} produtos · {MOCK_INPUT.daysSinceStart} dias de rotina
            </div>
          </div>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "white", border: `2.5px solid ${C.peach}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 6px 14px rgba(0,0,0,0.06)", flexShrink: 0 }}>🍑</div>
        </div>
      </div>

      {/* Carrossel de produtos em análise */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px 20px', scrollbarWidth: 'none' }}>
        {MOCK_INPUT.products.map((p, i) => (
          <div key={i} style={{ flexShrink: 0, background: 'white', border: `1px solid ${C.border}`, borderRadius: 12, padding: '6px 12px', fontSize: 11, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 6, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <span style={{ color: C.muted, fontSize: 14 }}>{p.category === 'Limpeza' ? '🫧' : p.category === 'Proteção' ? '☀️' : '💧'}</span>
            {p.name}
          </div>
        ))}
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Nível 1: Conflitos locais ── */}
        <section>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 12 }}>
            🔬 Análise de Ativos
          </div>

          {conflicts.length === 0 ? (
            <div style={{
              background: '#F0FFF4', border: `1.5px solid ${C.green}44`,
              borderRadius: 16, padding: '14px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>✅</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>
                Nenhum conflito detectado
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                Seus ativos são compatíveis entre si.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Resumo */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                {dangers.length > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: '#F28C8C',
                    background: '#FFF0F0', borderRadius: 8, padding: '4px 10px',
                  }}>
                    🚫 {dangers.length} perigo{dangers.length > 1 ? 's' : ''}
                  </span>
                )}
                {warnings.length > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: C.deepPeach,
                    background: '#FFF5F0', borderRadius: 8, padding: '4px 10px',
                  }}>
                    ⚠️ {warnings.length} atenção
                  </span>
                )}
                {synergies.length > 0 && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: C.green,
                    background: '#F0FFF4', borderRadius: 8, padding: '4px 10px',
                  }}>
                    ✨ {synergies.length} sinergia{synergies.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Perigos */}
              {dangers.map((c, i) => <ConflictCard key={i} conflict={c} />)}
              {/* Warnings */}
              {warnings.map((c, i) => <ConflictCard key={i} conflict={c} />)}
              {/* Infos */}
              {infos.map((c, i) => <ConflictCard key={i} conflict={c} />)}
              {/* Sinergias */}
              {synergies.map((c, i) => <ConflictCard key={i} conflict={c} />)}
            </div>
          )}
        </section>

        {/* ── Nível 2: Análise com IA ── */}
        <section>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>
            🤖 Análise com IA
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
            Gemini 2.0 Flash analisa sua evolução, notas de sensibilidade e fotos.
          </div>

          {state.status === 'idle' && (
            <button
              onClick={() => analyze(MOCK_INPUT)}
              style={{
                width: '100%', padding: '14px', borderRadius: 16, border: 'none',
                background: C.deepPeach, color: 'white', cursor: 'pointer',
                fontSize: 14, fontWeight: 700,
                boxShadow: '0 4px 14px rgba(255,140,97,0.35)',
              }}
            >
              ✨ Analisar minha rotina
            </button>
          )}

          {state.status === 'loading' && (
            <div
              className="pesseguinho-pulse"
              style={{
                background: C.card, border: `1.5px solid ${C.border}`,
                borderRadius: 16, padding: '24px', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>🍑</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                Pesseguinho está analisando...
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                Consultando o Gemini sobre seus ativos e evolução
              </div>
            </div>
          )}

          {state.status === 'error' && (
            <div style={{
              background: '#FFF0F0', border: `1.5px solid ${C.rose}44`,
              borderRadius: 16, padding: '16px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.rose }}>
                Erro na análise
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                {state.message}
              </div>
              <button
                onClick={reset}
                style={{
                  marginTop: 10, padding: '8px 16px', borderRadius: 10, border: 'none',
                  background: C.rose, color: 'white', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                }}
              >
                Tentar novamente
              </button>
            </div>
          )}

          {state.status === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Avaliação geral */}
              <div style={{
                background: C.card, border: `1.5px solid ${C.border}`,
                borderRadius: 16, padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 16 }}>📋</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                    Avaliação geral
                  </span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                    color: reactionColors[state.result.skinReaction] ?? C.muted,
                    background: `${reactionColors[state.result.skinReaction] ?? C.muted}22`,
                    borderRadius: 8, padding: '2px 8px',
                  }}>
                    {reactionLabels[state.result.skinReaction]}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>
                  {state.result.overallAssessment}
                </div>
                {state.result.nextCheckInDays && (
                  <div style={{
                    marginTop: 10, fontSize: 11, color: C.muted,
                    background: C.bg, borderRadius: 8, padding: '6px 10px',
                  }}>
                    📅 Próxima avaliação recomendada em{' '}
                    <strong>{state.result.nextCheckInDays} dias</strong>
                  </div>
                )}
              </div>

              {/* Sugestões */}
              {state.result.suggestions?.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                    💡 Sugestões da IA
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {state.result.suggestions.map((s, i) => (
                      <SuggestionCard key={i} s={s} />
                    ))}
                  </div>
                </div>
              )}

              {/* Conflitos detectados pela IA */}
              {state.result.conflictsDetected?.length > 0 && (
                <div style={{
                  background: '#FFF8F0', border: `1.5px solid ${C.peach}`,
                  borderRadius: 14, padding: '12px 14px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.deepPeach, marginBottom: 6 }}>
                    ⚠️ Conflitos identificados pela IA
                  </div>
                  {state.result.conflictsDetected.map((c, i) => (
                    <div key={i} style={{
                      fontSize: 12, color: C.text, lineHeight: 1.5,
                      paddingLeft: 10, borderLeft: `2px solid ${C.peach}`,
                      marginBottom: i < state.result.conflictsDetected.length - 1 ? 6 : 0,
                    }}>
                      {c}
                    </div>
                  ))}
                </div>
              )}

              {/* Botão nova análise */}
              <button
                onClick={reset}
                style={{
                  width: '100%', padding: '12px', borderRadius: 14, border: `1.5px solid ${C.border}`,
                  background: 'white', color: C.muted, cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                }}
              >
                Nova análise
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
