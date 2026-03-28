import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  // Fetch devices
  const fetchDevices = async () => {
    const res = await axios.get("https://sms-backend-eqqt.onrender.com/devices");
    setDevices(res.data);
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 3000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async () => {
    await axios.post("https://sms-backend-eqqt.onrender.com/send", {
      deviceId,
      phone,
      message,
    });

    alert("Message Sent!");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>SMS Dashboard</h2>

      <h4>Connected Devices:</h4>
      <ul>
        {devices.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>

      <select onChange={(e) => setDeviceId(e.target.value)}>
        <option>Select Device</option>
        {devices.map((d) => (
          <option key={d}>{d}</option>
        ))}
      </select>

      <br /><br />

      <input
        placeholder="Phone Number"
        onChange={(e) => setPhone(e.target.value)}
      />

      <br /><br />

      <textarea
        placeholder="Message"
        onChange={(e) => setMessage(e.target.value)}
      />

      <br /><br />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
