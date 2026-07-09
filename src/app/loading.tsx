export default function LoadingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f8f9fb",
        color: "#64748b",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
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
        <p>جاري التحميل...</p>
      </div>
    </main>
  );
}
