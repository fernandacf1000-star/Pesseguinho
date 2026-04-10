import { useState } from "react";

// ── Configuração de Cores e Estilo ────────────────────────────────────────
const C = {
  bg: "#FFFBF5",
  peach: "#FFCBAD",
  deepPeach: "#FF8C61",
  green: "#9DC08B",
  rose: "#F28C8C",
  text: "#2D3436",
  muted: "#A89D98",
  card: "#FFFFFF",
  border: "#FFE5D4",
};

// ── SVG silhueta de costas ────────────────────────────────────────────────
function IconCostas({ size = 20, color = "#A89D98" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: "all 0.2s ease", display: "block" }}>
      <path d="M6 19V12C6 9 8 7 12 7C16 7 18 9 18 12V19H6Z" fill={color} opacity="0.1" />
      <path d="M6 19V12C6 9 8 7 12 7C16 7 18 9 18 12V19" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 4.5C10 4.5 10 7 12 7C14 7 14 4.5 14 4.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9.5 11C9.5 11 10.5 11.5 11 13" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M14.5 11C14.5 11 13.5 11.5 13 13" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="12" y1="13.5" x2="12" y2="18.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ── SVG silhueta de colo (pescoço/decote) ────────────────────────────────
function IconColo({ size = 20, color = "#A89D98" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: "all 0.2s ease", display: "block" }}>
      <path d="M6 19V12C6 9 8 7 12 7C16 7 18 9 18 12V19H6Z" fill={color} opacity="0.1" />
      <path d="M6 19V12C6 9 8 7 12 7C16 7 18 9 18 12V19" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 4.5C10 4.5 10 7 12 7C14 7 14 4.5 14 4.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7.5 9.5 Q 9.5 11 11.5 10.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M16.5 9.5 Q 14.5 11 12.5 10.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12 12.5 V 16.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ── Ícone de área dinâmico ────────────────────────────────────────────────
function AreaIcon({ area, size = 18, active = false }) {
  const color = active ? "#FFFFFF" : C.muted;
  if (area.id === "costas") return <IconCostas size={size} color={color} />;
  if (area.id === "colo") return <IconColo size={size} color={color} />;
  return (
    <span style={{
      fontSize: size,
      display: "flex", alignItems: "center", justifyContent: "center",
      filter: active ? "none" : "grayscale(100%) opacity(0.6)",
    }}>
      {area.emoji}
    </span>
  );
}

// ── Dados ─────────────────────────────────────────────────────────────────
const AREAS = [
  { id: "rosto",  label: "Rosto",  emoji: "✨",  active: true },
  { id: "colo",   label: "Colo",   emoji: null,  active: true },
  { id: "costas", label: "Costas", emoji: null,  active: true },
  { id: "pernas", label: "Pernas", emoji: "🦵",  active: true },
];

const PRODUCTS = {
  rosto: [
    { step: 1, category: "Limpeza",          name: "Gel de Limpeza Suave", brand: "La Roche-Posay"  },
    { step: 2, category: "Tratamento",        name: "Niacinamide 10%",      brand: "The Ordinary"    },
    { step: 3, category: "Tratamento Forte",  name: "Retinal 0.1%",         brand: "Geek & Gorgeous" },
    { step: 4, category: "Hidratação",        name: "Hidratante Calmante",  brand: "Bioderma"        },
  ],
  colo: [
    { step: 1, category: "Tratamento", name: "Sérum Copper Peptides",     brand: "Biossance" },
    { step: 2, category: "Hidratação", name: "Creme Firmador Resveratrol", brand: "Caudalie"  },
    { step: 3, category: "Proteção",   name: "Protetor Solar FPS 50",      brand: "Isdin"     },
  ],
  pernas: [
    { step: 1, category: "Hidratação", name: "Loção Corporal",      brand: "Nivea" },
    { step: 2, category: "Tratamento", name: "Creme Anti-celulite", brand: "Vichy" },
  ],
  costas: [
    { step: 1, category: "Limpeza",    name: "Sabonete Antiacne", brand: "Benzac"     },
    { step: 2, category: "Tratamento", name: "Creme Esfoliante",  brand: "Neutrogena" },
  ],
  cabelo: [
    { step: 1, category: "Limpeza",         name: "Shampoo Baixo Poo", brand: "WNF"    },
    { step: 2, category: "Condicionamento", name: "Máscara Nutritiva", brand: "Skala"  },
    { step: 3, category: "Finalização",     name: "Sérum Capilar",     brand: "Aussie" },
  ],
};

// ── Lista de produtos com barra de progresso ──────────────────────────────
function ProductList({ areaId }) {
  const [checked, setChecked] = useState({});
  const products = PRODUCTS[areaId] ?? [];
  const total = products.length;
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Barra de progresso */}
      <div style={{ height: 4, background: C.border, borderRadius: 2, marginBottom: 8, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${total > 0 ? (done / total) * 100 : 0}%`,
          background: C.green,
          transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }} />
      </div>

      {products.map((p) => {
        const isChecked = checked[p.step] ?? false;
        return (
          <div
            key={p.step}
            onClick={() => setChecked((prev) => ({ ...prev, [p.step]: !isChecked }))}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              background: C.card,
              border: `1.5px solid ${isChecked ? C.green : C.border}`,
              borderRadius: 16, padding: "12px 16px", cursor: "pointer",
              transition: "all 0.2s ease",
              opacity: isChecked ? 0.7 : 1,
              transform: isChecked ? "scale(0.98)" : "scale(1)",
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: isChecked ? C.green : C.peach,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800,
              color: isChecked ? "white" : C.deepPeach,
            }}>
              {p.step}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 13, fontWeight: 700, color: C.text,
                textDecoration: isChecked ? "line-through" : "none",
                opacity: isChecked ? 0.5 : 1,
              }}>
                {p.category}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>
                {p.brand} · <span style={{ fontWeight: 500 }}>{p.name}</span>
              </div>
            </div>
            <div style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              border: `2px solid ${isChecked ? C.green : C.border}`,
              background: isChecked ? C.green : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {isChecked && (
                <svg width="10" height="10" viewBox="0 0 11 11" fill="none">
                  <path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Layout 1 ──────────────────────────────────────────────────────────────
function Layout1() {
  const activeAreas = AREAS.filter((a) => a.active);
  const [activeTab, setActiveTab] = useState(activeAreas[0].id);
  const current = activeAreas.find((a) => a.id === activeTab);

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: C.bg, height: "100%", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ padding: "20px 20px 15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>
            Terça-feira
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Rotina Noite</div>
        </div>
        {/* Mascote placeholder */}
        <div style={{
          width: 42, height: 42, borderRadius: "50%", background: "white",
          border: `2px solid ${C.peach}`, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        }}>
          🍑
        </div>
      </div>

      {/* Tabs em pílula */}
      <div style={{
        display: "flex", gap: 8, overflowX: "auto", padding: "0 20px 15px",
        flexShrink: 0, scrollbarWidth: "none",
      }}>
        {activeAreas.map((area) => {
          const isActive = area.id === activeTab;
          return (
            <button
              key={area.id}
              onClick={() => setActiveTab(area.id)}
              style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px", borderRadius: 20,
                border: isActive ? "none" : `1px solid ${C.border}`,
                cursor: "pointer",
                background: isActive ? C.deepPeach : "white",
                boxShadow: isActive ? `0 4px 12px ${C.deepPeach}44` : "0 2px 4px rgba(0,0,0,0.02)",
                transition: "all 0.2s ease",
              }}
            >
              <AreaIcon area={area} size={16} active={isActive} />
              <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? "white" : C.text }}>
                {area.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Card elevado com conteúdo */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "24px 20px",
        background: "white", borderTopLeftRadius: 32, borderTopRightRadius: 32,
        boxShadow: "0 -10px 30px rgba(0,0,0,0.03)",
        display: "flex", flexDirection: "column", alignItems: "stretch", boxSizing: "border-box",
      }}>
        <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            background: `${C.peach}44`, color: C.deepPeach,
            padding: "4px 12px", borderRadius: 10, fontSize: 11, fontWeight: 800,
          }}>
            {current.label.toUpperCase()}
          </span>
          <span style={{ fontSize: 11, color: C.muted }}>
            {(PRODUCTS[current.id] ?? []).length} produtos
          </span>
        </div>
        <ProductList areaId={current.id} />
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif", background: "#F0EBE3",
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", padding: "24px 16px", gap: 20,
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>🍑 Pesseguinho</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Skin & Care Tracker</div>
      </div>

      {/* Mockup de celular */}
      <div style={{
        width: 360, height: 640, background: C.card, borderRadius: 40,
        boxShadow: "0 30px 70px rgba(0,0,0,0.2), 0 0 0 12px #2D3436",
        overflow: "hidden", display: "flex", flexDirection: "column", position: "relative",
      }}>
        {/* Status bar */}
        <div style={{
          background: C.bg, padding: "12px 24px 6px", flexShrink: 0,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>9:41</span>
          <div style={{ display: "flex", gap: 6, fontSize: 12 }}>📶 🔋</div>
        </div>

        <div style={{ flex: 1, overflow: "hidden" }}>
          <Layout1 />
        </div>
      </div>
    </div>
  );
}
