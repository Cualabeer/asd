<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Mobile Mechanic Pro Dashboard</title>
<style>
body { font-family: Arial; background: #1e1e2f; color: #eee; margin:0; padding:0;}
header { background:#111; padding:20px; text-align:center; font-size:24px;}
section { padding:20px;}
pre { background:#222; padding:10px; overflow-x:auto; max-height:300px;}
.metric { margin:10px 0; font-size:18px;}
.chart { width: 100%; max-width:600px; height:300px; margin:20px 0;}
</style>
</head>
<body>
<header>Mobile Mechanic Pro Dashboard</header>
<section>
<div class="metric" id="status">Loading backend status...</div>
<h3>Logs</h3>
<pre id="logs">Fetching logs...</pre>
<canvas id="bookingChart" class="chart"></canvas>
</section>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
const token = new URLSearchParams(window.location.search).get('token');
if(!token){ document.body.innerHTML='<h1>Access Denied</h1>'; }

async function fetchStatus() {
  const res = await fetch(`/api/dashboard/status?token=${token}`);
  const data = await res.json();
  document.getElementById('status').textContent =
    `Backend: ${data.backend}, Node: ${data.nodeVersion}, Uptime: ${data.uptime}, Memory: ${data.memory}, CPU Load: ${data.cpuLoad.join(', ')}`;
}

async function fetchLogs() {
  const res = await fetch(`/api/dashboard/logs?token=${token}`);
  const text = await res.text();
  document.getElementById('logs').textContent = text;
}

// Dummy booking chart for future analytics
const ctx = document.getElementById('bookingChart').getContext('2d');
const bookingChart = new Chart(ctx, {
  type: 'line',
  data: { labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], datasets:[{label:'Bookings', data:[5,3,6,2,7,4,5], borderColor:'cyan', fill:false}] },
  options: { responsive:true }
});

fetchStatus(); fetchLogs();
setInterval(()=>{ fetchStatus(); fetchLogs(); },5000);
</script>
</body>
</html>