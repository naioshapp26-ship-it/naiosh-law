export default function AppLoading() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6f9" }}>
      <div style={{ textAlign: "center", color: "#64748b" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#c3152a", animation: "spin-slow 0.9s linear infinite", margin: "0 auto 1rem" }} />
        <p style={{ fontWeight: 700 }}>جاري تحميل مساحة العمل...</p>
      </div>
    </div>
  );
}
