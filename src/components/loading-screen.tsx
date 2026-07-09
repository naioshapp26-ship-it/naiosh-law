type Props = {
  label?: string;
};

export function LoadingScreen({ label = "جاري التحميل..." }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f6f9",
        padding: "1.5rem",
      }}
    >
      <div style={{ textAlign: "center", color: "#64748b" }}>
        <div
          aria-hidden="true"
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "3px solid #e2e8f0",
            borderTopColor: "#c3152a",
            animation: "spin-slow 0.9s linear infinite",
            margin: "0 auto 1rem",
          }}
        />
        <p>{label}</p>
      </div>
    </div>
  );
}
