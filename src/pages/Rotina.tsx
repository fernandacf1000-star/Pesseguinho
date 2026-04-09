import { useState, useEffect } from 'react'
import { ActiveMascot, PesseguinhoManha } from '../components/Mascots'
import {
  useActiveRoutine,
  useTodayLog,
  useCreateLog,
  useToggleLogItem,
  useDaysSinceLastPhoto,
} from '../hooks/useRotina'

const CATEGORY_ICONS: Record<string, string> = {
  Limpeza: '🧴',
  Tratamento: '🎯',
  'Tratamento Forte': '⭐',
  Hidratação: '💧',
  Proteção: '🛡️',
}

// Detecta período pelo horário
function getCurrentPeriod(): 'manha' | 'noite' {
  const h = new Date().getHours()
  return h >= 5 && h < 18 ? 'manha' : 'noite'
}

// Dia da semana atual (0=dom)
function getTodayDow() {
  return new Date().getDay()
}

export default function Rotina() {
  const period = getCurrentPeriod()
  const todayDow = getTodayDow()
  const daysSincePhoto = useDaysSinceLastPhoto()
  const showPhotoAlert = daysSincePhoto !== null && daysSincePhoto >= 15

  const { data: routineData, isLoading: loadingRoutine } = useActiveRoutine(period)
  const routineId = routineData?.routine.id
  const { data: todayLog, isLoading: loadingLog } = useTodayLog(routineId)

  const createLog = useCreateLog()
  const toggleItem = useToggleLogItem()

  // Filtra produtos para hoje
  const todayItems = (routineData?.items ?? []).filter(
    (item) => item.day_of_week.length === 0 || item.day_of_week.includes(todayDow)
  )

  // Garante que o log do dia existe ao carregar
  useEffect(() => {
    if (!routineId || loadingLog || todayLog) return
    createLog.mutate({
      routineId,
      productIds: todayItems.map((i) => i.product_id),
    })
  }, [routineId, loadingLog, todayLog])

  const logItems = todayLog?.usage_log_items ?? []
  const totalRequired = todayItems.filter((i) => !i.is_optional).length
  const totalChecked = logItems.filter((i) => i.checked).length
  const allDone = totalChecked >= totalRequired

  function handleToggle(productId: string) {
    if (!todayLog) return
    const logItem = logItems.find((li) => li.product_id === productId)
    if (!logItem) return
    toggleItem.mutate({
      logItemId: logItem.id,
      checked: !logItem.checked,
      logId: todayLog.id,
      routineId: routineId!,
    })
  }

  const greeting =
    period === 'manha'
      ? 'Bom dia! Pronta para o glow? ☀️'
      : 'Hora do tratamento noturno ✨'

  const dayLabel = routineData?.routine.name ?? '...'

  if (loadingRoutine) {
    return (
      <div style={styles.centered}>
        <ActiveMascot period={period} showPhotoAlert={false} size={64} />
        <p style={{ color: '#A89D98', marginTop: 12, fontFamily: "'Outfit',sans-serif" }}>
          Carregando rotina...
        </p>
      </div>
    )
  }

  if (!routineData) {
    return (
      <div style={styles.centered}>
        <p style={{ color: '#A89D98', fontFamily: "'Outfit',sans-serif", textAlign: 'center' }}>
          Nenhuma rotina cadastrada para este período.
          <br />Adicione uma em "Produtos".
        </p>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.mascotBounce}>
          <ActiveMascot period={period} showPhotoAlert={showPhotoAlert} size={52} />
        </div>
        <div>
          <div style={styles.greetingSmall}>Olá, Fernanda!</div>
          <div style={styles.greetingBig}>{greeting}</div>
        </div>
      </div>

      {/* Scroll area */}
      <div style={styles.scroll}>

        {/* Alerta foto */}
        {showPhotoAlert && (
          <div style={styles.alertBanner}>
            <span style={{ fontSize: 28 }}>📸</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#D97052' }}>Dia de Foto!</div>
              <div style={{ fontSize: 12, color: '#7A6A64', marginTop: 1 }}>
                Tire sua foto de acompanhamento ({daysSincePhoto} dias sem registro).
              </div>
            </div>
            <span style={{ fontSize: 18, color: '#FF8C61' }}>→</span>
          </div>
        )}

        {/* Sucesso */}
        {allDone && (
          <div style={styles.successBanner}>
            <PesseguinhoManha size={48} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#3D8B2A' }}>Rotina completa! 🎉</div>
              <div style={{ fontSize: 12, color: '#5FAF4E' }}>Sua pele agradece. Bom descanso!</div>
            </div>
          </div>
        )}

        {/* Título + progress */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#2D3436' }}>
            {dayLabel}:{' '}
            <span style={{ color: '#FF8C61' }}>
              {period === 'manha' ? 'Manhã' : 'Noite'}
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <div style={styles.progressTrack}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${(totalChecked / Math.max(todayItems.length, 1)) * 100}%`,
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: '#A89D98', marginTop: 4, textAlign: 'right' }}>
              {totalChecked}/{todayItems.length} produtos
            </div>
          </div>
        </div>

        {/* Lista de produtos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {todayItems.map((item) => {
            const product = item.catalog_products
            if (!product) return null
            const logItem = logItems.find((li) => li.product_id === item.product_id)
            const isChecked = logItem?.checked ?? false

            return (
              <div
                key={item.id}
                onClick={() => handleToggle(item.product_id)}
                style={{
                  ...styles.productCard,
                  background: isChecked ? '#F6FFF3' : 'white',
                  borderColor: isChecked ? '#9DC08B' : '#FFE5D4',
                  borderStyle: item.is_optional ? 'dashed' : 'solid',
                  opacity: item.is_optional ? 0.85 : 1,
                }}
              >
                {/* Ícone */}
                <div style={{
                  ...styles.iconWrap,
                  background: isChecked ? '#EAF7E5' : '#FFF0E8',
                }}>
                  {CATEGORY_ICONS[product.category ?? ''] ?? '🧴'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      ...styles.stepBadge,
                      color: isChecked ? '#5FAF4E' : '#FF8C61',
                      background: isChecked ? '#EAF7E5' : '#FFF0E8',
                    }}>
                      P{item.sort_order}
                    </span>
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: isChecked ? '#5FAF4E' : '#2D3436',
                      textDecoration: isChecked ? 'line-through' : 'none',
                    }}>
                      {product.category}
                    </span>
                    {item.is_optional && (
                      <span style={styles.optionalBadge}>opcional</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#5A4A44', marginTop: 1 }}>
                    {product.name}{' '}
                    <span style={{ fontWeight: 400, color: '#A89D98' }}>({product.brand})</span>
                  </div>
                  {product.function_desc && (
                    <div style={{ fontSize: 11, color: '#A89D98', marginTop: 2 }}>
                      {product.function_desc}
                    </div>
                  )}
                </div>

                {/* Checkbox */}
                <div style={{
                  ...styles.checkCircle,
                  background: isChecked ? '#9DC08B' : 'white',
                  borderColor: isChecked ? '#9DC08B' : '#FFCBAD',
                }}>
                  {isChecked && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Estilos ────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Outfit', sans-serif",
    backgroundColor: '#FFFBF5',
    minHeight: '100vh',
    maxWidth: 390,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
  },
  centered: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '100vh',
  },
  header: {
    padding: '52px 20px 0',
    display: 'flex', alignItems: 'center', gap: 12,
  },
  mascotBounce: {
    animation: 'bounce 2.5s ease-in-out infinite',
  },
  greetingSmall: { fontSize: 13, color: '#A89D98', fontWeight: 400 },
  greetingBig: { fontSize: 17, fontWeight: 700, color: '#2D3436', lineHeight: 1.2 },
  scroll: {
    flex: 1, overflowY: 'auto',
    padding: '16px 20px 100px',
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  alertBanner: {
    background: 'linear-gradient(135deg, #FFF0E8, #FFE2D0)',
    border: '1.5px solid #FFCBAD', borderRadius: 16,
    padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
    cursor: 'pointer',
  },
  successBanner: {
    background: 'linear-gradient(135deg, #EAF7E5, #D5F5CA)',
    border: '1.5px solid #9DC08B', borderRadius: 16,
    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
  },
  progressTrack: {
    height: 6, background: '#FFE5D4', borderRadius: 99, overflow: 'hidden',
  },
  progressFill: {
    height: 6, borderRadius: 99,
    background: 'linear-gradient(90deg, #FF8C61, #FFCBAD)',
    transition: 'width 0.5s ease',
  },
  productCard: {
    border: '1.5px solid', borderRadius: 18,
    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
    cursor: 'pointer', transition: 'all 0.2s ease',
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, flexShrink: 0, transition: 'background 0.2s',
  },
  stepBadge: {
    fontSize: 10, fontWeight: 700, borderRadius: 6, padding: '2px 6px',
    minWidth: 28, textAlign: 'center',
  },
  optionalBadge: {
    fontSize: 10, color: '#A89D98', background: '#F5F0EC',
    borderRadius: 6, padding: '1px 6px',
  },
  checkCircle: {
    width: 26, height: 26, borderRadius: '50%', border: '2px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginLeft: 'auto', transition: 'all 0.2s ease',
  },
}
