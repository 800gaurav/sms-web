import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = "http://10.54.46.126:5000";

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      login(data.user, data.token);
      navigate("/dashboard");
    } catch {
      setError("Server se connect nahi ho pa raha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>💬</div>
        <h1 style={s.title}>Create account</h1>
        <p style={s.sub}>Start sending bulk SMS for free</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={submit}>
          <label style={s.label}>Full Name</label>
          <input style={s.input} type="text" placeholder="Your name"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />

          <label style={s.label}>Email</label>
          <input style={s.input} type="email" placeholder="you@example.com"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />

          <label style={s.label}>Password</label>
          <input style={s.input} type="password" placeholder="Min 6 characters"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />

          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? "Creating account..." : "Create Account →"}
          </button>
        </form>

        <p style={s.foot}>
          Already have an account?{" "}
          <Link to="/login" style={s.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif", padding: "20px" },
  card: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 420, boxShadow: "0 10px 40px rgba(0,0,0,0.08)" },
  logo: { fontSize: 40, textAlign: "center", marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "800", color: "#111827", textAlign: "center", margin: "0 0 8px" },
  sub: { color: "#6b7280", textAlign: "center", fontSize: 14, marginBottom: 32 },
  error: { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: { width: "100%", padding: "12px 14px", background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 10, color: "#111827", fontSize: 14, marginBottom: 16, boxSizing: "border-box", outline: "none" },
  btn: { width: "100%", padding: "13px", background: "linear-gradient(135deg,#3b82f6,#2563eb)", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: "700", cursor: "pointer", marginTop: 4, boxShadow: "0 4px 12px rgba(59,130,246,0.3)" },
  foot: { textAlign: "center", color: "#6b7280", fontSize: 13, marginTop: 24 },
  link: { color: "#3b82f6", textDecoration: "none", fontWeight: "600" },
};
