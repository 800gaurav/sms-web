import React, { useEffect, useState } from 'react';
import { useAuth, getToken } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const API = "http://10.54.46.126:5000";

// --- Helper Components for Cleaner JSX ---
const TabButton = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
      ${active 
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
    {count !== undefined && count > 0 && (
      <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${active ? 'bg-white/20' : 'bg-gray-200'}`}>
        {count}
      </span>
    )}
  </button>
);

const StatCard = ({ icon, value, label, color = 'primary' }) => (
  <div className="bg-white backdrop-blur-sm rounded-2xl border border-gray-200 p-5 flex items-center gap-4 transition-all hover:shadow-lg shadow-sm">
    <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center text-2xl`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  </div>
);

const EmptyState = ({ icon, title, description }) => (
  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200">
    <div className="text-5xl mb-4">{icon}</div>
    <div className="text-lg font-semibold text-gray-900 mb-1">{title}</div>
    <div className="text-sm text-gray-600">{description}</div>
  </div>
);

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State variables
  const [devices, setDevices] = useState([]);
  const [lists, setLists] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [savedMessages, setSavedMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyStats, setHistoryStats] = useState({ sent: 0, failed: 0, total: 0 });
  const [activeTab, setActiveTab] = useState("devices");
  
  // Send form state
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedList, setSelectedList] = useState("");
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [message, setMessage] = useState("");
  const [delaySeconds, setDelaySeconds] = useState(3);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [recurring, setRecurring] = useState("none");
  const [sending, setSending] = useState(false);

  // List form state
  const [listName, setListName] = useState("");
  const [listNumbers, setListNumbers] = useState("");
  const [listDevice, setListDevice] = useState("");
  const [editingList, setEditingList] = useState(null);
  const [viewingList, setViewingList] = useState(null);
  
  // Saved message form state
  const [msgTitle, setMsgTitle] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [editingMsg, setEditingMsg] = useState(null);
  
  // Loading states
  const [loading, setLoading] = useState({
    devices: true,
    lists: true,
    jobs: true,
    messages: true,
    history: true,
  });

  // --- API Helper ---
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

  // --- Data Fetching ---
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

  useEffect(() => {
    fetchDevices();
    fetchLists();
    fetchJobs();
    fetchSavedMessages();
    fetchHistory();
    const interval = setInterval(() => {
      fetchDevices();
      fetchJobs();
      fetchHistory();
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (selectedList) {
      const list = lists.find(l => l._id === selectedList);
      if (list) setSelectedNumbers(list.numbers);
    } else {
      setSelectedNumbers([]);
    }
  }, [selectedList, lists]);

  // --- Core Functions ---
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

  // --- Render Logic ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-800 font-sans">
      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          loading: { iconTheme: { primary: '#3b82f6', secondary: '#fff' } },
        }}
      />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">💬</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">BulkSMS Pro</h1>
              <p className="text-xs text-gray-500">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{onlineDevices.length}</div>
                <div className="text-xs text-gray-600">Online</div>
              </div>
              <div className="w-px bg-gray-300"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{devices.length}</div>
                <div className="text-xs text-gray-600">Devices</div>
              </div>
              <div className="w-px bg-gray-300"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{historyStats.sent}</div>
                <div className="text-xs text-gray-600">Sent</div>
              </div>
              <div className="w-px bg-gray-300"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-amber-600">{jobs.filter(j => j.status === 'pending').length}</div>
                <div className="text-xs text-gray-600">Scheduled</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
              <span className="text-sm text-gray-700 font-medium">👤 {user?.name}</span>
              <button onClick={() => {
                if (confirm('Are you sure you want to logout?')) {
                  logout();
                  navigate("/login");
                  toast.success('Logged out successfully!');
                }
              }} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-red-200">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 sticky top-[73px] z-10 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3 no-scrollbar">
            <TabButton active={activeTab === "devices"} onClick={() => setActiveTab("devices")} icon="📱" label="Devices" count={devices.length} />
            <TabButton active={activeTab === "send"} onClick={() => setActiveTab("send")} icon="📤" label="Send SMS" />
            <TabButton active={activeTab === "lists"} onClick={() => setActiveTab("lists")} icon="📋" label="Contact Lists" count={lists.length} />
            <TabButton active={activeTab === "messages"} onClick={() => setActiveTab("messages")} icon="💾" label="Saved Messages" count={savedMessages.length} />
            <TabButton active={activeTab === "jobs"} onClick={() => setActiveTab("jobs")} icon="⏰" label="Scheduled Jobs" count={jobs.filter(j => j.status === 'pending').length} />
            <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} icon="📊" label="History" count={historyStats.total} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Devices Tab */}
        {activeTab === "devices" && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Connected Devices</h2>
              <p className="text-gray-600 mt-1">All devices connected to your dashboard</p>
            </div>
            {devices.length === 0 ? (
              <EmptyState icon="📱" title="No Devices Connected" description="Install the app on your phones to get started" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map(d => (
                  <div key={d.id} className="bg-white backdrop-blur-sm rounded-2xl border border-gray-200 p-5 transition-all hover:border-blue-300 hover:shadow-lg shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-3xl">📱</div>
                      <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${d.online ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {d.online ? "● Online" : "○ Offline"}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{d.name}</h3>
                    <p className="text-blue-600 text-sm mb-3">{d.phoneNumber}</p>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{d.network === "WiFi" ? "📶" : "📡"} {d.network}</span>
                      <span>{d.charging ? "⚡" : "🔋"} {d.battery}%</span>
                    </div>
                    {!d.online && <p className="text-xs text-gray-500 mt-3">Last seen: {new Date(d.lastSeen).toLocaleTimeString()}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Send Tab */}
        {activeTab === "send" && (
          <div className="animate-fadeIn max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Send Bulk SMS</h2>
              <p className="text-gray-600 mt-1">Select contacts and send messages instantly or schedule for later</p>
            </div>

            <div className="space-y-6">
              {/* Device & List Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Device *</label>
                  <select className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)}>
                    <option value="">-- Choose Device --</option>
                    {devices.map(d => (
                      <option key={d.id} value={d.id}>{d.online ? "🟢" : "🔴"} {d.name} ({d.phoneNumber})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Contact List *</label>
                  <select className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 shadow-sm" value={selectedList} onChange={e => setSelectedList(e.target.value)}>
                    <option value="">-- Choose List --</option>
                    {deviceLists.map(l => (
                      <option key={l._id} value={l._id}>{l.name} ({l.numbers.length} contacts)</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Selection */}
              {selectedList && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <span className="text-2xl">📋</span>
                        Select Contacts to Send Message
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-bold text-blue-600">{selectedNumbers.length}</span> of {lists.find(l => l._id === selectedList)?.numbers.length} contacts selected
                      </p>
                    </div>
                    <button onClick={toggleAllNumbers} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold transition-colors text-white shadow-md">
                      {selectedNumbers.length === lists.find(l => l._id === selectedList)?.numbers.length ? "❌ Deselect All" : "✅ Select All"}
                    </button>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 border border-blue-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-2">
                      {lists.find(l => l._id === selectedList)?.numbers.map((num, i) => (
                        <label key={i} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                          selectedNumbers.includes(num) 
                            ? 'bg-blue-50 border-blue-400 shadow-sm' 
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}>
                          <input 
                            type="checkbox" 
                            checked={selectedNumbers.includes(num)} 
                            onChange={() => toggleNumber(num)} 
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer" 
                          />
                          <span className={`text-sm font-medium ${
                            selectedNumbers.includes(num) ? 'text-blue-700' : 'text-gray-700'
                          }`}>{num}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">💡 Tip:</span> Select only those contacts you want to send message to. Unselected contacts will be skipped.
                    </p>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">Message *</label>
                  {savedMessages.length > 0 && (
                    <select className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm shadow-sm" onChange={e => e.target.value && setMessage(savedMessages.find(m => m._id === e.target.value)?.content || "")}>
                      <option value="">💾 Load Saved Message</option>
                      {savedMessages.map(m => (
                        <option key={m._id} value={m._id}>{m.title}</option>
                      ))}
                    </select>
                  )}
                </div>
                <textarea className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 shadow-sm" rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message here..." />
                <div className="text-right text-xs text-gray-500 mt-1">{message.length} characters • ~{Math.ceil(message.length / 160) || 1} SMS per contact</div>
              </div>

              {/* Delay */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delay Between Messages (seconds)</label>
                <input type="number" min="0" max="60" className="w-full md:w-48 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 shadow-sm" value={delaySeconds} onChange={e => setDelaySeconds(Number(e.target.value))} />
                <p className="text-xs text-gray-500 mt-1">💡 Recommended: 3-5 seconds to avoid spam detection</p>
              </div>

              <button onClick={sendNow} disabled={sending || !selectedDevice || !selectedList || !message || selectedNumbers.length === 0} className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-white shadow-lg transition-all">
                {sending ? "⏳ Sending..." : `📤 Send Now to ${selectedNumbers.length} Contacts`}
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-3 bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-500">OR</span></div>
              </div>

              {/* Schedule Section */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-300 p-6 shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">⏰</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Schedule Automatic Messages</h3>
                    <p className="text-sm text-gray-600">Set it once and forget! Messages will be sent automatically in background</p>
                  </div>
                </div>
                
                {/* Info Box */}
                <div className="bg-white rounded-xl p-4 mb-6 border-2 border-amber-200">
                  <div className="flex gap-3">
                    <span className="text-2xl">🚀</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">How Automation Works:</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>✅ <strong>Daily:</strong> Message will be sent every day at the same time automatically</li>
                        <li>✅ <strong>Weekly:</strong> Message will be sent every week on the same day & time</li>
                        <li>✅ <strong>Background Process:</strong> No need to keep app open, server handles everything</li>
                        <li>✅ <strong>Multiple Schedules:</strong> You can create multiple schedules for different phones</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Schedule Type Tabs */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">🔁 Select Schedule Type:</label>
                  <div className="flex gap-3 bg-white p-2 rounded-xl border-2 border-amber-200 shadow-sm">
                    {['none', 'daily', 'weekly'].map(type => (
                      <button 
                        key={type} 
                        onClick={() => setRecurring(type)} 
                        className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                          recurring === type 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg scale-105' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {type === 'none' && '⏱️ One Time Only'}
                        {type === 'daily' && '📅 Daily Auto'}
                        {type === 'weekly' && '📆 Weekly Auto'}
                      </button>
                    ))}
                  </div>
                  
                  {/* Description based on selection */}
                  <div className="mt-3 p-3 bg-white rounded-lg border border-amber-200">
                    {recurring === 'none' && (
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">⏱️ One Time:</span> Message will be sent only once at the scheduled time. Not repeated.
                      </p>
                    )}
                    {recurring === 'daily' && (
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">📅 Daily Automation:</span> Message will be sent <strong>every day</strong> at the same time automatically. Perfect for daily reminders!
                      </p>
                    )}
                    {recurring === 'weekly' && (
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">📆 Weekly Automation:</span> Message will be sent <strong>every week</strong> on the same day and time. Great for weekly updates!
                      </p>
                    )}
                  </div>
                </div>

                {/* Date & Time Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Select Date *</label>
                    <input 
                      type="date" 
                      className="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-xl text-gray-900 shadow-sm font-medium" 
                      value={scheduleDate} 
                      onChange={e => setScheduleDate(e.target.value)} 
                      min={new Date().toISOString().split('T')[0]} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">🕐 Select Time *</label>
                    <input 
                      type="time" 
                      className="w-full px-4 py-3 bg-white border-2 border-amber-200 rounded-xl text-gray-900 shadow-sm font-medium" 
                      value={scheduleTime} 
                      onChange={e => setScheduleTime(e.target.value)} 
                    />
                  </div>
                </div>
                
                {/* Preview */}
                {scheduleDate && scheduleTime && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📌</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Scheduled For:</p>
                        <p className="text-lg font-bold text-green-700">
                          {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
                        </p>
                        {recurring !== 'none' && (
                          <p className="text-sm text-green-600 mt-1">
                            🔁 Will repeat {recurring === 'daily' ? 'every day' : 'every week'} automatically
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Schedule Button */}
                <button 
                  onClick={scheduleJob} 
                  disabled={!selectedDevice || !selectedList || !message || !scheduleDate || !scheduleTime || selectedNumbers.length === 0} 
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white shadow-lg transition-all text-lg"
                >
                  {recurring === 'none' ? '⏰' : '🔁'} Schedule {recurring !== 'none' ? 'Automatic' : ''} Job for {selectedNumbers.length} Contacts
                </button>
                
                {/* Additional Info */}
                <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200">
                  <p className="text-xs text-gray-600">
                    <strong>🔒 Note:</strong> Scheduled jobs run on server. No need to keep browser or app open. You can create multiple schedules for different devices and contact lists.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lists Tab */}
        {activeTab === "lists" && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Contact Lists</h2>
              <p className="text-gray-600 mt-1">Manage your contact lists for bulk messaging</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingList ? "✏️ Edit List" : "➕ Create New List"}</h3>
                <div className="space-y-4">
                  <input type="text" placeholder="List Name *" className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 shadow-sm" value={listName} onChange={e => setListName(e.target.value)} />
                  <select className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 shadow-sm" value={listDevice} onChange={e => setListDevice(e.target.value)}>
                    <option value="">-- All Devices (Optional) --</option>
                    {devices.map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                  </select>
                  <textarea placeholder="Phone Numbers (one per line) *" rows={8} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 font-mono shadow-sm" value={listNumbers} onChange={e => setListNumbers(e.target.value)} />
                  <div className="flex gap-3">
                    <button onClick={saveList} disabled={!listName || !listNumbers} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-semibold transition-colors text-white shadow-sm">{editingList ? "💾 Update" : "➕ Create"}</button>
                    {editingList && <button onClick={() => { setEditingList(null); setListName(""); setListNumbers(""); setListDevice(""); }} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors text-gray-700">Cancel</button>}
                  </div>
                </div>
              </div>
              {/* List Display */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Lists ({lists.length})</h3>
                <div className="space-y-4">
                  {lists.length === 0 ? <EmptyState icon="📋" title="No Lists Created" description="Create your first contact list to get started" /> : lists.map(l => {
                    const device = devices.find(d => d.id === l.deviceId);
                    return (
                      <div key={l._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                          <div><h4 className="text-lg font-semibold text-gray-900">{l.name}</h4><p className="text-sm text-gray-600">{l.numbers.length} contacts {device && `• 📱 ${device.name}`}</p></div>
                          <div className="flex gap-2">
                            <button onClick={() => setViewingList(viewingList?._id === l._id ? null : l)} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors text-gray-700">👁️ {viewingList?._id === l._id ? 'Hide' : 'View'}</button>
                            <button onClick={() => editList(l)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors text-white">✏️ Edit</button>
                            <button onClick={() => deleteList(l._id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm transition-colors border border-red-200">🗑️</button>
                          </div>
                        </div>
                        {viewingList?._id === l._id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center mb-2"><span className="text-sm font-medium text-gray-700">Contacts Preview</span></div>
                            <div className="max-h-48 overflow-y-auto space-y-1">
                              {l.numbers.slice(0, 10).map((num, i) => (<div key={i} className="text-sm text-gray-600 py-1 border-b border-gray-100">{num}</div>))}
                              {l.numbers.length > 10 && <div className="text-sm text-gray-500 italic pt-1">+{l.numbers.length - 10} more contacts</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Saved Messages Tab */}
        {activeTab === "messages" && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Saved Messages</h2>
              <p className="text-gray-600 mt-1">Save frequently used messages for quick access</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingMsg ? "✏️ Edit Message" : "➕ Create New Message"}</h3>
                <div className="space-y-4">
                  <input type="text" placeholder="Message Title *" className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 shadow-sm" value={msgTitle} onChange={e => setMsgTitle(e.target.value)} />
                  <textarea placeholder="Message Content *" rows={6} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 shadow-sm" value={msgContent} onChange={e => setMsgContent(e.target.value)} />
                  <div className="flex gap-3">
                    <button onClick={saveSavedMessage} disabled={!msgTitle || !msgContent} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-semibold transition-colors text-white shadow-sm">{editingMsg ? "💾 Update" : "➕ Save"}</button>
                    {editingMsg && <button onClick={() => { setEditingMsg(null); setMsgTitle(""); setMsgContent(""); }} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors text-gray-700">Cancel</button>}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Saved Messages ({savedMessages.length})</h3>
                <div className="space-y-4">
                  {savedMessages.length === 0 ? <EmptyState icon="💾" title="No Saved Messages" description="Save your first message template" /> : savedMessages.map(m => (
                    <div key={m._id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                      <div className="flex justify-between items-start flex-wrap gap-2 mb-3"><h4 className="text-lg font-semibold text-gray-900">💬 {m.title}</h4><div className="flex gap-2"><button onClick={() => useSavedMessage(m)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors text-white">📤 Use</button><button onClick={() => { setEditingMsg(m); setMsgTitle(m.title); setMsgContent(m.content); }} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors text-gray-700">✏️ Edit</button><button onClick={() => deleteSavedMessage(m._id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm transition-colors border border-red-200">🗑️</button></div></div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap mb-2">{m.content}</p>
                      <p className="text-xs text-gray-500">{m.content.length} chars • ~{Math.ceil(m.content.length / 160)} SMS</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Scheduled Jobs</h2>
              <p className="text-gray-600 mt-1">View and manage your scheduled messages</p>
            </div>
            {jobs.length === 0 ? <EmptyState icon="⏰" title="No Scheduled Jobs" description="Schedule messages from the Send tab" /> : (
              <div className="space-y-4">
                {jobs.map(j => {
                  const device = devices.find(d => d.id === j.deviceId);
                  const recurringBadge = j.recurring === "daily" ? "🔁 Daily" : j.recurring === "weekly" ? "🔁 Weekly" : "⏱️ One-time";
                  return (
                    <div key={j._id} className="bg-white rounded-2xl border border-gray-200 p-5 flex justify-between items-start flex-wrap gap-4 shadow-sm">
                      <div><div className="flex items-center gap-3 mb-2 flex-wrap"><span className="text-gray-900 font-medium">{recurringBadge}</span><span className={`text-xs px-2 py-1 rounded-full ${j.status === "pending" ? 'bg-yellow-100 text-yellow-700' : j.status === "running" ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{j.status === "pending" ? "⏳ Pending" : j.status === "running" ? "🔄 Running" : "✅ Done"}</span></div><p className="text-sm text-gray-600">📱 {device?.name || "Unknown"} • {j.numbers.length} contacts • {j.delaySeconds}s delay</p><p className="text-sm text-blue-600 mt-1">🕐 Scheduled: {new Date(j.scheduledAt).toLocaleString()}</p>{j.lastRun && <p className="text-xs text-green-600 mt-1">✓ Last run: {new Date(j.lastRun).toLocaleString()}</p>}<p className="text-gray-700 text-sm mt-2 italic">"{j.message.slice(0, 100)}{j.message.length > 100 ? "..." : ""}"</p></div>
                      {j.status === "pending" && <button onClick={() => deleteJob(j._id)} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors border border-red-200">Cancel</button>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Message History</h2>
              <p className="text-gray-600 mt-1">Track all sent messages and their status</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon="✅" value={historyStats.sent} label="Successfully Sent" color="green" />
              <StatCard icon="❌" value={historyStats.failed} label="Failed" color="red" />
              <StatCard icon="📨" value={historyStats.total} label="Total Messages" color="blue" />
              <StatCard icon="📈" value={`${historyStats.total > 0 ? Math.round((historyStats.sent / historyStats.total) * 100) : 0}%`} label="Success Rate" color="purple" />
            </div>
            {history.length === 0 ? <EmptyState icon="📊" title="No Message History" description="Send some messages to see history here" /> : (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="text-left p-4 font-medium text-gray-700">Time</th><th className="text-left p-4 font-medium text-gray-700">Device</th><th className="text-left p-4 font-medium text-gray-700">Phone</th><th className="text-left p-4 font-medium text-gray-700">Message</th><th className="text-left p-4 font-medium text-gray-700">Status</th></tr></thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50"><td className="p-4"><div className="font-medium text-gray-900">{new Date(h.sentAt).toLocaleTimeString()}</div><div className="text-xs text-gray-500">{new Date(h.sentAt).toLocaleDateString()}</div></td><td className="p-4"><div className="flex items-center gap-2 text-gray-700"><span>📱</span><span>{h.deviceName}</span></div></td><td className="p-4 font-mono text-blue-600">{h.phone}</td><td className="p-4 text-gray-700 max-w-xs truncate">{h.message}</td><td className="p-4">{h.status === "sent" ? <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">✅ Sent</span> : <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">❌ Failed</span>}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}