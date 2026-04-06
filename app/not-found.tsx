import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100dvh", background: "#070810", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "sans-serif", textAlign: "center"
    }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}>🌌</div>
      <h2 style={{ color: "#818cf8", fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
        404 — Yahan kuch nahi hai!
      </h2>
      <p style={{ color: "#475569", fontSize: 13, marginBottom: 28, maxWidth: 260 }}>
        Jo page dhundh rahe ho woh exist nahi karta. Shayad delete ho gaya ya URL galat hai.
      </p>
      <Link href="/" style={{
        background: "linear-gradient(135deg, #6366f1, #818cf8)",
        borderRadius: 12, color: "#fff", padding: "12px 28px",
        fontWeight: 800, fontSize: 14, textDecoration: "none", display: "inline-block"
      }}>
        🏠 Wapas Home
      </Link>
    </div>
  );
}
