// ── Base local de conflitos entre ativos ─────────────────────────────────
// Nível 1: análise offline, sem API, instantânea.
// Cada regra define dois ativos e o tipo de interação entre eles.

export type ConflictSeverity = 'danger' | 'warning' | 'info'

export type ConflictType =
  | 'irritation'      // combinação agride a barreira cutânea
  | 'antagonist'      // um ativo neutraliza o outro
  | 'redundant'       // mesma função, desperdício
  | 'ph_conflict'     // pH incompatível — um inativa o outro
  | 'synergy'         // combinação potencializa os dois (positivo)

export type ActiveConflict = {
  actives: [string, string]       // par de ativos (ordem não importa)
  type: ConflictType
  severity: ConflictSeverity
  title: string
  explanation: string
  recommendation: string
}

// Normaliza nome do ativo para comparação
export function normalizeActive(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9]/g, '')
}

// Base de regras
export const CONFLICT_RULES: ActiveConflict[] = [
  // ── PERIGO: irritação grave ──────────────────────────────────────────
  {
    actives: ['retinal', 'aha'],
    type: 'irritation',
    severity: 'danger',
    title: 'Retinal + AHA — risco de irritação grave',
    explanation: 'Retinal já promove renovação celular acelerada. Combinado com AHA (glicólico, mandélico, lático), a esfoliação se torna excessiva, podendo causar vermelhidão, descamação e comprometer a barreira.',
    recommendation: 'Use em noites alternadas. Nunca na mesma aplicação.',
  },
  {
    actives: ['retinal', 'bha'],
    type: 'irritation',
    severity: 'danger',
    title: 'Retinal + BHA (salicílico) — risco de irritação',
    explanation: 'Salicílico é esfoliante e pode potencializar o efeito irritante do retinal, especialmente em peles sensíveis ou no início do uso.',
    recommendation: 'Separe por noites alternadas ou use salicílico só de manhã.',
  },
  {
    actives: ['retinol', 'aha'],
    type: 'irritation',
    severity: 'danger',
    title: 'Retinol + AHA — risco de irritação',
    explanation: 'Mesma lógica do retinal: retinóides + esfoliantes químicos = esfoliação excessiva.',
    recommendation: 'Alterne os dias de uso.',
  },
  {
    actives: ['retinol', 'bha'],
    type: 'irritation',
    severity: 'danger',
    title: 'Retinol + BHA — risco de irritação',
    explanation: 'Combinação potencialmente irritante para a barreira cutânea.',
    recommendation: 'Separe os dias de uso.',
  },
  {
    actives: ['vitamina c', 'aha'],
    type: 'irritation',
    severity: 'warning',
    title: 'Vitamina C + AHA — pode irritar',
    explanation: 'Ambos são ácidos. Em peles sensíveis, a combinação pode gerar vermelhidão e sensação de queimação.',
    recommendation: 'Vitamina C de manhã, AHA à noite.',
  },
  {
    actives: ['benzóico', 'retinal'],
    type: 'irritation',
    severity: 'danger',
    title: 'Peróxido de benzoíla + Retinal — inativação mútua',
    explanation: 'O peróxido de benzoíla oxida e degrada o retinal, tornando-o ineficaz. Além disso, a combinação é muito irritante.',
    recommendation: 'Use peróxido só de manhã, retinal só à noite.',
  },

  // ── ANTAGONISTAS: um anula o outro ───────────────────────────────────
  {
    actives: ['vitamina c', 'niacinamida'],
    type: 'antagonist',
    severity: 'info',
    title: 'Vitamina C + Niacinamida — debate na literatura',
    explanation: 'Estudos antigos sugeriam que a combinação formava niacina (causa rubor). Pesquisas mais recentes mostram que isso só ocorre em altas temperaturas. Em uso tópico normal, a combinação é segura — mas a vitamina C pode ter eficácia levemente reduzida.',
    recommendation: 'Se usar os dois, aplique vitamina C primeiro, espere absorver, depois a niacinamida. Ou use em períodos diferentes do dia.',
  },
  {
    actives: ['retinal', 'vitamina c'],
    type: 'antagonist',
    severity: 'warning',
    title: 'Retinal + Vitamina C — oxidação do retinal',
    explanation: 'A vitamina C (especialmente ácido ascórbico puro) pode oxidar e degradar o retinal, reduzindo sua eficácia.',
    recommendation: 'Vitamina C de manhã, retinal à noite.',
  },

  // ── CONFLITO DE pH ────────────────────────────────────────────────────
  {
    actives: ['aha', 'niacinamida'],
    type: 'ph_conflict',
    severity: 'warning',
    title: 'AHA + Niacinamida — pH incompatível',
    explanation: 'AHAs precisam de pH baixo (~3-4) para ser eficazes. A niacinamida eleva o pH quando combinada, reduzindo a eficácia do ácido.',
    recommendation: 'Aplique o AHA primeiro, aguarde 20-30 min para o pH normalizar, depois a niacinamida.',
  },
  {
    actives: ['bha', 'niacinamida'],
    type: 'ph_conflict',
    severity: 'warning',
    title: 'BHA + Niacinamida — pH incompatível',
    explanation: 'Mesma questão de pH do AHA: o salicílico precisa de pH baixo para penetrar na pele.',
    recommendation: 'Aplique o BHA primeiro, aguarde 20-30 min, depois a niacinamida.',
  },
  {
    actives: ['vitamina c', 'retinol'],
    type: 'ph_conflict',
    severity: 'warning',
    title: 'Vitamina C + Retinol — faixas de pH opostas',
    explanation: 'Vitamina C eficaz em pH 2.5-3.5; retinol em pH mais neutro. Combinados, um compromete a estabilidade do outro.',
    recommendation: 'Vitamina C de manhã, retinol à noite.',
  },

  // ── REDUNDÂNCIA ───────────────────────────────────────────────────────
  {
    actives: ['retinal', 'retinol'],
    type: 'redundant',
    severity: 'info',
    title: 'Retinal + Retinol — redundância',
    explanation: 'Retinal (retinaldeído) é mais potente que o retinol e está mais próximo da forma ativa (ácido retinoico). Usar os dois ao mesmo tempo é redundante — o retinol não adiciona benefício.',
    recommendation: 'Escolha apenas um. Para maior eficácia, prefira o retinal.',
  },
  {
    actives: ['aha', 'pha'],
    type: 'redundant',
    severity: 'info',
    title: 'AHA + PHA — esfoliação redundante',
    explanation: 'PHAs (gluconolactona, lactobiônica) são AHAs de molécula maior, mais suaves. Usar os dois juntos pode resultar em esfoliação excessiva sem benefício adicional.',
    recommendation: 'Escolha um esfoliante por noite. PHA é mais indicado para peles sensíveis.',
  },
  {
    actives: ['niacinamida', 'niacinamida'],
    type: 'redundant',
    severity: 'info',
    title: 'Niacinamida duplicada',
    explanation: 'Dois produtos com niacinamida na mesma rotina podem ultrapassar a concentração ideal (5-10%), causando vermelhidão ou irritação em peles sensíveis.',
    recommendation: 'Some as concentrações. Se ultrapassar 10%, remova um dos produtos.',
  },

  // ── SINERGIA (positivo) ───────────────────────────────────────────────
  {
    actives: ['niacinamida', 'zinco'],
    type: 'synergy',
    severity: 'info',
    title: 'Niacinamida + Zinco — sinergia anti-oleosidade',
    explanation: 'Combinação clássica para controle de oleosidade e acne. O zinco potencializa o efeito sebostático da niacinamida.',
    recommendation: 'Ótima combinação. Pode usar juntos.',
  },
  {
    actives: ['vitamina c', 'vitamina e'],
    type: 'synergy',
    severity: 'info',
    title: 'Vitamina C + Vitamina E — sinergia antioxidante',
    explanation: 'A vitamina E regenera a vitamina C oxidada, prolongando sua atividade antioxidante. Combinação clássica e bem estudada.',
    recommendation: 'Ótima combinação. Muitos produtos já vêm formulados juntos por esse motivo.',
  },
  {
    actives: ['retinal', 'péptidos'],
    type: 'synergy',
    severity: 'info',
    title: 'Retinal + Peptídeos — sinergia anti-aging',
    explanation: 'Peptídeos de sinalização complementam a ação do retinal na síntese de colágeno, sem competir pelo mesmo mecanismo.',
    recommendation: 'Pode usar juntos. Aplique o retinal antes, peptídeos depois.',
  },
  {
    actives: ['aha', 'vitamina c'],
    type: 'synergy',
    severity: 'info',
    title: 'AHA + Vitamina C (em pH compatível) — sinergia de luminosidade',
    explanation: 'O AHA esfoliia a camada superficial, permitindo melhor penetração da vitamina C. Funciona bem se forem formulados no mesmo pH.',
    recommendation: 'Prefira produtos que já tragam a combinação formulada. Se separados, aplique na mesma sessão com cautela.',
  },
]

// ── Função principal: detecta conflitos dado um array de ativos ──────────
export function detectConflicts(userActives: string[]): ActiveConflict[] {
  const normalized = userActives.map(normalizeActive)
  const found: ActiveConflict[] = []

  for (const rule of CONFLICT_RULES) {
    const [a, b] = rule.actives.map(normalizeActive)
    // n.includes(a): o ativo do usuário contém o nome da regra (ex: "niacinamida10%" contém "niacinamida")
    // Removido a.includes(n) para evitar falsos positivos com strings curtas (ex: "vitamina" acionando "vitaminac")
    const hasA = normalized.some((n) => n.includes(a))
    const hasB = normalized.some((n) => n.includes(b))

    // Para regra de duplicidade (mesmo ativo)
    if (a === b) {
      const count = normalized.filter((n) => n.includes(a)).length
      if (count >= 2) found.push(rule)
      continue
    }

    if (hasA && hasB) found.push(rule)
  }

  // Ordena: danger primeiro, depois warning, depois info
  return found.sort((x, y) => {
    const order = { danger: 0, warning: 1, info: 2 }
    return order[x.severity] - order[y.severity]
  })
}

// ── Ícone e cor por severidade ────────────────────────────────────────────
export const SEVERITY_CONFIG = {
  danger:  { color: '#F28C8C', bg: '#FFF0F0', icon: '🚫', label: 'Evitar' },
  warning: { color: '#FF8C61', bg: '#FFF5F0', icon: '⚠️', label: 'Atenção' },
  info:    { color: '#9DC08B', bg: '#F0FFF4', icon: 'ℹ️', label: 'Info'   },
}

export const TYPE_LABELS: Record<ConflictType, string> = {
  irritation:  'Irritação',
  antagonist:  'Antagonista',
  redundant:   'Redundância',
  ph_conflict: 'Conflito de pH',
  synergy:     'Sinergia ✨',
}
