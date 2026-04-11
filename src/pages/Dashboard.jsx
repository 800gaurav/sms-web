import { useEffect, useState } from "react";
import { useAuth, getToken } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API = "http://10.33.86.126:5000";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [lists, setLists] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [savedMessages, setSavedMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyStats, setHistoryStats] = useState({ sent: 0, failed: 0, total: 0 });
  const [activeTab, setActiveTab] = useState("devices");
  
  // Send form
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedList, setSelectedList] = useState("");
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [message, setMessage] = useState("");
  const [delaySeconds, setDelaySeconds] = useState(3);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [recurring, setRecurring] = useState("none");
  const [sending, setSending] = useState(false);

  // List form
  const [listName, setListName] = useState("");
  const [listNumbers, setListNumbers] = useState("");
  const [listDevice, setListDevice] = useState("");
  const [editingList, setEditingList] = useState(null);
  const [viewingList, setViewingList] = useState(null);
  
  // Saved message form
  const [msgTitle, setMsgTitle] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [editingMsg, setEditingMsg] = useState(null);

  useEffect(() => {
    fetchDevices();
    fetchLists();
    fetchJobs();
    fetchSavedMessages();
    fetchHistory();
    const t = setInterval(() => {
      fetchDevices();
      fetchJobs();
      fetchHistory();
    }, 5000);
    return () => clearInterval(t);
  }, []);
  
  useEffect(() => {
    if (selectedList) {
      const list = lists.find(l => l._id === selectedList);
      if (list) setSelectedNumbers(list.numbers);
    } else {
      setSelectedNumbers([]);
    }
  }, [selectedList, lists]);

  const api = async (url, opts = {}) => {
    const token = getToken();
    const res = await fetch(`${API}${url}`, {
      ...opts,
      headers: { ...opts.headers, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    if (res.status === 401) {
      logout();
      navigate("/login");
      return null;
    }
    return res.json();
  };

  const fetchDevices = async () => {
    const data = await api("/devices");
    if (data) setDevices(Array.isArray(data) ? data : []);
  };

  const fetchLists = async () => {
    const data = await api("/lists");
    if (data) setLists(data);
  };

  const fetchJobs = async () => {
    const data = await api("/jobs");
    if (data) setJobs(data);
  };
  
  const fetchSavedMessages = async () => {
    const data = await api("/saved-messages");
    if (data) setSavedMessages(data);
  };
  
  const fetchHistory = async () => {
    const data = await api("/history?limit=50");
    if (data) {
      setHistory(data.history || []);
      setHistoryStats(data.stats || { sent: 0, failed: 0, total: 0 });
    }
  };
  
  const saveSavedMessage = async () => {
    if (!msgTitle.trim() || !msgContent.trim()) {
      alert("⚠️ Please enter title and message");
      return;
    }
    try {
      if (editingMsg) {
        await api(`/saved-messages/${editingMsg._id}`, { method: "PUT", body: JSON.stringify({ title: msgTitle, content: msgContent }) });
        alert(`✅ Message "${msgTitle}" updated!`);
        setEditingMsg(null);
      } else {
        await api("/saved-messages", { method: "POST", body: JSON.stringify({ title: msgTitle, content: msgContent }) });
        alert(`✅ Message "${msgTitle}" saved!`);
      }
      setMsgTitle("");
      setMsgContent("");
      fetchSavedMessages();
    } catch (err) {
      alert("❌ Failed to save message");
    }
  };
  
  const deleteSavedMessage = async (id) => {
    const msg = savedMessages.find(m => m._id === id);
    if (!confirm(`Delete "${msg?.title}"?`)) return;
    try {
      await api(`/saved-messages/${id}`, { method: "DELETE" });
      alert("✅ Message deleted");
      fetchSavedMessages();
    } catch (err) {
      alert("❌ Failed to delete");
    }
  };
  
  const useSavedMessage = (msg) => {
    setMessage(msg.content);
    setActiveTab("send");
    alert(`✅ Message "${msg.title}" loaded!`);
  };

  const saveList = async () => {
    if (!listName.trim() || !listNumbers.trim()) {
      alert("⚠️ Please enter list name and phone numbers");
      return;
    }
    
    const numbers = listNumbers.split("\n").map(n => n.trim()).filter(Boolean);
    
    if (numbers.length === 0) {
      alert("⚠️ Please add at least one phone number");
      return;
    }
    
    try {
      if (editingList) {
        await api(`/lists/${editingList._id}`, { method: "PUT", body: JSON.stringify({ name: listName, numbers, deviceId: listDevice }) });
        alert(`✅ List "${listName}" updated successfully!\n📋 ${numbers.length} contacts`);
        setEditingList(null);
      } else {
        await api("/lists", { method: "POST", body: JSON.stringify({ name: listName, numbers, deviceId: listDevice }) });
        alert(`✅ List "${listName}" created successfully!\n📋 ${numbers.length} contacts added`);
      }
      setListName("");
      setListNumbers("");
      setListDevice("");
      fetchLists();
    } catch (err) {
      alert("❌ Failed to save list. Please try again.");
    }
  };

  const deleteList = async (id) => {
    const list = lists.find(l => l._id === id);
    if (!confirm(`Delete "${list?.name}"?\n\nThis will permanently remove ${list?.numbers.length} contacts.`)) return;
    try {
      await api(`/lists/${id}`, { method: "DELETE" });
      alert("✅ List deleted successfully");
      fetchLists();
    } catch (err) {
      alert("❌ Failed to delete list");
    }
  };

  const editList = (list) => {
    setEditingList(list);
    setListName(list.name);
    setListNumbers(list.numbers.join("\n"));
    setListDevice(list.deviceId || "");
    setActiveTab("lists");
  };

  const toggleNumber = (num) => {
    setSelectedNumbers(prev => 
      prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
    );
  };
  
  const toggleAllNumbers = () => {
    const list = lists.find(l => l._id === selectedList);
    if (!list) return;
    if (selectedNumbers.length === list.numbers.length) {
      setSelectedNumbers([]);
    } else {
      setSelectedNumbers([...list.numbers]);
    }
  };
  
  const sendNow = async () => {
    if (!selectedDevice || !selectedList || !message.trim()) {
      alert("⚠️ Please select device, contact list and enter message");
      return;
    }
    
    if (selectedNumbers.length === 0) {
      alert("⚠️ Please select at least one contact");
      return;
    }
    
    const device = devices.find(d => d.id === selectedDevice);
    if (!device?.online) {
      alert("❌ Selected device is offline. Please choose an online device.");
      return;
    }
    
    setSending(true);
    try {
      await api("/send-bulk", {
        method: "POST",
        body: JSON.stringify({ deviceId: selectedDevice, phones: selectedNumbers, message, delaySeconds }),
      });
      alert(`✅ Success! ${selectedNumbers.length} messages queued\n📱 Device: ${device.name}\n⏱️ Delay: ${delaySeconds}s between messages`);
    } catch (err) {
      alert("❌ Failed to send messages. Please try again.");
    }
    setSending(false);
  };

  const scheduleJob = async () => {
    if (!selectedDevice || !selectedList || !message.trim() || !scheduleDate || !scheduleTime) {
      alert("⚠️ Please fill all fields:\n• Device\n• Contact List\n• Message\n• Date & Time");
      return;
    }
    
    if (selectedNumbers.length === 0) {
      alert("⚠️ Please select at least one contact");
      return;
    }
    
    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
    const now = new Date();
    
    if (scheduledAt <= now) {
      alert("⚠️ Please select a future date and time");
      return;
    }
    
    const device = devices.find(d => d.id === selectedDevice);
    
    try {
      await api("/jobs", {
        method: "POST",
        body: JSON.stringify({ deviceId: selectedDevice, message, numbers: selectedNumbers, delaySeconds, scheduledAt: scheduledAt.toISOString(), recurring }),
      });
      
      const recurringText = recurring === "daily" ? "\n🔁 Repeats: Every day" : recurring === "weekly" ? "\n🔁 Repeats: Every week" : "\n⏱️ One-time only";
      alert(`✅ Job Scheduled Successfully!\n\n📅 Date: ${scheduledAt.toLocaleDateString()}\n🕐 Time: ${scheduledAt.toLocaleTimeString()}${recurringText}\n📱 Device: ${device?.name}\n📋 Contacts: ${selectedNumbers.length}`);
      
      setScheduleDate("");
      setScheduleTime("");
      setRecurring("none");
      fetchJobs();
    } catch (err) {
      alert("❌ Failed to schedule job. Please try again.");
    }
  };

  const deleteJob = async (id) => {
    const job = jobs.find(j => j._id === id);
    const recurringText = job?.recurring === "daily" ? " (Daily)" : job?.recurring === "weekly" ? " (Weekly)" : "";
    if (!confirm(`Cancel this scheduled job${recurringText}?\n\nScheduled for: ${new Date(job?.scheduledAt).toLocaleString()}`)) return;
    try {
      await api(`/jobs/${id}`, { method: "DELETE" });
      alert("✅ Job cancelled successfully");
      fetchJobs();
    } catch (err) {
      alert("❌ Failed to cancel job");
    }
  };

  const onlineDevices = devices.filter(d => d.online);
  const deviceLists = selectedDevice ? lists.filter(l => !l.deviceId || l.deviceId === selectedDevice) : lists;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.logo}>💬</span>
          <div>
            <div style={s.title}>BulkSMS Pro</div>
            <div style={s.subtitle}>Admin Dashboard</div>
          </div>
        </div>
        <div style={s.headerRight}>
          <div style={s.statsBox}>
            <div style={s.statItem}>
              <div style={s.statNum}>{onlineDevices.length}</div>
              <div style={s.statLabel}>Online</div>
            </div>
            <div style={s.statDivider} />
            <div style={s.statItem}>
              <div style={s.statNum}>{devices.length}</div>
              <div style={s.statLabel}>Total Devices</div>
            </div>
            <div style={s.statDivider} />
            <div style={s.statItem}>
              <div style={s.statNum}>{historyStats.sent}</div>
              <div style={s.statLabel}>Sent</div>
            </div>
            <div style={s.statDivider} />
            <div style={s.statItem}>
              <div style={s.statNum}>{jobs.filter(j => j.status === 'pending').length}</div>
              <div style={s.statLabel}>Scheduled</div>
            </div>
          </div>
          <div style={s.userBox}>
            <span style={s.userName}>👤 {user?.name}</span>
            <button style={s.logoutBtn} onClick={() => { logout(); navigate("/login"); }}>Logout</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {[
          { key: "devices", label: "📱 Devices", count: devices.length },
          { key: "send", label: "📤 Send SMS", count: null },
          { key: "lists", label: "📋 Contact Lists", count: lists.length },
          { key: "messages", label: "💾 Saved Messages", count: savedMessages.length },
          { key: "jobs", label: "⏰ Scheduled Jobs", count: jobs.filter(j => j.status === 'pending').length },
          { key: "history", label: "📊 History", count: historyStats.total },
        ].map(t => (
          <button key={t.key} style={{ ...s.tab, ...(activeTab === t.key ? s.tabActive : {}) }} onClick={() => setActiveTab(t.key)}>
            {t.label} {t.count !== null && <span style={s.tabCount}>({t.count})</span>}
          </button>
        ))}
      </div>

      <div style={s.content}>
        {/* Devices Tab */}
        {activeTab === "devices" && (
          <div>
            <div style={s.pageHeader}>
              <h2 style={s.h2}>📱 Connected Devices</h2>
              <p style={s.pageDesc}>All devices connected to your dashboard</p>
            </div>
            
            {devices.length === 0 ? (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>📱</div>
                <div style={s.emptyTitle}>No Devices Connected</div>
                <div style={s.emptyText}>Install the app on your phones to get started</div>
              </div>
            ) : (
              <div style={s.grid}>
                {devices.map(d => (
                  <div key={d.id} style={s.deviceCard}>
                    <div style={s.deviceHeader}>
                      <div style={s.deviceIcon}>📱</div>
                      <div style={d.online ? s.statusOnline : s.statusOffline}>
                        {d.online ? "● Online" : "○ Offline"}
                      </div>
                    </div>
                    <div style={s.deviceName}>{d.name}</div>
                    <div style={s.devicePhone}>{d.phoneNumber}</div>
                    <div style={s.deviceMeta}>
                      <span>{d.network === "WiFi" ? "📶" : "📡"} {d.network}</span>
                      <span>{d.charging ? "⚡" : "🔋"} {d.battery}%</span>
                    </div>
                    {!d.online && <div style={s.lastSeen}>Last seen: {new Date(d.lastSeen).toLocaleTimeString()}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Send Tab */}
        {activeTab === "send" && (
          <div>
            <div style={s.pageHeader}>
              <h2 style={s.h2}>📤 Send Bulk SMS</h2>
              <p style={s.pageDesc}>Select contacts and send messages instantly or schedule for later</p>
            </div>

            <div style={s.formGrid}>
              <div style={s.formSection}>
                <label style={s.label}>Select Device *</label>
                <select style={s.select} value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)}>
                  <option value="">-- Choose Device --</option>
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>{d.online ? "🟢" : "🔴"} {d.name} ({d.phoneNumber})</option>
                  ))}
                </select>
              </div>

              <div style={s.formSection}>
                <label style={s.label}>Select Contact List *</label>
                <select style={s.select} value={selectedList} onChange={e => setSelectedList(e.target.value)}>
                  <option value="">-- Choose List --</option>
                  {deviceLists.map(l => (
                    <option key={l._id} value={l._id}>{l.name} ({l.numbers.length} contacts)</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Contact Selection */}
            {selectedList && (
              <div style={s.contactSelection}>
                <div style={s.contactSelectionHeader}>
                  <div>
                    <h3 style={s.h3}>📋 Select Contacts</h3>
                    <p style={s.contactSelectionDesc}>{selectedNumbers.length} of {lists.find(l => l._id === selectedList)?.numbers.length} selected</p>
                  </div>
                  <button style={s.btnSelectAll} onClick={toggleAllNumbers}>
                    {selectedNumbers.length === lists.find(l => l._id === selectedList)?.numbers.length ? "❌ Deselect All" : "✅ Select All"}
                  </button>
                </div>
                <div style={s.contactGrid}>
                  {lists.find(l => l._id === selectedList)?.numbers.map((num, i) => (
                    <label key={i} style={s.contactCheckbox}>
                      <input 
                        type="checkbox" 
                        checked={selectedNumbers.includes(num)}
                        onChange={() => toggleNumber(num)}
                        style={s.checkbox}
                      />
                      <span style={s.contactNumber}>{num}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={s.formSection}>
              <div style={s.messageHeader}>
                <label style={s.label}>Message *</label>
                {savedMessages.length > 0 && (
                  <select style={s.selectSmall} onChange={e => e.target.value && setMessage(savedMessages.find(m => m._id === e.target.value)?.content || "")}>
                    <option value="">💾 Load Saved Message</option>
                    {savedMessages.map(m => (
                      <option key={m._id} value={m._id}>{m.title}</option>
                    ))}
                  </select>
                )}
              </div>
              <textarea style={s.textarea} value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message here..." rows={6} />
              <div style={s.charCount}>{message.length} characters • ~{Math.ceil(message.length / 160) || 1} SMS per contact</div>
            </div>

            <div style={s.formSection}>
              <label style={s.label}>Delay Between Messages (seconds)</label>
              <input style={s.input} type="number" min="0" max="60" value={delaySeconds} onChange={e => setDelaySeconds(Number(e.target.value))} />
              <div style={s.hint}>💡 Recommended: 3-5 seconds to avoid spam detection</div>
            </div>

            <button style={s.btnPrimary} onClick={sendNow} disabled={sending || !selectedDevice || !selectedList || !message || selectedNumbers.length === 0}>
              {sending ? "⏳ Sending..." : `📤 Send Now to ${selectedNumbers.length} Contacts`}
            </button>

            <div style={s.dividerSection}>
              <div style={s.dividerLine} />
              <span style={s.dividerText}>OR</span>
              <div style={s.dividerLine} />
            </div>

            <div style={s.scheduleBox}>
              <h3 style={s.h3}>⏰ Schedule for Later</h3>
              <div style={s.scheduleInfo}>
                <span style={s.infoIcon}>💡</span>
                <span style={s.infoText}>Schedule messages to be sent automatically at a specific time</span>
              </div>
              <div style={s.formGrid}>
                <div style={s.formSection}>
                  <label style={s.label}>📅 Date *</label>
                  <input style={s.inputDate} type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div style={s.formSection}>
                  <label style={s.label}>🕐 Time *</label>
                  <input style={s.inputDate} type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                </div>
              </div>
              {scheduleDate && scheduleTime && (
                <div style={s.schedulePreview}>
                  📌 Will send on: <strong>{new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</strong>
                </div>
              )}
              <div style={s.formSection}>
                <label style={s.label}>🔁 Repeat Schedule</label>
                <div style={s.radioGroup}>
                  <label style={s.radioLabel}>
                    <input type="radio" name="recurring" value="none" checked={recurring === "none"} onChange={e => setRecurring(e.target.value)} style={s.radio} />
                    <span style={s.radioText}>
                      <span style={s.radioTitle}>⏱️ One Time</span>
                      <span style={s.radioDesc}>Send only once at scheduled time</span>
                    </span>
                  </label>
                  <label style={s.radioLabel}>
                    <input type="radio" name="recurring" value="daily" checked={recurring === "daily"} onChange={e => setRecurring(e.target.value)} style={s.radio} />
                    <span style={s.radioText}>
                      <span style={s.radioTitle}>📅 Daily</span>
                      <span style={s.radioDesc}>Repeat every day at same time</span>
                    </span>
                  </label>
                  <label style={s.radioLabel}>
                    <input type="radio" name="recurring" value="weekly" checked={recurring === "weekly"} onChange={e => setRecurring(e.target.value)} style={s.radio} />
                    <span style={s.radioText}>
                      <span style={s.radioTitle}>📆 Weekly</span>
                      <span style={s.radioDesc}>Repeat every week on same day & time</span>
                    </span>
                  </label>
                </div>
              </div>
              <button style={s.btnSecondary} onClick={scheduleJob} disabled={!selectedDevice || !selectedList || !message || !scheduleDate || !scheduleTime || selectedNumbers.length === 0}>
                ⏰ Schedule Job for {selectedNumbers.length} Contacts
              </button>
            </div>
          </div>
        )}

        {/* Lists Tab */}
        {activeTab === "lists" && (
          <div>
            <div style={s.pageHeader}>
              <h2 style={s.h2}>📋 Contact Lists</h2>
              <p style={s.pageDesc}>Manage your contact lists for bulk messaging</p>
            </div>

            <div style={s.twoColumn}>
              {/* Create/Edit Form */}
              <div style={s.panel}>
                <h3 style={s.h3}>{editingList ? "✏️ Edit List" : "➕ Create New List"}</h3>
                
                <div style={s.formSection}>
                  <label style={s.label}>List Name *</label>
                  <input style={s.input} value={listName} onChange={e => setListName(e.target.value)} placeholder="e.g. Customers, Friends" />
                </div>

                <div style={s.formSection}>
                  <label style={s.label}>Assign to Device (optional)</label>
                  <select style={s.select} value={listDevice} onChange={e => setListDevice(e.target.value)}>
                    <option value="">-- All Devices --</option>
                    {devices.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div style={s.formSection}>
                  <label style={s.label}>Phone Numbers (one per line) *</label>
                  <textarea style={s.textarea} value={listNumbers} onChange={e => setListNumbers(e.target.value)} placeholder="+919876543210&#10;+919123456789" rows={10} />
                  <div style={s.charCount}>{listNumbers.split("\n").filter(n => n.trim()).length} contacts</div>
                </div>

                <div style={s.btnGroup}>
                  <button style={s.btnPrimary} onClick={saveList} disabled={!listName || !listNumbers}>
                    {editingList ? "💾 Update" : "➕ Create"}
                  </button>
                  {editingList && (
                    <button style={s.btnSecondary} onClick={() => { setEditingList(null); setListName(""); setListNumbers(""); setListDevice(""); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Lists Display */}
              <div>
                <h3 style={s.h3}>Your Lists ({lists.length})</h3>
                {lists.length === 0 ? (
                  <div style={s.emptyState}>
                    <div style={s.emptyIcon}>📋</div>
                    <div style={s.emptyText}>No lists created yet</div>
                  </div>
                ) : (
                  lists.map(l => {
                    const device = devices.find(d => d.id === l.deviceId);
                    return (
                      <div key={l._id} style={s.listCard}>
                        <div style={s.listHeader}>
                          <div>
                            <div style={s.listName}>{l.name}</div>
                            <div style={s.listMeta}>
                              {l.numbers.length} contacts
                              {device && ` • 📱 ${device.name}`}
                            </div>
                          </div>
                          <div style={s.btnGroup}>
                            <button style={s.btnSmall} onClick={() => setViewingList(l)}>👁️ View</button>
                            <button style={s.btnSmall} onClick={() => editList(l)}>✏️ Edit</button>
                            <button style={s.btnSmallDanger} onClick={() => deleteList(l._id)}>🗑️</button>
                          </div>
                        </div>
                        {viewingList?._id === l._id && (
                          <div style={s.contactsPreview}>
                            <div style={s.contactsHeader}>
                              <span>Contacts Preview</span>
                              <button style={s.btnClose} onClick={() => setViewingList(null)}>✕</button>
                            </div>
                            <div style={s.contactsList}>
                              {l.numbers.slice(0, 10).map((num, i) => (
                                <div key={i} style={s.contactItem}>{num}</div>
                              ))}
                              {l.numbers.length > 10 && (
                                <div style={s.contactMore}>+{l.numbers.length - 10} more contacts</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Saved Messages Tab */}
        {activeTab === "messages" && (
          <div>
            <div style={s.pageHeader}>
              <h2 style={s.h2}>💾 Saved Messages</h2>
              <p style={s.pageDesc}>Save frequently used messages for quick access</p>
            </div>

            <div style={s.twoColumn}>
              {/* Create/Edit Form */}
              <div style={s.panel}>
                <h3 style={s.h3}>{editingMsg ? "✏️ Edit Message" : "➕ Create New Message"}</h3>
                
                <div style={s.formSection}>
                  <label style={s.label}>Message Title *</label>
                  <input style={s.input} value={msgTitle} onChange={e => setMsgTitle(e.target.value)} placeholder="e.g. Morning Greeting, Offer Alert" />
                </div>

                <div style={s.formSection}>
                  <label style={s.label}>Message Content *</label>
                  <textarea style={s.textarea} value={msgContent} onChange={e => setMsgContent(e.target.value)} placeholder="Type your message here..." rows={10} />
                  <div style={s.charCount}>{msgContent.length} characters • ~{Math.ceil(msgContent.length / 160) || 1} SMS</div>
                </div>

                <div style={s.btnGroup}>
                  <button style={s.btnPrimary} onClick={saveSavedMessage} disabled={!msgTitle || !msgContent}>
                    {editingMsg ? "💾 Update" : "➕ Save"}
                  </button>
                  {editingMsg && (
                    <button style={s.btnSecondary} onClick={() => { setEditingMsg(null); setMsgTitle(""); setMsgContent(""); }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Display */}
              <div>
                <h3 style={s.h3}>Your Saved Messages ({savedMessages.length})</h3>
                {savedMessages.length === 0 ? (
                  <div style={s.emptyState}>
                    <div style={s.emptyIcon}>💾</div>
                    <div style={s.emptyText}>No saved messages yet</div>
                  </div>
                ) : (
                  savedMessages.map(m => (
                    <div key={m._id} style={s.messageCard}>
                      <div style={s.messageCardHeader}>
                        <div style={s.messageTitle}>💬 {m.title}</div>
                        <div style={s.btnGroup}>
                          <button style={s.btnSmall} onClick={() => useSavedMessage(m)}>📤 Use</button>
                          <button style={s.btnSmall} onClick={() => { setEditingMsg(m); setMsgTitle(m.title); setMsgContent(m.content); }}>✏️ Edit</button>
                          <button style={s.btnSmallDanger} onClick={() => deleteSavedMessage(m._id)}>🗑️</button>
                        </div>
                      </div>
                      <div style={s.messageContent}>{m.content}</div>
                      <div style={s.messageMeta}>{m.content.length} chars • ~{Math.ceil(m.content.length / 160)} SMS</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div>
            <div style={s.pageHeader}>
              <h2 style={s.h2}>⏰ Scheduled Jobs</h2>
              <p style={s.pageDesc}>View and manage your scheduled messages</p>
            </div>

            {jobs.length === 0 ? (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>⏰</div>
                <div style={s.emptyTitle}>No Scheduled Jobs</div>
                <div style={s.emptyText}>Schedule messages from the Send tab</div>
              </div>
            ) : (
              jobs.map(j => {
                const device = devices.find(d => d.id === j.deviceId);
                const recurringBadge = j.recurring === "daily" ? "🔁 Daily" : j.recurring === "weekly" ? "🔁 Weekly" : "⏱️ One-time";
                return (
                  <div key={j._id} style={s.jobCard}>
                    <div style={s.jobLeft}>
                      <div style={s.jobHeader}>
                        <div style={s.jobStatus}>
                          {j.status === "pending" ? "⏳ Pending" : j.status === "running" ? "🔄 Running" : j.status === "done" ? "✅ Done" : "❌ Failed"}
                        </div>
                        <div style={s.recurringBadge}>{recurringBadge}</div>
                      </div>
                      <div style={s.jobMeta}>
                        📱 {device?.name || "Unknown"} • {j.numbers.length} contacts • {j.delaySeconds}s delay
                      </div>
                      <div style={s.jobTime}>🕐 Scheduled: {new Date(j.scheduledAt).toLocaleString()}</div>
                      {j.lastRun && <div style={s.jobLastRun}>✓ Last run: {new Date(j.lastRun).toLocaleString()}</div>}
                      <div style={s.jobMsg}>"{j.message.slice(0, 100)}{j.message.length > 100 ? "..." : ""}"</div>
                    </div>
                    {j.status === "pending" && (
                      <button style={s.btnSmallDanger} onClick={() => deleteJob(j._id)}>Cancel</button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
        
        {/* History Tab */}
        {activeTab === "history" && (
          <div>
            <div style={s.pageHeader}>
              <div>
                <h2 style={s.h2}>📊 Message History</h2>
                <p style={s.pageDesc}>Track all sent messages and their status</p>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div style={s.statsGrid}>
              <div style={s.statCard}>
                <div style={s.statCardIcon}>✅</div>
                <div>
                  <div style={s.statCardNum}>{historyStats.sent}</div>
                  <div style={s.statCardLabel}>Successfully Sent</div>
                </div>
              </div>
              <div style={s.statCard}>
                <div style={s.statCardIconDanger}>❌</div>
                <div>
                  <div style={s.statCardNum}>{historyStats.failed}</div>
                  <div style={s.statCardLabel}>Failed</div>
                </div>
              </div>
              <div style={s.statCard}>
                <div style={s.statCardIcon}>📨</div>
                <div>
                  <div style={s.statCardNum}>{historyStats.total}</div>
                  <div style={s.statCardLabel}>Total Messages</div>
                </div>
              </div>
              <div style={s.statCard}>
                <div style={s.statCardIcon}>📈</div>
                <div>
                  <div style={s.statCardNum}>{historyStats.total > 0 ? Math.round((historyStats.sent / historyStats.total) * 100) : 0}%</div>
                  <div style={s.statCardLabel}>Success Rate</div>
                </div>
              </div>
            </div>

            {history.length === 0 ? (
              <div style={s.emptyState}>
                <div style={s.emptyIcon}>📊</div>
                <div style={s.emptyTitle}>No Message History</div>
                <div style={s.emptyText}>Send some messages to see history here</div>
              </div>
            ) : (
              <div style={s.historyTable}>
                <div style={s.historyHeader}>
                  <div style={s.historyCol1}>Time</div>
                  <div style={s.historyCol2}>Device</div>
                  <div style={s.historyCol3}>Phone Number</div>
                  <div style={s.historyCol4}>Message</div>
                  <div style={s.historyCol5}>Status</div>
                </div>
                {history.map((h, i) => (
                  <div key={i} style={s.historyRow}>
                    <div style={s.historyCol1}>
                      <div style={s.historyTime}>{new Date(h.sentAt).toLocaleTimeString()}</div>
                      <div style={s.historyDate}>{new Date(h.sentAt).toLocaleDateString()}</div>
                    </div>
                    <div style={s.historyCol2}>
                      <div style={s.historyDevice}>📱 {h.deviceName}</div>
                    </div>
                    <div style={s.historyCol3}>
                      <div style={s.historyPhone}>{h.phone}</div>
                    </div>
                    <div style={s.historyCol4}>
                      <div style={s.historyMsg}>{h.message.slice(0, 50)}{h.message.length > 50 ? "..." : ""}</div>
                    </div>
                    <div style={s.historyCol5}>
                      {h.status === "sent" ? (
                        <span style={s.statusSuccess}>✅ Sent</span>
                      ) : (
                        <span style={s.statusFailed}>❌ Failed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#e2e8f0", fontFamily: "'Inter', 'Segoe UI', sans-serif" },
  
  // Header
  header: { background: "#1e293b", borderBottom: "1px solid #334155", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" },
  headerLeft: { display: "flex", alignItems: "center", gap: 16 },
  logo: { fontSize: 36 },
  title: { fontSize: 24, fontWeight: "800", color: "#f1f5f9", letterSpacing: "-0.5px" },
  subtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },
  headerRight: { display: "flex", alignItems: "center", gap: 20 },
  statsBox: { display: "flex", background: "#0f172a", borderRadius: 12, padding: "12px 16px", gap: 16, border: "1px solid #334155" },
  statItem: { textAlign: "center" },
  statNum: { fontSize: 20, fontWeight: "700", color: "#6366f1" },
  statLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },
  statDivider: { width: 1, background: "#334155" },
  userBox: { display: "flex", alignItems: "center", gap: 12 },
  userName: { fontSize: 14, color: "#94a3b8" },
  logoutBtn: { background: "#ef4444", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: "600", transition: "all 0.2s" },
  
  // Tabs
  tabs: { display: "flex", background: "#1e293b", borderBottom: "1px solid #334155", padding: "0 32px" },
  tab: { flex: 1, padding: "16px 20px", background: "none", border: "none", color: "#64748b", fontSize: 14, cursor: "pointer", fontWeight: "500", transition: "all 0.2s", borderBottom: "3px solid transparent" },
  tabActive: { color: "#6366f1", borderBottom: "3px solid #6366f1", fontWeight: "700" },
  tabCount: { fontSize: 12, opacity: 0.7 },
  
  // Content
  content: { padding: 32, maxWidth: 1400, margin: "0 auto" },
  pageHeader: { marginBottom: 32 },
  h2: { fontSize: 28, fontWeight: "800", color: "#f1f5f9", margin: 0, marginBottom: 8 },
  h3: { fontSize: 18, fontWeight: "700", color: "#f1f5f9", margin: 0, marginBottom: 16 },
  pageDesc: { fontSize: 14, color: "#64748b", margin: 0 },
  
  // Grid
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
  
  // Device Card
  deviceCard: { background: "#1e293b", borderRadius: 16, padding: 20, border: "1px solid #334155", transition: "all 0.2s", cursor: "pointer" },
  deviceHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  deviceIcon: { fontSize: 32 },
  deviceName: { fontSize: 18, fontWeight: "700", color: "#f1f5f9", marginBottom: 4 },
  devicePhone: { fontSize: 14, color: "#6366f1", marginBottom: 8 },
  deviceMeta: { fontSize: 12, color: "#64748b", display: "flex", gap: 12 },
  statusOnline: { fontSize: 12, fontWeight: "600", color: "#10b981" },
  statusOffline: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  lastSeen: { fontSize: 11, color: "#475569", marginTop: 8 },
  
  // Forms
  formSection: { marginBottom: 20 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 },
  label: { display: "block", fontSize: 13, fontWeight: "600", color: "#cbd5e1", marginBottom: 8 },
  input: { width: "100%", padding: "12px 16px", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 14, boxSizing: "border-box", transition: "all 0.2s" },
  select: { width: "100%", padding: "12px 16px", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 14, boxSizing: "border-box" },
  selectSmall: { padding: "8px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 12, cursor: "pointer" },
  textarea: { width: "100%", padding: "12px 16px", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 14, boxSizing: "border-box", fontFamily: "inherit", resize: "vertical", minHeight: 100 },
  charCount: { fontSize: 12, color: "#64748b", textAlign: "right", marginTop: 6 },
  hint: { fontSize: 12, color: "#64748b", marginTop: 6 },
  messageHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  
  // Buttons
  btnPrimary: { width: "100%", padding: "14px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: "600", cursor: "pointer", transition: "all 0.2s" },
  btnSecondary: { width: "100%", padding: "14px", background: "#334155", color: "#f1f5f9", border: "none", borderRadius: 10, fontSize: 15, fontWeight: "600", cursor: "pointer", transition: "all 0.2s" },
  btnGroup: { display: "flex", gap: 10 },
  btnSmall: { padding: "6px 12px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: "600" },
  btnSmallDanger: { padding: "6px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: "600" },
  btnClose: { background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18 },
  
  // Divider
  dividerSection: { display: "flex", alignItems: "center", gap: 16, margin: "32px 0" },
  dividerLine: { flex: 1, height: 1, background: "#334155" },
  dividerText: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  
  // Schedule Box
  scheduleBox: { background: "#1e293b", borderRadius: 16, padding: 24, border: "1px solid #334155" },
  scheduleInfo: { display: "flex", alignItems: "center", gap: 10, background: "#0f172a", padding: "12px 16px", borderRadius: 10, marginBottom: 20, border: "1px solid #334155" },
  infoIcon: { fontSize: 20 },
  infoText: { fontSize: 13, color: "#94a3b8" },
  inputDate: { width: "100%", padding: "12px 16px", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#f1f5f9", fontSize: 14, boxSizing: "border-box", transition: "all 0.2s", cursor: "pointer" },
  schedulePreview: { background: "#1e1b4b", border: "1px solid #4338ca", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#a5b4fc", marginBottom: 20, textAlign: "center" },
  radioGroup: { display: "flex", flexDirection: "column", gap: 12 },
  radioLabel: { display: "flex", alignItems: "flex-start", gap: 12, background: "#0f172a", padding: "14px 16px", borderRadius: 10, border: "1px solid #334155", cursor: "pointer", transition: "all 0.2s" },
  radio: { marginTop: 2, cursor: "pointer", accentColor: "#6366f1" },
  radioText: { display: "flex", flexDirection: "column", gap: 4 },
  radioTitle: { fontSize: 14, fontWeight: "600", color: "#f1f5f9" },
  radioDesc: { fontSize: 12, color: "#64748b" },
  
  // Two Column
  twoColumn: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 },
  panel: { background: "#1e293b", borderRadius: 16, padding: 24, border: "1px solid #334155", height: "fit-content" },
  
  // List Card
  listCard: { background: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12, border: "1px solid #334155" },
  listHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  listName: { fontSize: 16, fontWeight: "700", color: "#f1f5f9", marginBottom: 4 },
  listMeta: { fontSize: 12, color: "#64748b" },
  
  // Contacts Preview
  contactsPreview: { marginTop: 16, background: "#0f172a", borderRadius: 8, padding: 12, border: "1px solid #334155" },
  contactsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 12, fontWeight: "600", color: "#94a3b8" },
  contactsList: { maxHeight: 200, overflowY: "auto" },
  contactItem: { padding: "6px 8px", fontSize: 13, color: "#cbd5e1", borderBottom: "1px solid #1e293b" },
  contactMore: { padding: "8px", fontSize: 12, color: "#64748b", textAlign: "center", fontStyle: "italic" },
  
  // Job Card
  jobCard: { background: "#1e293b", borderRadius: 12, padding: 20, marginBottom: 16, border: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  jobLeft: { flex: 1 },
  jobHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 8 },
  jobStatus: { fontSize: 15, fontWeight: "700", color: "#f1f5f9" },
  recurringBadge: { fontSize: 11, fontWeight: "600", color: "#6366f1", background: "#1e1b4b", padding: "4px 10px", borderRadius: 12, border: "1px solid #4338ca" },
  jobMeta: { fontSize: 13, color: "#64748b", marginBottom: 6 },
  jobTime: { fontSize: 13, color: "#6366f1", marginBottom: 6 },
  jobLastRun: { fontSize: 12, color: "#10b981", marginBottom: 8 },
  jobMsg: { fontSize: 14, color: "#94a3b8", fontStyle: "italic", lineHeight: 1.5 },
  
  // Empty State
  emptyState: { textAlign: "center", padding: "60px 20px", background: "#1e293b", borderRadius: 16, border: "1px solid #334155" },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#f1f5f9", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#64748b" },
  
  // Stats Grid
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 32 },
  statCard: { background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderRadius: 16, padding: 24, border: "1px solid #334155", display: "flex", alignItems: "center", gap: 20 },
  statCardIcon: { fontSize: 48, background: "linear-gradient(135deg, #10b981, #059669)", width: 80, height: 80, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" },
  statCardIconDanger: { fontSize: 48, background: "linear-gradient(135deg, #ef4444, #dc2626)", width: 80, height: 80, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" },
  statCardNum: { fontSize: 32, fontWeight: "800", color: "#f1f5f9" },
  statCardLabel: { fontSize: 13, color: "#64748b", marginTop: 4 },
  
  // History Table
  historyTable: { background: "#1e293b", borderRadius: 16, border: "1px solid #334155", overflow: "hidden" },
  historyHeader: { display: "grid", gridTemplateColumns: "140px 180px 180px 1fr 120px", padding: "16px 20px", background: "#0f172a", borderBottom: "1px solid #334155", fontWeight: "700", fontSize: 13, color: "#94a3b8" },
  historyRow: { display: "grid", gridTemplateColumns: "140px 180px 180px 1fr 120px", padding: "16px 20px", borderBottom: "1px solid #334155", transition: "all 0.2s" },
  historyCol1: { display: "flex", flexDirection: "column", gap: 2 },
  historyCol2: {},
  historyCol3: {},
  historyCol4: {},
  historyCol5: {},
  historyTime: { fontSize: 14, fontWeight: "600", color: "#f1f5f9" },
  historyDate: { fontSize: 11, color: "#64748b" },
  historyDevice: { fontSize: 13, color: "#cbd5e1" },
  historyPhone: { fontSize: 13, color: "#6366f1", fontWeight: "600" },
  historyMsg: { fontSize: 13, color: "#94a3b8", lineHeight: 1.4 },
  statusSuccess: { fontSize: 12, fontWeight: "600", color: "#10b981", background: "#022c22", padding: "6px 12px", borderRadius: 8, display: "inline-block" },
  statusFailed: { fontSize: 12, fontWeight: "600", color: "#ef4444", background: "#2c0a0a", padding: "6px 12px", borderRadius: 8, display: "inline-block" },
  
  // Contact Selection
  contactSelection: { background: "#1e293b", borderRadius: 16, padding: 24, marginBottom: 20, border: "1px solid #334155" },
  contactSelectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  contactSelectionDesc: { fontSize: 13, color: "#64748b", margin: 0, marginTop: 4 },
  btnSelectAll: { padding: "10px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: "600", cursor: "pointer" },
  contactGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, maxHeight: 300, overflowY: "auto", padding: 4 },
  contactCheckbox: { display: "flex", alignItems: "center", gap: 10, background: "#0f172a", padding: "10px 14px", borderRadius: 8, border: "1px solid #334155", cursor: "pointer", transition: "all 0.2s" },
  checkbox: { width: 18, height: 18, cursor: "pointer", accentColor: "#6366f1" },
  contactNumber: { fontSize: 13, color: "#cbd5e1", fontWeight: "500" },
  
  // Message Card
  messageCard: { background: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12, border: "1px solid #334155" },
  messageCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  messageTitle: { fontSize: 16, fontWeight: "700", color: "#f1f5f9" },
  messageContent: { fontSize: 14, color: "#94a3b8", lineHeight: 1.6, marginBottom: 8, whiteSpace: "pre-wrap" },
  messageMeta: { fontSize: 12, color: "#64748b" },
};
