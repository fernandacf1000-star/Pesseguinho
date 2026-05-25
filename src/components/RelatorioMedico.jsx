import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── Mapeamento de área canônica ──────────────────────────────────────────────
const AREA_MAP = {
  Rosto: "Rosto",
  Pescoço: "Pescoço e Colo",
  Colo: "Pescoço e Colo",
  Costas: "Corpo",
  Corpo: "Corpo",
  Pés: "Mãos e Unhas",
  Mãos: "Mãos e Unhas",
  Unhas: "Mãos e Unhas",
  Cabelo: "Couro Cabeludo / Cabelo",
  Oral: "Oral / Suplementos",
};

const AREA_ORDER = [
  "Rosto",
  "Pescoço e Colo",
  "Corpo",
  "Couro Cabeludo / Cabelo",
  "Mãos e Unhas",
  "Oral / Suplementos",
  "Outros",
];

const AREA_ICONS = {
  "Rosto": "◉",
  "Pescoço e Colo": "◎",
  "Corpo": "▣",
  "Couro Cabeludo / Cabelo": "◈",
  "Mãos e Unhas": "◇",
  "Oral / Suplementos": "◆",
  "Outros": "○",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const categoriaToTipo = (cat) => {
  if (!cat) return "Outro";
  const c = cat.toLowerCase();
  if (["retinoide", "vitamina c", "clareador", "esfoliante", "peeling", "niacinamida", "peptídeos"].some(k => c.includes(k))) return "Skincare";
  if (["oral"].includes(c)) return "Suplemento / Medicamento";
  if (["limpeza", "hidratante", "protetor solar", "barreira/reparador", "sérum", "creme"].some(k => c.includes(k))) return "Skincare";
  if (["shampoo"].includes(c)) return "Cuidado Capilar";
  return "Skincare";
};

const isAcidoRetinoide = (cat) => {
  if (!cat) return false;
  const c = cat.toLowerCase();
  return ["retinoide", "esfoliante", "peeling", "vitamina c", "clareador", "niacinamida"].some(k => c.includes(k));
};

const isPrescrito = (marca) => {
  if (!marca) return false;
  const m = marca.toLowerCase();
  return ["manipulado", "farmacêutico", "pharmacorum", "stiefel", "differin"].some(k => m.includes(k));
};

const formatPeriodos = (periodos) => {
  if (!periodos || periodos.length === 0) return "—";
  return periodos.map(p => p === "Manha" ? "Manhã" : p).join(" e ");
};

const formatDias = (dias) => {
  if (!dias || dias.length === 0 || dias.includes("Todos")) return "Todos os dias";
  return dias.join(", ");
};

// ── Componente principal ─────────────────────────────────────────────────────
export default function RelatorioMedico({ userId }) {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [obs, setObs] = useState("");
  const [copied, setCopied] = useState(false);
  const [nomeUsuaria, setNomeUsuaria] = useState("Fernanda");
  const [showAllAreas, setShowAllAreas] = useState({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data, error } = await supabase
        .from("produtos_ativos")
        .select("id, nome, marca, categoria, areas, periodos, dias_da_semana, em_uso, descricao_ia, status")
        .eq("user_id", userId)
        .order("nome");
      if (!error && data) setProdutos(data);
      setLoading(false);
    }
    if (userId) fetchData();
  }, [userId]);

  // Agrupa por área canônica
  const grouped = useCallback(() => {
    const map = {};
    AREA_ORDER.forEach(a => { map[a] = []; });

    produtos.forEach(p => {
      const areas = p.areas || [];
      const canonicals = new Set();
      areas.forEach(a => {
        const c = AREA_MAP[a] || "Outros";
        canonicals.add(c);
      });
      canonicals.forEach(c => {
        if (!map[c]) map[c] = [];
        // Evitar duplicatas por produto+área
        if (!map[c].find(x => x.id === p.id)) {
          map[c].push(p);
        }
      });
    });
    return map;
  }, [produtos]);

  const byArea = grouped();

  // Seções de resumo
  const diarios = produtos.filter(p =>
    !p.dias_da_semana || p.dias_da_semana.length === 0 || p.dias_da_semana.includes("Todos")
  );
  const prescritos = produtos.filter(p => isPrescrito(p.marca));
  const acidos = produtos.filter(p => isAcidoRetinoide(p.categoria));
  const naoEmUso = produtos.filter(p => !p.em_uso);

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric"
  });

  // Gera texto puro do relatório
  const gerarTexto = () => {
    let txt = "";
    txt += `RELATÓRIO DE PRODUTOS E TRATAMENTOS DERMATOLÓGICOS\n`;
    txt += `${"─".repeat(52)}\n`;
    txt += `Paciente: ${nomeUsuaria}\n`;
    txt += `Data: ${today}\n`;
    if (obs) txt += `Observações gerais: ${obs}\n`;
    txt += `\n`;

    AREA_ORDER.forEach(area => {
      const items = byArea[area];
      if (!items || items.length === 0) return;
      txt += `\n${area.toUpperCase()}\n${"─".repeat(area.length)}\n`;
      items.forEach(p => {
        txt += `\n• ${p.nome}${p.marca ? ` (${p.marca})` : ""}\n`;
        txt += `  Categoria: ${p.categoria || "—"}\n`;
        txt += `  Horário: ${formatPeriodos(p.periodos)}\n`;
        txt += `  Frequência: ${formatDias(p.dias_da_semana)}\n`;
        if (p.descricao_ia) txt += `  Obs: ${p.descricao_ia}\n`;
      });
    });

    txt += `\n\nRESUMO\n${"─".repeat(6)}\n`;
    txt += `\nProdutos de uso diário (${diarios.length}):\n`;
    diarios.forEach(p => { txt += `  • ${p.nome}\n`; });

    txt += `\nPrescritos / manipulados (${prescritos.length}):\n`;
    prescritos.forEach(p => { txt += `  • ${p.nome} — ${p.marca}\n`; });

    txt += `\nÁcidos, retinoides e ativos (${acidos.length}):\n`;
    acidos.forEach(p => { txt += `  • ${p.nome} (${p.categoria})\n`; });

    txt += `\nProdutos suspensos / não em uso (${naoEmUso.length}):\n`;
    naoEmUso.forEach(p => { txt += `  • ${p.nome}\n`; });

    return txt;
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(gerarTexto()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleWhatsApp = () => {
    const txt = encodeURIComponent(gerarTexto());
    window.open(`https://wa.me/?text=${txt}`, "_blank");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Relatório Dermatológico — ${nomeUsuaria} — ${today}`);
    const body = encodeURIComponent(gerarTexto());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handlePDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={styles.loadingWrapper}>
        <div style={styles.loadingDot} />
        <span style={styles.loadingText}>Carregando produtos…</span>
      </div>
    );
  }

  return (
    <div style={styles.page} className="relatorio-medico-print">
      <style>{printCSS}</style>

      {/* Header ─────────────────────────────────── */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerLabel}>RELATÓRIO MÉDICO</div>
          <h1 style={styles.headerTitle}>Produtos & Tratamentos</h1>
          <div style={styles.headerMeta}>
            <span style={styles.metaItem}>
              <span style={styles.metaLabel}>PACIENTE</span>
              <input
                style={styles.nomeInput}
                value={nomeUsuaria}
                onChange={e => setNomeUsuaria(e.target.value)}
                placeholder="Nome da paciente"
              />
            </span>
            <span style={styles.metaDivider}>·</span>
            <span style={styles.metaItem}>
              <span style={styles.metaLabel}>DATA</span>
              <span style={styles.metaValue}>{today}</span>
            </span>
            <span style={styles.metaDivider}>·</span>
            <span style={styles.metaItem}>
              <span style={styles.metaLabel}>TOTAL</span>
              <span style={styles.metaValue}>{produtos.length} itens</span>
            </span>
          </div>
        </div>
        <div style={styles.headerBadge}>
          <span style={styles.badgeNumber}>{produtos.filter(p => p.em_uso).length}</span>
          <span style={styles.badgeLabel}>em uso</span>
        </div>
      </div>

      {/* Observações gerais ─────────────────────── */}
      <div style={styles.obsSection}>
        <label style={styles.obsLabel}>Observações gerais para o médico (opcional)</label>
        <textarea
          style={styles.obsTextarea}
          value={obs}
          onChange={e => setObs(e.target.value)}
          placeholder="Ex.: Histórico de melasma, pele sensível, reações a corticoides..."
          rows={3}
        />
      </div>

      {/* Botões de exportação ───────────────────── */}
      <div style={styles.actionsBar}>
        <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleCopiar}>
          {copied ? "✓ Copiado" : "Copiar relatório"}
        </button>
        <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={handlePDF}>
          Gerar PDF
        </button>
        <button style={{ ...styles.btn, ...styles.btnWhatsApp }} onClick={handleWhatsApp}>
          WhatsApp
        </button>
        <button style={{ ...styles.btn, ...styles.btnEmail }} onClick={handleEmail}>
          Enviar por e-mail
        </button>
      </div>

      {/* Cards por área ─────────────────────────── */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Por Área do Corpo</h2>
        {AREA_ORDER.map(area => {
          const items = byArea[area];
          if (!items || items.length === 0) return null;
          const showAll = showAllAreas[area];
          const visible = showAll ? items : items.slice(0, 6);
          return (
            <div key={area} style={styles.areaCard}>
              <div style={styles.areaHeader}>
                <span style={styles.areaIcon}>{AREA_ICONS[area] || "○"}</span>
                <h3 style={styles.areaTitle}>{area}</h3>
                <span style={styles.areaBadge}>{items.length}</span>
              </div>
              <div style={styles.produtosGrid}>
                {visible.map(p => (
                  <ProdutoCard key={p.id + area} produto={p} />
                ))}
              </div>
              {items.length > 6 && (
                <button
                  style={styles.showMore}
                  onClick={() => setShowAllAreas(prev => ({ ...prev, [area]: !prev[area] }))}
                >
                  {showAll ? "Mostrar menos" : `Ver mais ${items.length - 6} itens`}
                </button>
              )}
            </div>
          );
        })}
      </section>

      {/* Resumo automático ─────────────────────── */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Resumo Automático</h2>
        <div style={styles.resumoGrid}>
          <ResumoCard
            titulo="Uso Diário"
            cor="#1a5276"
            items={diarios}
            empty="Nenhum"
          />
          <ResumoCard
            titulo="Prescritos / Manipulados"
            cor="#1e8449"
            items={prescritos}
            empty="Nenhum"
          />
          <ResumoCard
            titulo="Ácidos, Retinoides e Ativos"
            cor="#7d6608"
            items={acidos}
            empty="Nenhum"
          />
          <ResumoCard
            titulo="Suspensos / Não em uso"
            cor="#922b21"
            items={naoEmUso}
            empty="Nenhum"
          />
        </div>
      </section>

      {/* Rodapé ─────────────────────────────────── */}
      <div style={styles.footer}>
        Gerado via Pesseguinho · {today}
      </div>
    </div>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function ProdutoCard({ produto: p }) {
  const prescrito = isPrescrito(p.marca);
  const ativo = isAcidoRetinoide(p.categoria);

  return (
    <div style={{
      ...styles.prodCard,
      opacity: p.em_uso ? 1 : 0.55,
      borderLeft: prescrito
        ? "3px solid #1e8449"
        : ativo
        ? "3px solid #b7950b"
        : "3px solid #cbd5e0",
    }}>
      <div style={styles.prodHeader}>
        <span style={styles.prodNome}>{p.nome}</span>
        {!p.em_uso && <span style={styles.tagSuspenso}>suspenso</span>}
        {prescrito && <span style={styles.tagPrescrito}>Rx</span>}
      </div>
      {p.marca && <div style={styles.prodMarca}>{p.marca}</div>}
      <div style={styles.prodDetails}>
        <Detail label="Categoria" value={p.categoria || "—"} />
        <Detail label="Horário" value={formatPeriodos(p.periodos)} />
        <Detail label="Frequência" value={formatDias(p.dias_da_semana)} />
      </div>
      {p.descricao_ia && (
        <div style={styles.prodObs}>{p.descricao_ia}</div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div style={styles.detail}>
      <span style={styles.detailLabel}>{label}:</span>
      <span style={styles.detailValue}>{value}</span>
    </div>
  );
}

function ResumoCard({ titulo, cor, items, empty }) {
  return (
    <div style={{ ...styles.resumoCard, borderTop: `3px solid ${cor}` }}>
      <div style={{ ...styles.resumoTitulo, color: cor }}>{titulo}</div>
      <div style={styles.resumoCount}>{items.length}</div>
      {items.length === 0 ? (
        <div style={styles.resumoEmpty}>{empty}</div>
      ) : (
        <ul style={styles.resumoList}>
          {items.map(p => (
            <li key={p.id} style={styles.resumoItem}>
              <span style={styles.resumoDot} />
              <span>{p.nome}{p.marca ? ` · ${p.marca}` : ""}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────
const BASE_FONT = "'Georgia', 'Times New Roman', serif";
const SANS = "'Helvetica Neue', 'Arial', sans-serif";
const BORDER = "#dde3eb";
const BG = "#f8f9fb";

const styles = {
  page: {
    fontFamily: SANS,
    background: BG,
    minHeight: "100vh",
    padding: "0 0 60px 0",
    color: "#1a202c",
  },
  loadingWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 200,
    color: "#718096",
    fontFamily: SANS,
    fontSize: 14,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#4a5568",
    animation: "pulse 1s infinite",
  },
  loadingText: { fontSize: 14, letterSpacing: "0.05em" },

  // Header
  header: {
    background: "#fff",
    borderBottom: `1px solid ${BORDER}`,
    padding: "32px 36px 28px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerLeft: { flex: 1 },
  headerLabel: {
    fontSize: 10,
    letterSpacing: "0.18em",
    color: "#718096",
    fontFamily: SANS,
    fontWeight: 600,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontFamily: BASE_FONT,
    fontSize: 28,
    fontWeight: 400,
    color: "#1a202c",
    margin: "0 0 16px 0",
    letterSpacing: "-0.01em",
  },
  headerMeta: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#a0aec0",
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 13,
    color: "#2d3748",
  },
  metaDivider: {
    color: "#cbd5e0",
    fontSize: 16,
  },
  nomeInput: {
    border: "none",
    borderBottom: "1px solid #cbd5e0",
    background: "transparent",
    fontSize: 13,
    color: "#2d3748",
    fontFamily: SANS,
    padding: "2px 4px",
    outline: "none",
    width: 180,
  },
  headerBadge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "#1a202c",
    color: "#fff",
    borderRadius: 8,
    padding: "14px 20px",
    minWidth: 70,
  },
  badgeNumber: {
    fontSize: 28,
    fontWeight: 700,
    fontFamily: BASE_FONT,
    lineHeight: 1,
  },
  badgeLabel: {
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#a0aec0",
    marginTop: 4,
  },

  // Obs
  obsSection: {
    background: "#fff",
    borderBottom: `1px solid ${BORDER}`,
    padding: "20px 36px",
  },
  obsLabel: {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#a0aec0",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  obsTextarea: {
    width: "100%",
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    padding: "10px 14px",
    fontSize: 13,
    color: "#2d3748",
    fontFamily: SANS,
    resize: "vertical",
    outline: "none",
    background: "#fafbfc",
    boxSizing: "border-box",
    lineHeight: 1.6,
  },

  // Actions
  actionsBar: {
    display: "flex",
    gap: 10,
    padding: "16px 36px",
    background: "#fff",
    borderBottom: `1px solid ${BORDER}`,
    flexWrap: "wrap",
  },
  btn: {
    padding: "9px 18px",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.05em",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontFamily: SANS,
    transition: "opacity 0.15s",
  },
  btnPrimary: {
    background: "#1a202c",
    color: "#fff",
  },
  btnSecondary: {
    background: "#edf2f7",
    color: "#2d3748",
    border: `1px solid ${BORDER}`,
  },
  btnWhatsApp: {
    background: "#25d366",
    color: "#fff",
  },
  btnEmail: {
    background: "#e8f0fe",
    color: "#1a56db",
    border: "1px solid #c3d3fc",
  },

  // Sections
  section: {
    padding: "32px 36px 0",
  },
  sectionTitle: {
    fontFamily: BASE_FONT,
    fontSize: 18,
    fontWeight: 400,
    color: "#2d3748",
    margin: "0 0 20px 0",
    paddingBottom: 10,
    borderBottom: `1px solid ${BORDER}`,
    letterSpacing: "-0.01em",
  },

  // Area card
  areaCard: {
    background: "#fff",
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    marginBottom: 20,
    overflow: "hidden",
  },
  areaHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "14px 20px",
    borderBottom: `1px solid ${BORDER}`,
    background: "#fafbfc",
  },
  areaIcon: {
    fontSize: 14,
    color: "#718096",
  },
  areaTitle: {
    fontFamily: SANS,
    fontSize: 13,
    fontWeight: 700,
    color: "#2d3748",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    margin: 0,
    flex: 1,
  },
  areaBadge: {
    background: "#edf2f7",
    color: "#4a5568",
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 20,
    padding: "2px 10px",
  },

  // Produtos grid
  produtosGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
    gap: 1,
    background: BORDER,
  },
  prodCard: {
    background: "#fff",
    padding: "16px 18px",
    borderLeft: `3px solid ${BORDER}`,
  },
  prodHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  prodNome: {
    fontSize: 13,
    fontWeight: 600,
    color: "#1a202c",
    flex: 1,
    lineHeight: 1.3,
  },
  prodMarca: {
    fontSize: 11,
    color: "#718096",
    marginBottom: 10,
    fontStyle: "italic",
  },
  tagSuspenso: {
    fontSize: 9,
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: 3,
    padding: "2px 6px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  tagPrescrito: {
    fontSize: 9,
    background: "#d1fae5",
    color: "#065f46",
    borderRadius: 3,
    padding: "2px 6px",
    fontWeight: 700,
    letterSpacing: "0.06em",
  },
  prodDetails: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    marginBottom: 8,
  },
  detail: {
    display: "flex",
    gap: 6,
    fontSize: 11,
    lineHeight: 1.4,
  },
  detailLabel: {
    color: "#a0aec0",
    fontWeight: 600,
    minWidth: 70,
  },
  detailValue: {
    color: "#2d3748",
  },
  prodObs: {
    fontSize: 11,
    color: "#4a5568",
    background: "#f7f8fa",
    borderRadius: 4,
    padding: "6px 10px",
    lineHeight: 1.5,
    fontStyle: "italic",
    borderLeft: "2px solid #cbd5e0",
  },
  showMore: {
    display: "block",
    width: "100%",
    padding: "10px",
    textAlign: "center",
    fontSize: 11,
    color: "#718096",
    background: "#fafbfc",
    border: "none",
    borderTop: `1px solid ${BORDER}`,
    cursor: "pointer",
    letterSpacing: "0.05em",
    fontFamily: SANS,
  },

  // Resumo
  resumoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 16,
    marginBottom: 32,
  },
  resumoCard: {
    background: "#fff",
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    padding: "16px 18px",
    borderTop: "3px solid #cbd5e0",
  },
  resumoTitulo: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  resumoCount: {
    fontSize: 28,
    fontWeight: 700,
    fontFamily: BASE_FONT,
    color: "#1a202c",
    lineHeight: 1,
    marginBottom: 12,
  },
  resumoEmpty: {
    fontSize: 12,
    color: "#a0aec0",
    fontStyle: "italic",
  },
  resumoList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },
  resumoItem: {
    fontSize: 11,
    color: "#2d3748",
    display: "flex",
    alignItems: "flex-start",
    gap: 7,
    lineHeight: 1.4,
  },
  resumoDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "#a0aec0",
    marginTop: 4,
    flexShrink: 0,
  },

  // Footer
  footer: {
    textAlign: "center",
    padding: "40px 36px 20px",
    fontSize: 11,
    color: "#a0aec0",
    letterSpacing: "0.06em",
  },
};

// ── CSS de impressão ─────────────────────────────────────────────────────────
const printCSS = `
@media print {
  body * { visibility: hidden !important; }
  .relatorio-medico-print,
  .relatorio-medico-print * { visibility: visible !important; }
  .relatorio-medico-print { position: absolute; left: 0; top: 0; width: 100%; }
  button, textarea { display: none !important; }
  input { border: none !important; }
  .relatorio-medico-print { background: #fff !important; }
}
`;
