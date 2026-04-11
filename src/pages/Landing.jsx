import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    { icon: "📱", title: "Multi-Device", desc: "Connect multiple Android phones and send from any device" },
    { icon: "📋", title: "Number Lists", desc: "Create and manage contact lists for targeted campaigns" },
    { icon: "⏱️", title: "Delay Control", desc: "Set custom delay between messages to avoid spam filters" },
    { icon: "🕐", title: "Scheduled Send", desc: "Schedule messages to send automatically at any time" },
    { icon: "🔥", title: "Background Mode", desc: "App works even when phone screen is off via FCM" },
    { icon: "📊", title: "Send Logs", desc: "Track every message with real-time delivery status" },
  ];

  return (
    <div style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navLogo}>
          <span style={s.navIcon}>💬</span>
          <span style={s.navBrand}>BulkSMS</span>
        </div>
        <div style={s.navBtns}>
          <button style={s.navOutline} onClick={() => navigate("/login")}>Login</button>
          <button style={s.navFill} onClick={() => navigate("/signup")}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroBadge}>🚀 Bulk SMS Automation Platform</div>
        <h1 style={s.heroTitle}>
          Send Bulk SMS from<br />
          <span style={s.heroGradient}>Your Own Phone</span>
        </h1>
        <p style={s.heroSub}>
          Connect your Android phone, manage contact lists, schedule campaigns,
          and send thousands of messages — all from your browser.
        </p>
        <div style={s.heroBtns}>
          <button style={s.heroBtn} onClick={() => navigate("/signup")}>
            Start for Free →
          </button>
          <button style={s.heroOutline} onClick={() => navigate("/login")}>
            Sign In
          </button>
        </div>

        {/* Stats */}
        <div style={s.stats}>
          {[["∞", "Messages"], ["Multi", "Devices"], ["0₹", "Cost"], ["24/7", "Background"]].map(([num, label]) => (
            <div key={label} style={s.statItem}>
              <span style={s.statNum}>{num}</span>
              <span style={s.statLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={s.features}>
        <h2 style={s.featTitle}>Everything you need</h2>
        <p style={s.featSub}>Powerful features to automate your SMS campaigns</p>
        <div style={s.featGrid}>
          {features.map((f) => (
            <div key={f.title} style={s.featCard}>
              <span style={s.featIcon}>{f.icon}</span>
              <h3 style={s.featCardTitle}>{f.title}</h3>
              <p style={s.featCardDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={s.cta}>
        <h2 style={s.ctaTitle}>Ready to automate your SMS?</h2>
        <p style={s.ctaSub}>Create your free account and connect your phone in minutes</p>
        <button style={s.ctaBtn} onClick={() => navigate("/signup")}>
          Create Free Account →
        </button>
      </div>

      {/* Footer */}
      <footer style={s.footer}>
        <span style={s.footerLogo}>💬 BulkSMS</span>
        <span style={s.footerText}>© 2025 BulkSMS. All rights reserved.</span>
      </footer>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#0f0f1a", color: "#fff", fontFamily: "'Segoe UI', sans-serif" },

  // Nav
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid #ffffff10" },
  navLogo: { display: "flex", alignItems: "center", gap: 10 },
  navIcon: { fontSize: 28 },
  navBrand: { fontSize: 22, fontWeight: "800", background: "linear-gradient(135deg,#6366f1,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  navBtns: { display: "flex", gap: 12 },
  navOutline: { padding: "9px 22px", border: "1px solid #6366f1", borderRadius: 8, background: "transparent", color: "#6366f1", cursor: "pointer", fontWeight: "600", fontSize: 14 },
  navFill: { padding: "9px 22px", border: "none", borderRadius: 8, background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff", cursor: "pointer", fontWeight: "600", fontSize: 14 },

  // Hero
  hero: { textAlign: "center", padding: "80px 20px 60px", maxWidth: 800, margin: "0 auto" },
  heroBadge: { display: "inline-block", padding: "6px 16px", borderRadius: 20, background: "#6366f120", border: "1px solid #6366f140", color: "#a5b4fc", fontSize: 13, marginBottom: 24 },
  heroTitle: { fontSize: 56, fontWeight: "900", lineHeight: 1.1, margin: "0 0 20px", color: "#fff" },
  heroGradient: { background: "linear-gradient(135deg,#6366f1,#a855f7,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  heroSub: { fontSize: 18, color: "#94a3b8", lineHeight: 1.7, marginBottom: 36 },
  heroBtns: { display: "flex", gap: 16, justifyContent: "center", marginBottom: 60 },
  heroBtn: { padding: "14px 32px", background: "linear-gradient(135deg,#6366f1,#a855f7)", border: "none", borderRadius: 10, color: "#fff", fontSize: 16, fontWeight: "700", cursor: "pointer" },
  heroOutline: { padding: "14px 32px", border: "1px solid #334155", borderRadius: 10, background: "transparent", color: "#94a3b8", fontSize: 16, fontWeight: "600", cursor: "pointer" },
  stats: { display: "flex", justifyContent: "center", gap: 48 },
  statItem: { display: "flex", flexDirection: "column", alignItems: "center" },
  statNum: { fontSize: 28, fontWeight: "800", color: "#6366f1" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 4 },

  // Features
  features: { padding: "80px 40px", maxWidth: 1100, margin: "0 auto" },
  featTitle: { textAlign: "center", fontSize: 36, fontWeight: "800", marginBottom: 12 },
  featSub: { textAlign: "center", color: "#64748b", fontSize: 16, marginBottom: 48 },
  featGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24 },
  featCard: { background: "#ffffff08", border: "1px solid #ffffff10", borderRadius: 16, padding: 28 },
  featIcon: { fontSize: 32, display: "block", marginBottom: 16 },
  featCardTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, color: "#f1f5f9" },
  featCardDesc: { fontSize: 14, color: "#64748b", lineHeight: 1.6 },

  // CTA
  cta: { textAlign: "center", padding: "80px 20px", background: "#ffffff05", borderTop: "1px solid #ffffff10" },
  ctaTitle: { fontSize: 36, fontWeight: "800", marginBottom: 12 },
  ctaSub: { color: "#64748b", fontSize: 16, marginBottom: 32 },
  ctaBtn: { padding: "16px 40px", background: "linear-gradient(135deg,#6366f1,#a855f7)", border: "none", borderRadius: 12, color: "#fff", fontSize: 16, fontWeight: "700", cursor: "pointer" },

  // Footer
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 40px", borderTop: "1px solid #ffffff10" },
  footerLogo: { fontWeight: "700", color: "#6366f1" },
  footerText: { color: "#334155", fontSize: 13 },
};
