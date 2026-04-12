type MascotProps = { size?: number }

export function PesseguinhoStandard({ size = 56 }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <ellipse cx="28" cy="32" rx="18" ry="19" fill="#FFCBAD" />
      <ellipse cx="22" cy="31" rx="8" ry="9" fill="#FFB899" opacity="0.5" />
      <ellipse cx="28" cy="13" rx="3" ry="6" fill="#9DC08B" transform="rotate(-15 28 13)" />
      <line x1="28" y1="14" x2="28" y2="20" stroke="#7AAD6A" strokeWidth="1.5" />
      <circle cx="22" cy="30" r="3.5" fill="white" />
      <circle cx="34" cy="30" r="3.5" fill="white" />
      <circle cx="22.8" cy="30.5" r="1.8" fill="#2D3436" />
      <circle cx="34.8" cy="30.5" r="1.8" fill="#2D3436" />
      <circle cx="23.4" cy="29.9" r="0.6" fill="white" />
      <circle cx="35.4" cy="29.9" r="0.6" fill="white" />
      <circle cx="22" cy="30" r="4.5" stroke="#2D3436" strokeWidth="1.5" fill="none" />
      <circle cx="34" cy="30" r="4.5" stroke="#2D3436" strokeWidth="1.5" fill="none" />
      <line x1="26.5" y1="30" x2="29.5" y2="30" stroke="#2D3436" strokeWidth="1.5" />
      <line x1="17.5" y1="29.5" x2="15" y2="28" stroke="#2D3436" strokeWidth="1.5" />
      <line x1="38.5" y1="29.5" x2="41" y2="28" stroke="#2D3436" strokeWidth="1.5" />
      <ellipse cx="17" cy="34" rx="3" ry="2" fill="#FF8C61" opacity="0.35" />
      <ellipse cx="39" cy="34" rx="3" ry="2" fill="#FF8C61" opacity="0.35" />
      <path d="M23 36 Q28 39.5 33 36" stroke="#2D3436" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function PesseguinhoManha({ size = 56 }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <ellipse cx="28" cy="32" rx="18" ry="19" fill="#FFD9A0" />
      <ellipse cx="22" cy="31" rx="8" ry="9" fill="#FFCA7A" opacity="0.5" />
      <path d="M10 26 Q28 18 46 26" fill="#FF8C61" />
      <rect x="10" y="24" width="36" height="4" rx="2" fill="#FF8C61" />
      <ellipse cx="28" cy="13" rx="3" ry="5" fill="#9DC08B" />
      <circle cx="22" cy="31" r="3.5" fill="white" />
      <circle cx="34" cy="31" r="3.5" fill="white" />
      <circle cx="22.8" cy="31.5" r="1.8" fill="#2D3436" />
      <circle cx="34.8" cy="31.5" r="1.8" fill="#2D3436" />
      <circle cx="23.4" cy="30.9" r="0.6" fill="white" />
      <circle cx="35.4" cy="30.9" r="0.6" fill="white" />
      <circle cx="22" cy="31" r="4.5" stroke="#2D3436" strokeWidth="1.5" fill="none" />
      <circle cx="34" cy="31" r="4.5" stroke="#2D3436" strokeWidth="1.5" fill="none" />
      <line x1="26.5" y1="31" x2="29.5" y2="31" stroke="#2D3436" strokeWidth="1.5" />
      <line x1="17.5" y1="30.5" x2="15" y2="29" stroke="#2D3436" strokeWidth="1.5" />
      <line x1="38.5" y1="30.5" x2="41" y2="29" stroke="#2D3436" strokeWidth="1.5" />
      <ellipse cx="17" cy="35" rx="3" ry="2" fill="#FF8C61" opacity="0.35" />
      <ellipse cx="39" cy="35" rx="3" ry="2" fill="#FF8C61" opacity="0.35" />
      <path d="M22 37 Q28 41 34 37" stroke="#2D3436" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="46" cy="14" r="5" fill="#FFD700" opacity="0.8" />
      <line x1="46" y1="7" x2="46" y2="5" stroke="#FFD700" strokeWidth="1.5" />
      <line x1="51" y1="9" x2="53" y2="7" stroke="#FFD700" strokeWidth="1.5" />
      <line x1="53" y1="14" x2="55" y2="14" stroke="#FFD700" strokeWidth="1.5" />
    </svg>
  )
}

export function PesseguinhoNoite({ size = 56 }: MascotProps) {
  return (
    <img
      src="https://pbluwnkettebcfpvumio.supabase.co/storage/v1/object/public/assets/mascote-noite.png"
      alt="Pesseguinho noite"
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
    />
  )
}

export function PesseguinhoFotoAlerta({ size = 56 }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <ellipse cx="28" cy="32" rx="18" ry="19" fill="#FFCBAD" />
      <ellipse cx="22" cy="31" rx="8" ry="9" fill="#FFB899" opacity="0.5" />
      <ellipse cx="28" cy="13" rx="3" ry="5" fill="#9DC08B" />
      <rect x="36" y="34" width="14" height="10" rx="2" fill="#2D3436" />
      <circle cx="43" cy="39" r="3.5" fill="#555" />
      <circle cx="43" cy="39" r="2" fill="#7B9EC5" opacity="0.8" />
      <rect x="37" y="32" width="5" height="3" rx="1" fill="#2D3436" />
      <circle cx="22" cy="30" r="3.5" fill="white" />
      <circle cx="34" cy="30" r="3.5" fill="white" />
      <circle cx="22.5" cy="30.5" r="2" fill="#2D3436" />
      <circle cx="34.5" cy="30.5" r="2" fill="#2D3436" />
      <circle cx="23.2" cy="29.8" r="0.7" fill="white" />
      <circle cx="35.2" cy="29.8" r="0.7" fill="white" />
      <circle cx="22" cy="30" r="4.5" stroke="#2D3436" strokeWidth="1.5" fill="none" />
      <circle cx="34" cy="30" r="4.5" stroke="#2D3436" strokeWidth="1.5" fill="none" />
      <line x1="26.5" y1="30" x2="29.5" y2="30" stroke="#2D3436" strokeWidth="1.5" />
      <line x1="17.5" y1="29.5" x2="15" y2="28" stroke="#2D3436" strokeWidth="1.5" />
      <line x1="38.5" y1="29.5" x2="40" y2="28" stroke="#2D3436" strokeWidth="1.5" />
      <ellipse cx="17" cy="34" rx="3" ry="2" fill="#FF8C61" opacity="0.45" />
      <ellipse cx="31" cy="35" rx="3" ry="2" fill="#FF8C61" opacity="0.45" />
      <ellipse cx="27" cy="37" rx="3" ry="2.5" fill="#2D3436" />
      <ellipse cx="27" cy="37" rx="2" ry="1.5" fill="#FF8C61" opacity="0.5" />
    </svg>
  )
}

export function ActiveMascot({
  period,
  showPhotoAlert,
  size = 56,
}: {
  period: 'manha' | 'noite'
  showPhotoAlert: boolean
  size?: number
}) {
  if (showPhotoAlert) return <PesseguinhoFotoAlerta size={size} />
  if (period === 'manha') return <PesseguinhoManha size={size} />
  return <PesseguinhoNoite size={size} />
}
