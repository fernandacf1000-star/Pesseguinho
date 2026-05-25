import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const C = {
  bg: '#FFFBF5', peach: '#FFCBAD', deepPeach: '#FF8C61',
  green: '#9DC08B', rose: '#F28C8C', text: '#2D3436',
  muted: '#A89D98', card: '#FFFFFF', border: '#FFE5D4',
};

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

  const [mostraDermatologico, setMostraDermatologico] = useState(true);
  const [mostraUsoContinuo, setMostraUsoContinuo] = useState(false);

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
    txt += `RELATÓRIO DE MEDICAÇÕES E PRODUTOS\n`;
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: C.muted, fontFamily: "'Outfit', sans-serif" }}>
        Carregando…
      </div>
    );
  }

  const totalSelecionados = Object.values(selecionados).filter(Boolean).length;

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: C.bg, minHeight: '100vh', maxWidth: 430, margin: '0 auto', paddingBottom: '90px' }} className="relatorio-medico-print">
      <style>{printCSS}</style>

      {/* Header */}
      <div style={{ padding: '20px', background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0, marginBottom: 8 }}>Relatório Médico</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', display: 'block' }}>Paciente</span>
                <input
                  style={{ border: 'none', borderBottom: `1px solid ${C.border}`, background: 'transparent', fontSize: 12, color: C.text, fontFamily: 'inherit', padding: '4px 0', outline: 'none', width: 120 }}
                  value={nomeUsuaria}
                  onChange={e => setNomeUsuaria(e.target.value)}
                  placeholder="Nome"
                />
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>{today}</div>
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.deepPeach }}>{totalSelecionados}</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ padding: '16px 20px', background: C.card, borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: C.text }}>
          <input
            type="checkbox"
            checked={mostraDermatologico}
            onChange={e => setMostraDermatologico(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <span>🧴 Dermatológicos</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: C.text }}>
          <input
            type="checkbox"
            checked={mostraUsoContinuo}
            onChange={e => setMostraUsoContinuo(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <span>💊 Uso Contínuo</span>
        </label>
      </div>

      {/* Observações */}
      <div style={{ padding: '16px 20px', background: C.card, borderBottom: `1px solid ${C.border}` }}>
        <label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>Observações</label>
        <textarea
          style={{ width: '100%', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 12, color: C.text, fontFamily: 'inherit', outline: 'none', background: 'white', boxSizing: 'border-box', resize: 'vertical' }}
          value={obs}
          onChange={e => setObs(e.target.value)}
          placeholder="Ex.: Histórico de reações..."
          rows={2}
        />
      </div>

      {/* Botões */}
      <div style={{ padding: '12px 20px', background: C.card, borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={handleCopiar} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', background: C.deepPeach, color: 'white', fontFamily: 'inherit' }}>
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
        <button onClick={() => window.print()} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', background: C.border, color: C.text, fontFamily: 'inherit' }}>
          PDF
        </button>
        <button onClick={handleWhatsApp} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#25d366', color: 'white', fontFamily: 'inherit' }}>
          WhatsApp
        </button>
        <button onClick={handleEmail} style={{ padding: '8px 14px', fontSize: 11, fontWeight: 600, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#e8f0fe', color: '#1a56db', fontFamily: 'inherit' }}>
          E-mail
        </button>
      </div>

      {/* Items */}
      <div style={{ padding: '20px' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 16px 0', paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>Selecionar Itens</h2>
        {AREA_ORDER.map(area => {
          const items = byArea[area];
          if (!items || items.length === 0) return null;
          return (
            <div key={area} style={{ marginBottom: 18, background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '12px 16px' }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: C.deepPeach, margin: '0 0 12px 0', textTransform: 'uppercase' }}>{area}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '8px', borderRadius: 6 }}>
                    <input
                      type="checkbox"
                      checked={selecionados[p.id] ?? false}
                      onChange={e => setSelecionados(prev => ({ ...prev, [p.id]: e.target.checked }))}
                      style={{ width: 16, height: 16, cursor: 'pointer', marginTop: 2, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{p.nome}</div>
                      {p.marca && <div style={{ fontSize: 10, color: C.muted, fontStyle: 'italic' }}>{p.marca}</div>}
                      <div style={{ fontSize: 10, color: C.muted }}>{p.categoria}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px', fontSize: 10, color: C.muted }}>
        Gerado via Pesseguinho
      </div>
    </div>
  );
}

const printCSS = `
@media print {
  body * { visibility: hidden !important; }
  .relatorio-medico-print,
  .relatorio-medico-print * { visibility: visible !important; }
  .relatorio-medico-print { position: absolute; left: 0; top: 0; width: 100%; }
  input, textarea, button { display: none !important; }
}
`;
