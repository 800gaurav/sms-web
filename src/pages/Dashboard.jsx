import { useEffect, useState } from "react";

const API = "https://sms-backend-eqqt.onrender.com";
const WS_API = "ws://localhost:5000";

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [contacts, setContacts] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  const [backendOk, setBackendOk] = useState(null); // null=checking, true=ok, false=error

  // Selected recipients — array of { name, phone }
  const [recipients, setRecipients] = useState([]);
  const [manualPhone, setManualPhone] = useState("");

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendLog, setSendLog] = useState([]); // { phone, status, time }
  const [activeTab, setActiveTab] = useState("send"); // "send" | "contacts" | "log"

  // Poll devices every 3s
  useEffect(() => {
    fetchDevices();
    const t = setInterval(fetchDevices, 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (selectedDevice) fetchContacts(selectedDevice);
    else setContacts([]);
  }, [selectedDevice]);

  const fetchDevices = async () => {
    try {
      const res = await fetch(`${API}/devices`);
      const data = await res.json();
      setDevices(data);
      setBackendOk(true);
    } catch {
      setDevices([]);
      setBackendOk(false);
    }
  };

  const fetchContacts = async (deviceId) => {
    try {
      const res = await fetch(`${API}/contacts/${deviceId}`);
      setContacts(await res.json());
    } catch {
      setContacts([]);
    }
  };

  const refreshContacts = async () => {
    if (!selectedDevice) return;
    await fetch(`${API}/contacts/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: selectedDevice }),
    });
    setTimeout(() => fetchContacts(selectedDevice), 2000);
  };

  // Toggle contact in recipients list
  const toggleRecipient = (contact) => {
    const exists = recipients.find((r) => r.phone === contact.phone);
    if (exists) {
      setRecipients(recipients.filter((r) => r.phone !== contact.phone));
    } else {
      setRecipients([...recipients, { name: contact.name, phone: contact.phone }]);
    }
  };

  // Add manual phone number
  const addManualPhone = () => {
    const trimmed = manualPhone.trim();
    if (!trimmed) return;
    if (recipients.find((r) => r.phone === trimmed)) return;
    setRecipients([...recipients, { name: trimmed, phone: trimmed }]);
    setManualPhone("");
  };

  const removeRecipient = (phone) => {
    setRecipients(recipients.filter((r) => r.phone !== phone));
  };

  // Select all filtered contacts
  const selectAll = () => {
    const toAdd = filteredContacts.filter(
      (c) => !recipients.find((r) => r.phone === c.phone)
    );
    setRecipients([...recipients, ...toAdd.map((c) => ({ name: c.name, phone: c.phone }))]);
  };

  const clearAll = () => setRecipients([]);

  // Send to all recipients one by one
  const sendBulk = async () => {
    if (!selectedDevice) return alert("Device select karo");
    if (recipients.length === 0) return alert("Koi recipient add karo");
    if (!message.trim()) return alert("Message likho");

    setSending(true);
    const results = [];

    for (const r of recipients) {
      try {
        const res = await fetch(`${API}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceId: selectedDevice, phone: r.phone, message }),
        });
        const data = await res.json();
        results.push({
          phone: r.phone,
          name: r.name,
          status: res.ok ? "sent" : "failed",
          time: new Date().toLocaleTimeString(),
        });
      } catch {
        results.push({ phone: r.phone, name: r.name, status: "failed", time: new Date().toLocaleTimeString() });
      }
      // Small delay between sends
      await new Promise((r) => setTimeout(r, 300));
    }

    setSendLog((prev) => [...results, ...prev]);
    setSending(false);
    setActiveTab("log");
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.includes(contactSearch)
  );

  const sentCount = sendLog.filter((l) => l.status === "sent").length;
  const failedCount = sendLog.filter((l) => l.status === "failed").length;

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.logo}>💬</span>
          <span style={s.logoText}>BulkSMS</span>
        </div>
        <div style={s.headerRight}>
          {backendOk === false ? (
            <span style={{ ...s.badge, background: "#fee2e2", color: "#ef4444" }}>⚠️ Backend offline — run: node src/server.js</span>
          ) : devices.filter(d => d.online).length > 0 ? (
            <span style={s.badge}>🟢 {devices.filter(d => d.online).length} device{devices.filter(d => d.online).length > 1 ? "s" : ""} online</span>
          ) : (
            <span style={{ ...s.badge, background: "#fef9c3", color: "#b45309" }}>📱 Backend OK — Open app on phone</span>
          )}
        </div>
      </div>

      <div style={s.layout}>
        {/* ── Left Panel — Devices + Recipients ── */}
        <div style={s.leftPanel}>

          {/* Device Card */}
          <div style={s.card}>
            <p style={s.cardLabel}>SELECT DEVICE</p>
            <select
              style={s.select}
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
            >
              <option value="">-- Choose Device --</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  📱 {d.name} • {d.phoneNumber}
                </option>
              ))}
            </select>

            {/* Device info pills */}
            {devices.map((d) => (
              <div
                key={d.id}
                style={{
                  ...s.devicePill,
                  border: selectedDevice === d.id ? "2px solid #6366f1" : "2px solid #e2e8f0",
                  background: selectedDevice === d.id ? "#eef2ff" : "#f8fafc",
                }}
                onClick={() => setSelectedDevice(d.id)}
              >
                <div style={s.devicePillLeft}>
                  <span style={s.deviceIcon}>📱</span>
                  <div>
                    <div style={s.deviceName}>{d.name}</div>
                    <div style={s.devicePhone}>{d.phoneNumber}</div>
                    <div style={s.deviceMeta}>
                      <span>{d.network === "WiFi" ? "📶" : d.network === "Mobile Data" ? "📡" : "❌"} {d.network}</span>
                      <span style={{ marginLeft: 8 }}>
                        {d.charging ? "⚡" : "🔋"} {d.battery >= 0 ? `${d.battery}%` : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
                <span style={d.online ? s.onlineDot : s.offlineDot}>{d.online ? "●" : "○"}</span>
              </div>
            ))}

            {devices.length === 0 && (
              <div style={s.noDeviceBox}>
                {backendOk === false ? (
                  <>
                    <p style={{ ...s.muted, color: "#ef4444", fontWeight: "600" }}>⚠️ Backend chal nahi raha</p>
                    <p style={s.muted}>Terminal mein run karo:</p>
                    <code style={s.code}>cd sms-backend &amp;&amp; node src/server.js</code>
                  </>
                ) : (
                  <>
                    <p style={{ ...s.muted, fontWeight: "600" }}>📱 Phone connect nahi hai</p>
                    <p style={s.muted}>1. Phone aur PC same WiFi pe hone chahiye</p>
                    <p style={s.muted}>2. App mein IP set karo: <code style={s.inlineCode}>192.168.1.40</code></p>
                    <p style={s.muted}>3. App open karo — auto-connect hoga</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Recipients Card */}
          <div style={s.card}>
            <div style={s.rowBetween}>
              <p style={s.cardLabel}>RECIPIENTS ({recipients.length})</p>
              {recipients.length > 0 && (
                <button style={s.linkBtn} onClick={clearAll}>Clear all</button>
              )}
            </div>

            {/* Manual add */}
            <div style={s.addRow}>
              <input
                style={s.addInput}
                placeholder="Add number manually..."
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addManualPhone()}
              />
              <button style={s.addBtn} onClick={addManualPhone}>+</button>
            </div>

            {/* Recipients chips */}
            {recipients.length === 0 ? (
              <p style={s.muted}>No recipients added yet</p>
            ) : (
              <div style={s.chipWrap}>
                {recipients.map((r) => (
                  <div key={r.phone} style={s.chip}>
                    <span style={s.chipName}>{r.name !== r.phone ? r.name : r.phone}</span>
                    <button style={s.chipRemove} onClick={() => removeRecipient(r.phone)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel — Tabs ── */}
        <div style={s.rightPanel}>

          {/* Tabs */}
          <div style={s.tabs}>
            {[
              { key: "send", label: "✉️ Compose" },
              { key: "contacts", label: `👥 Contacts ${contacts.length > 0 ? `(${contacts.length})` : ""}` },
              { key: "log", label: `📋 Log ${sendLog.length > 0 ? `(${sendLog.length})` : ""}` },
            ].map((tab) => (
              <button
                key={tab.key}
                style={{ ...s.tab, ...(activeTab === tab.key ? s.tabActive : {}) }}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Compose Tab ── */}
          {activeTab === "send" && (
            <div style={s.tabContent}>
              <p style={s.cardLabel}>MESSAGE</p>
              <textarea
                style={s.textarea}
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div style={s.charCount}>{message.length} chars • ~{Math.ceil(message.length / 160)} SMS</div>

              {/* Summary */}
              <div style={s.summaryBox}>
                <div style={s.summaryItem}>
                  <span style={s.summaryNum}>{recipients.length}</span>
                  <span style={s.summaryLabel}>Recipients</span>
                </div>
                <div style={s.summaryDivider} />
                <div style={s.summaryItem}>
                  <span style={s.summaryNum}>{Math.ceil(message.length / 160) || 1}</span>
                  <span style={s.summaryLabel}>SMS/person</span>
                </div>
                <div style={s.summaryDivider} />
                <div style={s.summaryItem}>
                  <span style={s.summaryNum}>{recipients.length * (Math.ceil(message.length / 160) || 1)}</span>
                  <span style={s.summaryLabel}>Total SMS</span>
                </div>
              </div>

              <button
                style={{
                  ...s.sendBtn,
                  opacity: sending || !selectedDevice || recipients.length === 0 || !message ? 0.6 : 1,
                  cursor: sending ? "not-allowed" : "pointer",
                }}
                onClick={sendBulk}
                disabled={sending}
              >
                {sending
                  ? `⏳ Sending... (${sendLog.length}/${recipients.length})`
                  : `📤 Send to ${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          )}

          {/* ── Contacts Tab ── */}
          {activeTab === "contacts" && (
            <div style={s.tabContent}>
              {!selectedDevice ? (
                <p style={s.muted}>Select a device first to load contacts</p>
              ) : (
                <>
                  <div style={s.rowBetween}>
                    <input
                      style={{ ...s.searchInput }}
                      placeholder="🔍 Search contacts..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                    />
                    <button style={s.refreshBtn} onClick={refreshContacts}>🔄</button>
                  </div>

                  <div style={s.rowBetween}>
                    <span style={s.muted}>{filteredContacts.length} contacts</span>
                    <button style={s.linkBtn} onClick={selectAll}>Select all</button>
                  </div>

                  <div style={s.contactList}>
                    {filteredContacts.length === 0 ? (
                      <p style={{ ...s.muted, padding: 16 }}>No contacts found</p>
                    ) : (
                      filteredContacts.map((c) => {
                        const selected = !!recipients.find((r) => r.phone === c.phone);
                        return (
                          <div
                            key={c.id}
                            style={{
                              ...s.contactRow,
                              background: selected ? "#eef2ff" : "#fff",
                            }}
                            onClick={() => toggleRecipient(c)}
                          >
                            <div style={s.contactAvatar}>
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={s.contactInfo}>
                              <div style={s.contactName}>{c.name}</div>
                              <div style={s.contactPhone}>{c.phone}</div>
                            </div>
                            <div style={{ ...s.checkbox, ...(selected ? s.checkboxOn : {}) }}>
                              {selected && "✓"}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Log Tab ── */}
          {activeTab === "log" && (
            <div style={s.tabContent}>
              {sendLog.length === 0 ? (
                <p style={s.muted}>No messages sent yet</p>
              ) : (
                <>
                  {/* Stats */}
                  <div style={s.logStats}>
                    <span style={{ ...s.logStatBadge, background: "#dcfce7", color: "#16a34a" }}>
                      ✅ {sentCount} sent
                    </span>
                    <span style={{ ...s.logStatBadge, background: "#fee2e2", color: "#dc2626" }}>
                      ❌ {failedCount} failed
                    </span>
                    <button style={s.linkBtn} onClick={() => setSendLog([])}>Clear</button>
                  </div>

                  <div style={s.logList}>
                    {sendLog.map((l, i) => (
                      <div key={i} style={s.logRow}>
                        <span style={l.status === "sent" ? s.logSent : s.logFailed}>
                          {l.status === "sent" ? "✅" : "❌"}
                        </span>
                        <div style={s.logInfo}>
                          <span style={s.logName}>{l.name !== l.phone ? l.name : ""}</span>
                          <span style={s.logPhone}>{l.phone}</span>
                        </div>
                        <span style={s.logTime}>{l.time}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', sans-serif" },

  // Header
  header: {
    background: "#fff", borderBottom: "1px solid #e2e8f0",
    padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  logo: { fontSize: 24 },
  logoText: { fontSize: 20, fontWeight: "700", color: "#1e293b" },
  headerRight: {},
  badge: { padding: "5px 12px", borderRadius: 20, background: "#dcfce7", color: "#16a34a", fontSize: 13, fontWeight: "600" },

  // Layout
  layout: { display: "flex", gap: 16, padding: 20, maxWidth: 1100, margin: "0 auto", flexWrap: "wrap" },
  leftPanel: { flex: "0 0 300px", display: "flex", flexDirection: "column", gap: 16 },
  rightPanel: { flex: 1, minWidth: 320, background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" },

  // Card
  card: { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 16 },
  cardLabel: { fontSize: 11, fontWeight: "700", color: "#94a3b8", letterSpacing: 1, margin: "0 0 10px" },

  // Device
  select: {
    width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0",
    borderRadius: 8, fontSize: 14, marginBottom: 12, background: "#f8fafc", boxSizing: "border-box",
  },
  devicePill: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 12px", borderRadius: 10, marginBottom: 8, cursor: "pointer",
  },
  devicePillLeft: { display: "flex", alignItems: "center", gap: 10 },
  deviceIcon: { fontSize: 22 },
  deviceName: { fontSize: 13, fontWeight: "600", color: "#1e293b" },
  devicePhone: { fontSize: 12, color: "#6366f1" },
  deviceMeta: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  onlineDot: { color: "#22c55e", fontSize: 18 },
  offlineDot: { color: "#94a3b8", fontSize: 18 },

  // Recipients
  rowBetween: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  addRow: { display: "flex", gap: 8, marginBottom: 10 },
  addInput: {
    flex: 1, padding: "8px 12px", border: "1px solid #e2e8f0",
    borderRadius: 8, fontSize: 14, boxSizing: "border-box",
  },
  addBtn: {
    padding: "8px 14px", background: "#6366f1", color: "#fff",
    border: "none", borderRadius: 8, fontSize: 18, cursor: "pointer", fontWeight: "bold",
  },
  chipWrap: { display: "flex", flexWrap: "wrap", gap: 6 },
  chip: {
    display: "flex", alignItems: "center", gap: 4,
    background: "#eef2ff", border: "1px solid #c7d2fe",
    borderRadius: 20, padding: "4px 10px",
  },
  chipName: { fontSize: 12, color: "#4338ca" },
  chipRemove: { background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 },

  // Tabs
  tabs: { display: "flex", borderBottom: "1px solid #e2e8f0" },
  tab: {
    flex: 1, padding: "13px 8px", background: "none", border: "none",
    fontSize: 13, color: "#64748b", cursor: "pointer", fontWeight: "500",
  },
  tabActive: { color: "#6366f1", borderBottom: "2px solid #6366f1", fontWeight: "700" },
  tabContent: { padding: 18 },

  // Compose
  textarea: {
    width: "100%", minHeight: 140, padding: "12px", border: "1px solid #e2e8f0",
    borderRadius: 10, fontSize: 14, resize: "vertical", boxSizing: "border-box",
    fontFamily: "inherit", outline: "none",
  },
  charCount: { fontSize: 12, color: "#94a3b8", textAlign: "right", marginBottom: 14 },
  summaryBox: {
    display: "flex", background: "#f8fafc", borderRadius: 10,
    border: "1px solid #e2e8f0", marginBottom: 16, overflow: "hidden",
  },
  summaryItem: { flex: 1, padding: "12px 8px", textAlign: "center" },
  summaryNum: { display: "block", fontSize: 22, fontWeight: "700", color: "#1e293b" },
  summaryLabel: { fontSize: 11, color: "#94a3b8" },
  summaryDivider: { width: 1, background: "#e2e8f0" },
  sendBtn: {
    width: "100%", padding: "13px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "#fff", border: "none", borderRadius: 10, fontSize: 15,
    fontWeight: "600", cursor: "pointer",
  },

  // Contacts
  searchInput: {
    flex: 1, padding: "9px 12px", border: "1px solid #e2e8f0",
    borderRadius: 8, fontSize: 14, marginBottom: 8,
  },
  refreshBtn: {
    padding: "8px 12px", background: "#f1f5f9", border: "1px solid #e2e8f0",
    borderRadius: 8, cursor: "pointer", fontSize: 16, marginBottom: 8,
  },
  contactList: { maxHeight: 400, overflowY: "auto", border: "1px solid #f1f5f9", borderRadius: 10 },
  contactRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 12px", borderBottom: "1px solid #f8fafc", cursor: "pointer",
  },
  contactAvatar: {
    width: 36, height: 36, borderRadius: "50%", background: "#e0e7ff",
    color: "#6366f1", fontWeight: "700", fontSize: 15,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 13, fontWeight: "600", color: "#1e293b" },
  contactPhone: { fontSize: 12, color: "#6366f1" },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, border: "2px solid #cbd5e1",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, color: "#fff", flexShrink: 0,
  },
  checkboxOn: { background: "#6366f1", border: "2px solid #6366f1" },

  // Log
  logStats: { display: "flex", gap: 8, alignItems: "center", marginBottom: 12 },
  logStatBadge: { padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: "600" },
  logList: { border: "1px solid #f1f5f9", borderRadius: 10, overflow: "hidden" },
  logRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 12px", borderBottom: "1px solid #f8fafc",
  },
  logSent: { fontSize: 16 },
  logFailed: { fontSize: 16 },
  logInfo: { flex: 1, display: "flex", flexDirection: "column" },
  logName: { fontSize: 13, fontWeight: "600", color: "#1e293b" },
  logPhone: { fontSize: 12, color: "#64748b" },
  logTime: { fontSize: 11, color: "#94a3b8" },

  noDeviceBox: { padding: "10px 4px", display: "flex", flexDirection: "column", gap: 6 },
  code: { background: "#f1f5f9", padding: "6px 10px", borderRadius: 6, fontSize: 12, fontFamily: "monospace", color: "#1e293b", display: "block", marginTop: 4 },
  inlineCode: { background: "#eef2ff", padding: "1px 6px", borderRadius: 4, fontSize: 12, fontFamily: "monospace", color: "#4338ca" },
  // Common
  muted: { color: "#94a3b8", fontSize: 13 },
  linkBtn: { background: "none", border: "none", color: "#6366f1", fontSize: 13, cursor: "pointer", fontWeight: "600" },
};
