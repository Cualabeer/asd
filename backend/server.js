<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pro Backend Dashboard</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; color: #333; }
  h1 { color: #222; }
  section { background: #fff; padding: 15px; margin-bottom: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
  pre { background: #eee; padding: 10px; overflow-x: auto; border-radius: 5px; }
  button { padding: 8px 12px; margin-top: 5px; cursor: pointer; border-radius: 5px; border: none; background: #007BFF; color: #fff; }
  button:hover { background: #0056b3; }
</style>
</head>
<body>

<h1>🚀 Mobile Mechanic Backend Dashboard</h1>

<section>
  <h2>MongoDB Collections</h2>
  <pre id="collections">Loading...</pre>
</section>

<section>
  <h2>User Stats</h2>
  <pre id="user-stats">Loading...</pre>
</section>

<section>
  <h2>Booking Stats</h2>
  <pre id="booking-stats">Loading...</pre>
</section>

<section>
  <h2>Backend Logs</h2>
  <pre id="logs">Loading...</pre>
</section>

<section>
  <h2>Test Alerts</h2>
  <button onclick="testEmail()">Send Test Email</button>
  <button onclick="testSlack()">Send Test Slack</button>
  <p id="alert-status"></p>
</section>

<script>
const API_BASE = "http://localhost:5000"; // change if hosted elsewhere
const API_KEY = "supersecrettoken123"; // match your .env REPORT_TOKEN

async function fetchCollections() {
  try {
    const res = await fetch(`${API_BASE}/api/mongo/collections`, {
      headers: { "x-api-key": API_KEY }
    });
    const data = await res.json();
    document.getElementById("collections").textContent = JSON.stringify(data, null, 2);
  } catch(e) {
    document.getElementById("collections").textContent = "Error: " + e.message;
  }
}

async function fetchUserStats() {
  try {
    const res = await fetch(`${API_BASE}/api/stats/users`, { headers: { "x-api-key": API_KEY } });
    const data = await res.json();
    document.getElementById("user-stats").textContent = JSON.stringify(data, null, 2);
  } catch(e) {
    document.getElementById("user-stats").textContent = "Error: " + e.message;
  }
}

async function fetchBookingStats() {
  try {
    const res = await fetch(`${API_BASE}/api/stats/bookings`, { headers: { "x-api-key": API_KEY } });
    const data = await res.json();
    document.getElementById("booking-stats").textContent = JSON.stringify(data, null, 2);
  } catch(e) {
    document.getElementById("booking-stats").textContent = "Error: " + e.message;
  }
}

async function fetchLogs() {
  try {
    const res = await fetch(`${API_BASE}/logs`, { headers: { "x-api-key": API_KEY } });
    const text = await res.text();
    document.getElementById("logs").textContent = text;
  } catch(e) {
    document.getElementById("logs").textContent = "Error: " + e.message;
  }
}

async function testEmail() {
  try {
    const res = await fetch(`${API_BASE}/api/alerts/test-email`, { 
      method: "POST", 
      headers: { "x-api-key": API_KEY }
    });
    const data = await res.json();
    document.getElementById("alert-status").textContent = data.message;
  } catch(e) {
    document.getElementById("alert-status").textContent = "Error: " + e.message;
  }
}

async function testSlack() {
  try {
    const res = await fetch(`${API_BASE}/api/alerts/test-slack`, { 
      method: "POST", 
      headers: { "x-api-key": API_KEY }
    });
    const data = await res.json();
    document.getElementById("alert-status").textContent = data.message;
  } catch(e) {
    document.getElementById("alert-status").textContent = "Error: " + e.message;
  }
}

// Auto-fetch everything on load
fetchCollections();
fetchUserStats();
fetchBookingStats();
fetchLogs();
setInterval(fetchLogs, 5000); // refresh logs every 5s
</script>

</body>
</html>