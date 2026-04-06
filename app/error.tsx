"use client";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[JARVIS] App Error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100dvh", background: "#070810", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "sans-serif", textAlign: "center"
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>💔</div>
      <h2 style={{ color: "#f87171", fontSize: 20, fontWeight: 900, marginBottom: 8 }}>
        Kuch toot gaya!
      </h2>
      <p style={{ color: "#475569", fontSize: 13, marginBottom: 24, maxWidth: 280 }}>
        {error.message || "Unexpected error aa gaya. Dobara try karo."}
      </p>
      <button
        onClick={reset}
        style={{
          background: "linear-gradient(135deg, #6366f1, #818cf8)",
          border: "none", borderRadius: 12, color: "#fff",
          padding: "12px 28px", fontWeight: 800, fontSize: 14, cursor: "pointer"
        }}
      >
        🔄 Try Again
      </button>
      <button
        onClick={() => window.location.href = "/"}
        style={{
          background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, color: "#6b7280", padding: "10px 24px",
          fontWeight: 700, fontSize: 13, cursor: "pointer", marginTop: 10
        }}
      >
        🏠 Home par jao
      </button>
    </div>
  );
}
