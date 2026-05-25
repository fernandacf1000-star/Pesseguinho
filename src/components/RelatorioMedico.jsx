import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
];

const isDermatologico = (cat) => {
  if (!cat) return false;
  const c = cat.toLowerCase();
  return ["skincare", "limpeza", "hidratante", "protetor", "vitamina c", "retinoide", "esfoliante", "peeling", "clareador", "sérum", "creme", "niacinamida", "peptídeos", "barreira", "óleo", "labial", "shampoo"].some(k => c.includes(k));
};

const isUsoContinuo = (dias) => {
  if (!dias) return false;
  return dias.length === 0 || dias.includes("Todos");
};

const formatPeriodos = (periodos) => {
  if (!periodos || periodos.length === 0) return "—";
  return periodos.map(p => p === "Manha" ? "Manhã" : p).join(" e ");
};

const formatDias = (dias) => {
  if (!dias || dias.length === 0 || dias.includes("Todos")) return "Todos os dias";
  return dias.join(", ");
};

export default function RelatorioMedico({ userId }) {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nomeUsuaria, setNomeUsuaria] = useState("Fernanda");
  const [obs, setObs] = useState("");
  const [copied, setCopied] = useState(false);

  // Filtros
  const [mostraDermatologico, setMostraDermatologico] = useState(true);
  const [mostraUsoContinuo, setMostraUsoContinuo] = useState(false);

  // Seleção de items
  const [selecionados, setSelecionados] = useState({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data, error } = await supabase
        .from("produtos_ativos")
        .select("id, nome, marca, categoria, areas, periodos, dias_da_semana, em_uso, descricao_ia, status")
        .eq("user_id", userId)
        .order("nome");
      if (!error && data) {
        setProdutos(data);
        // Pre-seleciona todos os items
        const inicial = {};
        data.forEach(p => { inicial[p.id] = true; });
        setSelecionados(inicial);
      }
      setLoading(false);
    }
    if (userId) fetchData();
  }, [userId]);

  const grouped = useCallback(() => {
    const map = {};
    AREA_ORDER.forEach(a => { map[a] = []; });

    let filtered = produtos;

    // Aplicar filtros
    if (mostraDermatologico || mostraUsoContinuo) {
      filtered = produtos.filter(p => {
        const ehDerma = isDermatologico(p.categoria);
        const ehContinuo = isUsoContinuo(p.dias_da_semana);

        if (mostraDermatologico && mostraUsoContinuo) {
          return ehDerma || ehContinuo;
        } else if (mostraDermatologico) {
          return ehDerma;
        } else if (mostraUsoContinuo) {
          return ehContinuo;
        }
        return true;
      });
    }

    filtered.forEach(p => {
      const areas = p.areas || [];
      const canonicals = new Set();
      areas.forEach(a => {
        const c = AREA_MAP[a] || "Outros";
        canonicals.add(c);
      });
      canonicals.forEach(c => {
        if (!map[c]) map[c] = [];
        if (!map[c].find(x => x.id === p.id)) {
          map[c].push(p);
        }
      });
    });
    return map;
  }, [produtos, mostraDermatologico, mostraUsoContinuo]);

  const byArea = grouped();

  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric"
  });

  const gerarTexto = () => {
    let txt = "";
    txt += `RELATÓRIO DE PRODUTOS E TRATAMENTOS\n`;
    txt += `${"─".repeat(52)}\n`;
    txt += `Paciente: ${nomeUsuaria}\n`;
    txt += `Data: ${today}\n`;
    if (obs) txt += `Observações: ${obs}\n`;
    txt += `\n`;

    AREA_ORDER.forEach(area => {
      const items = byArea[area];
      if (!items || items.length === 0) return;
      const selecionadosArea = items.filter(p => selecionados[p.id]);
      if (selecionadosArea.length === 0) return;

      txt += `\n${area.toUpperCase()}\n${"─".repeat(area.length)}\n`;
      selecionadosArea.forEach(p => {
        txt += `\n• ${p.nome}${p.marca ? ` (${p.marca})` : ""}\n`;
        txt += `  Categoria: ${p.categoria || "—"}\n`;
        txt += `  Horário: ${formatPeriodos(p.periodos)}\n`;
        txt += `  Frequência: ${formatDias(p.dias_da_semana)}\n`;
        if (p.descricao_ia) txt += `  Obs: ${p.descricao_ia}\n`;
      });
    });

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
    const subject = encodeURIComponent(`Relatório de Medicações — ${nomeUsuaria}`);
    const body = encodeURIComponent(gerarTexto());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (loading) {
    return (
      <div style={styles.loadingWrapper}>
        <div style={styles.loadingDot} />
        <span>Carregando…</span>
      </div>
    );
  }

  const totalSelecionados = Object.values(selecionados).filter(Boolean).length;

  return (
    <div style={styles.page} className="relatorio-medico-print">
      <style>{printCSS}</style>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>Relatório Médico</h1>
          <div style={styles.headerMeta}>
            <span style={styles.metaItem}>
              <span style={styles.metaLabel}>Paciente</span>
              <input
                style={styles.nomeInput}
                value={nomeUsuaria}
                onChange={e => setNomeUsuaria(e.target.value)}
                placeholder="Nome"
              />
            </span>
            <span style={styles.metaDivider}>·</span>
            <span style={styles.metaValue}>{today}</span>
          </div>
        </div>
        <div style={styles.headerBadge}>{totalSelecionados}</div>
      </div>

      {/* Filtros */}
      <div style={styles.filtrosSection}>
        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={mostraDermatologico}
            onChange={e => setMostraDermatologico(e.target.checked)}
          />
          <span>🧴 Remédios Dermatológicos</span>
        </label>
        <label style={styles.checkbox}>
          <input
            type="checkbox"
            checked={mostraUsoContinuo}
            onChange={e => setMostraUsoContinuo(e.target.checked)}
          />
          <span>💊 Uso Contínuo (Orais)</span>
        </label>
      </div>

      {/* Observações */}
      <div style={styles.obsSection}>
        <label style={styles.obsLabel}>Observações para o médico</label>
        <textarea
          style={styles.obsTextarea}
          value={obs}
          onChange={e => setObs(e.target.value)}
          placeholder="Ex.: Histórico de reações, medicações recentes..."
          rows={2}
        />
      </div>

      {/* Botões de exportação */}
      <div style={styles.actionsBar}>
        <button style={{ ...styles.btn, ...styles.btnPrimary }} onClick={handleCopiar}>
          {copied ? "✓ Copiado" : "Copiar"}
        </button>
        <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={() => window.print()}>
          PDF
        </button>
        <button style={{ ...styles.btn, ...styles.btnWhatsApp }} onClick={handleWhatsApp}>
          WhatsApp
        </button>
        <button style={{ ...styles.btn, ...styles.btnEmail }} onClick={handleEmail}>
          E-mail
        </button>
      </div>

      {/* Items com checkboxes */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Selecionar Itens</h2>
        {AREA_ORDER.map(area => {
          const items = byArea[area];
          if (!items || items.length === 0) return null;
          return (
            <div key={area} style={styles.areaGroup}>
              <h3 style={styles.areaTitle}>{area}</h3>
              <div style={styles.itemsList}>
                {items.map(p => (
                  <label key={p.id} style={styles.itemCheckbox}>
                    <input
                      type="checkbox"
                      checked={selecionados[p.id] ?? false}
                      onChange={e => setSelecionados(prev => ({ ...prev, [p.id]: e.target.checked }))}
                    />
                    <div style={styles.itemInfo}>
                      <span style={styles.itemNome}>{p.nome}</span>
                      {p.marca && <span style={styles.itemMarca}>{p.marca}</span>}
                      <span style={styles.itemCategoria}>{p.categoria}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Rodapé */}
      <div style={styles.footer}>
        Gerado via Pesseguinho · {today}
      </div>
    </div>
  );
}

const SANS = "'Helvetica Neue', 'Arial', sans-serif";
const BORDER = "#dde3eb";
const BG = "#f8f9fb";

const styles = {
  page: {
    fontFamily: SANS,
    background: BG,
    minHeight: "100vh",
    padding: "0 0 40px 0",
    color: "#1a202c",
  },
  loadingWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    height: 200,
    color: "#718096",
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "#4a5568",
    animation: "pulse 1s infinite",
  },

  header: {
    background: "#fff",
    borderBottom: `1px solid ${BORDER}`,
    padding: "24px 20px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1a202c",
    margin: "0 0 12px 0",
  },
  headerMeta: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#a0aec0",
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 13,
    color: "#2d3748",
  },
  metaDivider: {
    color: "#cbd5e0",
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
    width: 140,
  },
  headerBadge: {
    fontSize: 20,
    fontWeight: 700,
    color: "#FF8C61",
  },

  filtrosSection: {
    background: "#fff",
    borderBottom: `1px solid ${BORDER}`,
    padding: "16px 20px",
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    color: "#2d3748",
  },

  obsSection: {
    background: "#fff",
    borderBottom: `1px solid ${BORDER}`,
    padding: "16px 20px",
  },
  obsLabel: {
    display: "block",
    fontSize: 10,
    fontWeight: 700,
    color: "#a0aec0",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  obsTextarea: {
    width: "100%",
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    padding: "10px 12px",
    fontSize: 12,
    color: "#2d3748",
    fontFamily: SANS,
    outline: "none",
    background: "#fafbfc",
    boxSizing: "border-box",
    resize: "vertical",
  },

  actionsBar: {
    display: "flex",
    gap: 8,
    padding: "12px 20px",
    background: "#fff",
    borderBottom: `1px solid ${BORDER}`,
    flexWrap: "wrap",
  },
  btn: {
    padding: "8px 14px",
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontFamily: SANS,
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
  },

  section: {
    padding: "24px 20px",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#2d3748",
    margin: "0 0 16px 0",
    paddingBottom: 12,
    borderBottom: `1px solid ${BORDER}`,
  },

  areaGroup: {
    marginBottom: 20,
    background: "#fff",
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    padding: "14px 16px",
  },
  areaTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#FF8C61",
    margin: "0 0 12px 0",
    textTransform: "uppercase",
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  itemCheckbox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    cursor: "pointer",
    padding: "8px",
    borderRadius: 6,
  },
  itemInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    flex: 1,
  },
  itemNome: {
    fontSize: 12,
    fontWeight: 600,
    color: "#2d3748",
  },
  itemMarca: {
    fontSize: 10,
    color: "#718096",
    fontStyle: "italic",
  },
  itemCategoria: {
    fontSize: 10,
    color: "#a0aec0",
  },

  footer: {
    textAlign: "center",
    padding: "20px 20px",
    fontSize: 10,
    color: "#a0aec0",
  },
};

const printCSS = `
@media print {
  body * { visibility: hidden !important; }
  .relatorio-medico-print,
  .relatorio-medico-print * { visibility: visible !important; }
  .relatorio-medico-print { position: absolute; left: 0; top: 0; width: 100%; }
  input, textarea, button { display: none !important; }
}
`;
