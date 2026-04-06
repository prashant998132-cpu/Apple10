export default function Loading() {
  return (
    <div style={{
      minHeight: "100dvh", background: "#070810", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "sans-serif"
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: "50%",
        border: "3px solid rgba(99,102,241,0.2)",
        borderTop: "3px solid #6366f1",
        animation: "spin 0.8s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: "#475569", fontSize: 12, marginTop: 14, fontWeight: 700 }}>
        JARVIS loading...
      </p>
    </div>
  );
}
