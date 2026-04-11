import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const C = {
  bg: "#FFFBF5", peach: "#FFCBAD", deepPeach: "#FF8C61",
  green: "#9DC08B", rose: "#F28C8C", text: "#2D3436",
  muted: "#A89D98", card: "#FFFFFF", border: "#FFE5D4",
};

const SUPABASE = "https://pbluwnkettebcfpvumio.supabase.co/storage/v1/object/public/assets";

const AREAS = [
  { id: "rosto",  label: "Rosto",  icon: `${SUPABASE}/icon-rosto.png`  },
  { id: "colo",   label: "Colo",   icon: `${SUPABASE}/icon-colo.png`   },
  { id: "costas", label: "Costas", icon: `${SUPABASE}/icon-costas.png` },
  { id: "cabelo", label: "Cabelo", icon: `${SUPABASE}/icon-cabelo.png`},
  { id: "pernas", label: "Pernas", icon: `${SUPABASE}/icon-pernas.png` },
];

const PRODUCTS = {
  rosto: [
    { step: 1, category: "Limpeza",         name: "Gel de Limpeza Suave", brand: "La Roche-Posay"  },
    { step: 2, category: "Tratamento",       name: "Niacinamide 10%",      brand: "The Ordinary"    },
    { step: 3, category: "Tratamento Forte", name: "Retinal 0.1%",         brand: "Geek & Gorgeous" },
    { step: 4, category: "Hidratação",       name: "Hidratante Calmante",  brand: "Bioderma"        },
  ],
  colo: [
    { step: 1, category: "Tratamento", name: "Sérum Copper Peptides",      brand: "Biossance" },
    { step: 2, category: "Hidratação", name: "Creme Firmador Resveratrol", brand: "Caudalie"  },
    { step: 3, category: "Proteção",   name: "Protetor Solar FPS 50",      brand: "Isdin"     },
  ],
  costas: [
    { step: 1, category: "Limpeza",    name: "Sabonete Antiacne",  brand: "Benzac"     },
    { step: 2, category: "Tratamento", name: "Creme Esfoliante",   brand: "Neutrogena" },
  ],
  cabelo: [
    { step: 1, category: "Limpeza",         name: "Shampoo Baixo Poo", brand: "WNF"    },
    { step: 2, category: "Condicionamento", name: "Máscara Nutritiva", brand: "Skala"  },
    { step: 3, category: "Finalização",     name: "Sérum Capilar",     brand: "Aussie" },
  ],
  pernas: [
    { step: 1, category: "Hidratação", name: "Loção Corporal",      brand: "Nivea" },
    { step: 2, category: "Tratamento", name: "Creme Anti-celulite", brand: "Vichy" },
  ],
};

function ProductList({ areaId }) {
  const [checked, setChecked] = useState({});
  const products = PRODUCTS[areaId] ?? [];
  const total = products.length;
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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

export default function App() {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(AREAS[0].id);
  const [periodo, setPeriodo] = useState(() => {
    const hora = new Date().getHours();
    return hora >= 6 && hora < 18 ? "manha" : "noite";
  });
  const diaSemana = new Date().toLocaleDateString("pt-BR", { weekday: "long" })
    .replace(/^\w/, (c) => c.toUpperCase());
  const current = AREAS.find((a) => a.id === activeTab);

  return (
    <div style={{
      fontFamily: "'Outfit', sans-serif",
      background: C.bg, minHeight: "100vh",
      maxWidth: 430, margin: "0 auto",
      display: "flex", flexDirection: "column",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');`}</style>

      {/* Header com toggle manhã/noite */}
      <div style={{ padding: "52px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5 }}>
            {diaSemana}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>
            Rotina {periodo === "manha" ? "Manhã" : "Noite"}
          </div>
          {/* Toggle manhã/noite */}
          <div style={{
            display: "flex", marginTop: 8,
            background: C.border, borderRadius: 20,
            padding: 3, gap: 2, width: "fit-content",
          }}>
            {["manha", "noite"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                style={{
                  padding: "4px 12px", borderRadius: 16, border: "none",
                  cursor: "pointer", fontSize: 11, fontWeight: 700,
                  background: periodo === p ? C.deepPeach : "transparent",
                  color: periodo === p ? "white" : C.muted,
                  transition: "all 0.2s",
                }}
              >
                {p === "manha" ? "☀️ Manhã" : "🌙 Noite"}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          {/* Mascote muda conforme período */}
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: "white",
            border: `2.5px solid ${C.peach}`, overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(255,203,173,0.4)",
            transition: "all 0.3s ease",
          }}>
            <img
              src={periodo === "manha"
                ? `${SUPABASE}/mascote-manha.png`
                : `${SUPABASE}/mascote-noite.png`
              }
              alt="Pesseguinho"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={(e) => { e.currentTarget.src = `${SUPABASE}/mascote2.png` }}
            />
          </div>
          {/* Botão logout */}
          <button
            onClick={() => signOut()}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 10, color: C.muted, display: "flex",
              alignItems: "center", gap: 3, padding: 0,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sair
          </button>
        </div>
      </div>

      {/* Tabs — 5 áreas centralizadas */}
      <div style={{
        display: "flex", justifyContent: "center",
        gap: 6, padding: "0 16px 16px",
        overflowX: "auto", scrollbarWidth: "none",
      }}>
        {AREAS.map((area) => {
          const isActive = area.id === activeTab;
          return (
            <button
              key={area.id}
              onClick={() => setActiveTab(area.id)}
              style={{
                flexShrink: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 4, padding: "8px 10px", borderRadius: 16,
                border: isActive ? "none" : `1.5px solid ${C.border}`,
                cursor: "pointer", minWidth: 64,
                background: isActive ? C.deepPeach : C.card,
                boxShadow: isActive ? `0 4px 12px ${C.deepPeach}44` : "none",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{
                width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <img
                  src={area.icon}
                  alt={area.label}
                  style={{
                    width: 28, height: 28,
                    objectFit: "contain",
                    filter: isActive ? "brightness(0) invert(1)" : "none",
                    transition: "filter 0.2s",
                  }}
                />
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: isActive ? "white" : C.muted,
                lineHeight: 1,
              }}>
                {area.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Card de conteúdo */}
      <div style={{
        flex: 1, padding: "24px 20px",
        background: "white", borderTopLeftRadius: 32, borderTopRightRadius: 32,
        boxShadow: "0 -8px 24px rgba(0,0,0,0.04)",
      }}>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
