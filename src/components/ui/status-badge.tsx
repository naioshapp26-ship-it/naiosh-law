export type BadgeColor = "green" | "red" | "yellow" | "blue" | "gray" | "purple" | "orange" | "teal";

const colorMap: Record<BadgeColor, { bg: string; color: string; border: string }> = {
  green:  { bg: "rgba(34,197,94,0.1)",  color: "#16a34a", border: "rgba(34,197,94,0.22)"  },
  red:    { bg: "rgba(195,21,42,0.1)",  color: "#c3152a", border: "rgba(195,21,42,0.22)"  },
  yellow: { bg: "rgba(245,158,11,0.1)", color: "#b45309", border: "rgba(245,158,11,0.22)" },
  blue:   { bg: "rgba(59,130,246,0.1)", color: "#1d4ed8", border: "rgba(59,130,246,0.22)" },
  gray:   { bg: "rgba(100,116,139,0.1)",color: "#475569", border: "rgba(100,116,139,0.2)" },
  purple: { bg: "rgba(139,92,246,0.1)", color: "#6d28d9", border: "rgba(139,92,246,0.22)" },
  orange: { bg: "rgba(249,115,22,0.1)", color: "#c2410c", border: "rgba(249,115,22,0.22)" },
  teal:   { bg: "rgba(20,184,166,0.1)", color: "#0f766e", border: "rgba(20,184,166,0.22)" },
};

type Props = {
  label: string;
  color: BadgeColor;
  dot?: boolean;
};

export function StatusBadge({ label, color, dot = true }: Props) {
  const s = colorMap[color];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: "100px",
        padding: "0.22rem 0.7rem",
        fontSize: "0.72rem",
        fontWeight: 700,
        whiteSpace: "normal",
        overflowWrap: "anywhere",
        letterSpacing: "0.01em",
      }}
    >
      {dot && (
        <span
          aria-hidden="true"
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: s.color,
            flexShrink: 0,
          }}
        />
      )}
      {label}
    </span>
  );
}
