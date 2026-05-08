export default {
  async fetch(request) {
    try {
      const url = new URL(request.url);
      const cf = request.cf || {};
      
      // دریافت IP کاربر
      const ip = request.headers.get("cf-connecting-ip") || 
                 request.headers.get("x-forwarded-for")?.split(',')[0] || 
                 "0.0.0.0";
      
      // دریافت اطلاعات از ip-api.com
      let geoInfo = {
        status: "fail",
        country: "Unknown",
        countryCode: "Unknown",
        city: "Unknown",
        regionName: "Unknown",
        region: "",
        timezone: "UTC",
        isp: "Unknown",
        as: "Unknown",
        org: "Unknown",
        lat: 0,
        lon: 0,
        zip: "Not available",
        mobile: false,
        proxy: false,
        hosting: false
      };
      
      try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,regionName,region,timezone,isp,as,org,lat,lon,zip,mobile,proxy,hosting,query`);
        if (response.ok) {
          const apiData = await response.json();
          if (apiData && apiData.status === "success") {
            geoInfo = apiData;
          }
        }
      } catch (err) {
        console.error("ip-api error:", err);
      }
      
      // ترکیب داده‌ها
      const data = {
        ip: ip,
        country: geoInfo.country || cf.country || "Unknown",
        countryCode: (geoInfo.countryCode || cf.country || "Unknown").toUpperCase(),
        city: geoInfo.city || cf.city || "Unknown",
        region: geoInfo.regionName || cf.region || "Unknown",
        regionCode: geoInfo.region || cf.regionCode || "",
        timezone: geoInfo.timezone || cf.timezone || "UTC",
        isp: geoInfo.isp || cf.asOrganization || "Unknown ISP",
        asn: geoInfo.as || (cf.asn ? `AS${cf.asn}` : "Unknown"),
        org: geoInfo.org || "Unknown",
        lat: geoInfo.lat || cf.latitude || 0,
        lon: geoInfo.lon || cf.longitude || 0,
        zip: geoInfo.zip || cf.postalCode || "Not available",
        protocol: cf.httpProtocol || "Unknown",
        tlsVersion: cf.tlsVersion || "Unknown",
        mobile: geoInfo.mobile === true,
        proxy: geoInfo.proxy === true,
        hosting: geoInfo.hosting === true,
        deviceType: getDeviceType(request.headers.get("user-agent") || "")
      };
      
      // JSON endpoint
      if (url.pathname === "/json") {
        return new Response(JSON.stringify(data, null, 2), {
          headers: { 
            "content-type": "application/json",
            "cache-control": "no-cache"
          }
        });
      }
      
      // صفحه اصلی
      const html = renderHTML(data);
      return new Response(html, {
        headers: { 
          "content-type": "text/html;charset=UTF-8",
          "cache-control": "no-cache"
        }
      });
      
    } catch (error) {
      // صفحه خطای ساده
      return new Response(`<html><body style="background:#09090b;color:#fff;padding:2rem;font-family:sans-serif;"><h1>Error</h1><p>${error.message}</p></body></html>`, {
        headers: { "content-type": "text/html" },
        status: 500
      });
    }
  }
};

function getDeviceType(ua) {
  if (!ua) return "Desktop";
  const uaLower = ua.toLowerCase();
  if (uaLower.includes("mobile")) return "Mobile";
  if (uaLower.includes("tablet")) return "Tablet";
  if (uaLower.includes("bot") || uaLower.includes("crawler")) return "Bot";
  return "Desktop";
}

function renderHTML(d) {
  const flagUrl = (d.countryCode && d.countryCode !== "Unknown") 
    ? `https://flagcdn.com/w80/${d.countryCode.toLowerCase()}.png`
    : "";
  
  const jsonData = JSON.stringify(d, null, 2);
  const hasLocation = (d.lat !== 0 && d.lon !== 0);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IP Intelligence | Professional IP Lookup</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'DM Sans', sans-serif; background: #09090b; }
    .font-mono { font-family: 'Space Mono', monospace; }
    .card-bg { background: #18181b; border: 1px solid #27272a; }
    .card-bg:hover { border-color: #3f3f46; }
    .ip-gradient { background: linear-gradient(135deg, #18181b 0%, #1f1f24 100%); border: 1px solid #27272a; }
    .badge { background: #18181b; border: 1px solid #27272a; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 500; }
    .btn { transition: all 0.2s ease; cursor: pointer; }
    .btn:active { transform: scale(0.97); }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: #18181b; }
    ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .animate-in { animation: fadeIn 0.4s ease forwards; }
    .glass { background: rgba(24,24,27,0.6); backdrop-filter: blur(8px); border: 1px solid rgba(63,63,70,0.3); }
  </style>
</head>
<body class="bg-zinc-950 text-zinc-100">
  <div class="max-w-5xl mx-auto px-4 py-6 md:py-8">
    
    <!-- Header -->
    <div class="text-center mb-6 animate-in">
      <div class="inline-flex items-center gap-2 badge mb-3">
        <i class="fas fa-shield-alt text-indigo-400 text-xs"></i>
        <span class="text-zinc-400 text-xs tracking-wide">IP INTELLIGENCE</span>
      </div>
      <h1 class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">IP Intelligence</h1>
      <p class="text-zinc-500 text-sm mt-1">Real-time geolocation & network insights</p>
    </div>
    
    <!-- Main IP Card -->
    <div class="ip-gradient rounded-xl p-5 mb-5 animate-in">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="text-xs text-zinc-500 mb-1 flex items-center gap-1">
            <i class="fas fa-network-wired text-indigo-400 text-xs"></i> YOUR IP ADDRESS
          </div>
          <div class="flex items-center gap-2">
            <h2 class="text-2xl md:text-3xl font-mono font-bold tracking-tight">${escapeHtml(d.ip)}</h2>
            <button onclick="copyIP()" class="text-zinc-400 hover:text-indigo-400 transition p-1">
              <i class="fas fa-copy text-sm"></i>
            </button>
          </div>
          <div class="flex flex-wrap gap-1.5 mt-2">
            ${d.proxy ? '<span class="badge bg-red-950/30 border-red-900/50 text-red-400"><i class="fas fa-mask mr-1"></i>Proxy/VPN</span>' : ''}
            ${d.mobile ? '<span class="badge bg-orange-950/30 border-orange-900/50 text-orange-400"><i class="fas fa-mobile-alt mr-1"></i>Mobile</span>' : ''}
            ${d.hosting ? '<span class="badge bg-purple-950/30 border-purple-900/50 text-purple-400"><i class="fas fa-cloud mr-1"></i>Hosting</span>' : ''}
          </div>
        </div>
        <div class="flex items-center gap-3 glass rounded-lg px-4 py-2">
          ${flagUrl ? `<img src="${flagUrl}" class="w-10 h-7 rounded shadow" alt="Flag" onerror="this.style.display='none'">` : '<div class="w-10 h-7 bg-zinc-800 rounded flex items-center justify-center"><i class="fas fa-globe text-zinc-600 text-sm"></i></div>'}
          <div>
            <div class="text-base font-semibold">${escapeHtml(d.city !== "Unknown" ? d.city : "—")}</div>
            <div class="text-xs text-zinc-400">${escapeHtml(d.country)}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Row 1: ISP, ASN, Org, Timezone -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3">
      <div class="card-bg rounded-lg p-3 animate-in"><div class="text-[10px] text-zinc-500 uppercase tracking-wide">ISP</div><div class="text-sm font-semibold truncate" title="${escapeHtml(d.isp)}">${escapeHtml(d.isp.length > 22 ? d.isp.slice(0,20)+'..' : d.isp)}</div></div>
      <div class="card-bg rounded-lg p-3 animate-in"><div class="text-[10px] text-zinc-500 uppercase tracking-wide">ASN</div><div class="text-sm font-mono">${escapeHtml(d.asn)}</div></div>
      <div class="card-bg rounded-lg p-3 animate-in"><div class="text-[10px] text-zinc-500 uppercase tracking-wide">Organization</div><div class="text-sm truncate" title="${escapeHtml(d.org)}">${escapeHtml(d.org.length > 22 ? d.org.slice(0,20)+'..' : d.org)}</div></div>
      <div class="card-bg rounded-lg p-3 animate-in"><div class="text-[10px] text-zinc-500 uppercase tracking-wide">Timezone</div><div class="text-sm font-mono">${escapeHtml(d.timezone.split('/').pop())}</div></div>
    </div>
    
    <!-- Row 2: Location, Postal, Protocol -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-2.5 mb-5">
      <div class="card-bg rounded-lg p-3 animate-in"><div class="text-[10px] text-zinc-500 uppercase tracking-wide">Location</div><div class="text-sm">${escapeHtml(d.city)}, ${escapeHtml(d.region)}</div><div class="text-[10px] text-zinc-600">${escapeHtml(d.countryCode)}</div></div>
      <div class="card-bg rounded-lg p-3 animate-in"><div class="text-[10px] text-zinc-500 uppercase tracking-wide">Postal Code</div><div class="text-sm font-mono">${escapeHtml(d.zip !== "Not available" ? d.zip : "—")}</div></div>
      <div class="card-bg rounded-lg p-3 animate-in"><div class="text-[10px] text-zinc-500 uppercase tracking-wide">Protocol</div><div class="text-sm font-mono">${escapeHtml(d.protocol)}</div><div class="text-[10px] text-zinc-600">TLS ${escapeHtml(d.tlsVersion)}</div></div>
    </div>
    
    <!-- Row 3: Coordinates + Device -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
      <div class="card-bg rounded-lg p-3 animate-in">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-map-marker-alt text-indigo-400 text-xs"></i><span class="text-xs text-zinc-400 uppercase tracking-wide">Coordinates</span></div>
        <div class="flex justify-between text-sm"><span class="text-zinc-500">Latitude:</span><span class="font-mono">${d.lat !== 0 ? d.lat : "—"}</span></div>
        <div class="flex justify-between text-sm mt-1"><span class="text-zinc-500">Longitude:</span><span class="font-mono">${d.lon !== 0 ? d.lon : "—"}</span></div>
        ${hasLocation ? `<div class="mt-2"><a href="https://www.google.com/maps?q=${d.lat},${d.lon}" target="_blank" rel="noopener noreferrer" class="text-indigo-400 text-xs hover:underline">View on Google Maps →</a></div>` : ''}
      </div>
      <div class="card-bg rounded-lg p-3 animate-in">
        <div class="flex items-center gap-2 mb-2"><i class="fas fa-desktop text-emerald-400 text-xs"></i><span class="text-xs text-zinc-400 uppercase tracking-wide">Device Info</span></div>
        <div class="flex justify-between text-sm"><span class="text-zinc-500">Type:</span><span>${escapeHtml(d.deviceType)}</span></div>
        <div class="flex justify-between text-sm mt-1"><span class="text-zinc-500">Security:</span><span class="${d.proxy ? 'text-red-400' : 'text-emerald-400'}">${d.proxy ? 'Proxy/VPN Detected' : 'Direct Connection'}</span></div>
        <div class="flex justify-between text-sm mt-1"><span class="text-zinc-500">Connection:</span><span>${d.mobile ? 'Cellular' : 'Broadband'}</span></div>
      </div>
    </div>
    
    <!-- Extra Features -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
      <div class="card-bg rounded-lg p-3 animate-in">
        <div class="text-xs text-zinc-400 mb-1"><i class="fas fa-search mr-1"></i>Reverse DNS</div>
        <div class="text-sm font-mono" id="reverseDnsValue">—</div>
      </div>
      ${hasLocation ? `
      <div class="card-bg rounded-lg p-3 animate-in">
        <div class="text-xs text-zinc-400 mb-1"><i class="fas fa-cloud-sun mr-1"></i>Weather</div>
        <div class="text-sm" id="weatherValue">—</div>
      </div>
      ` : ''}
      <div class="card-bg rounded-lg p-3 animate-in">
        <div class="text-xs text-zinc-400 mb-1"><i class="fas fa-tachometer-alt mr-1"></i>Speed Test</div>
        <div class="text-sm font-mono" id="speedValue">—</div>
        <button id="runSpeedTest" class="mt-1 text-[10px] text-indigo-400 hover:underline">Test download speed</button>
      </div>
    </div>
    
    ${hasLocation ? `
    <div class="rounded-lg overflow-hidden mb-5 border border-zinc-800 animate-in">
      <iframe width="100%" height="200" src="https://maps.google.com/maps?q=${d.lat},${d.lon}&z=8&output=embed" frameborder="0" allowfullscreen loading="lazy" title="Location Map"></iframe>
    </div>
    ` : ''}
    
    <!-- Action Buttons -->
    <div class="flex flex-wrap gap-2 mb-5 animate-in">
      <button id="copyBtn" class="btn flex-1 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium"><i class="fas fa-copy mr-1.5"></i>Copy IP</button>
      <button id="latencyBtn" class="btn flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium"><i class="fas fa-tachometer-alt mr-1.5"></i>Test Latency</button>
      <button id="showJsonBtn" class="btn flex-1 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium"><i class="fas fa-code mr-1.5"></i>View JSON</button>
      <button id="shareBtn" class="btn flex-1 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-sm font-medium"><i class="fas fa-share-alt mr-1.5"></i>Share</button>
    </div>
    
    <div id="latencyResult" class="text-center text-xs text-zinc-500 mb-4"></div>
    
    <!-- JSON Section -->
    <div id="jsonSection" class="hidden mb-5">
      <div class="rounded-lg border border-zinc-800 overflow-hidden">
        <div class="bg-zinc-900 px-4 py-2 flex justify-between items-center text-xs">
          <span><i class="fas fa-code mr-1.5 text-indigo-400"></i>JSON Response <span class="text-zinc-500 ml-2">GET /json</span></span>
          <button onclick="copyJSON()" class="text-zinc-400 hover:text-indigo-400 transition"><i class="fas fa-copy"></i> Copy</button>
        </div>
        <pre class="p-3 text-xs font-mono bg-zinc-950 overflow-auto max-h-64 text-zinc-300">${escapeHtml(jsonData)}</pre>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="text-center text-[11px] text-zinc-600 pt-4 border-t border-zinc-900">
      <span>Powered by Cloudflare Workers</span> • <span>Geo data: ip-api.com</span> • <a href="/json" class="text-indigo-400/70 hover:text-indigo-400">API Endpoint</a>
    </div>
  </div>
  
  <script>
    const ipAddress = "${escapeJs(d.ip)}";
    const latitude = ${d.lat};
    const longitude = ${d.lon};
    const hasLocationFlag = ${hasLocation};
    const jsonDataObj = ${JSON.stringify(d)};
    
    function copyIP() { copyToClipboard(ipAddress); showToast("✓ IP copied"); }
    function copyJSON() { copyToClipboard(JSON.stringify(jsonDataObj, null, 2)); showToast("✓ JSON copied"); }
    
    async function copyToClipboard(text) {
      try { await navigator.clipboard.writeText(text); } catch(e) { showToast("Failed to copy", true); }
    }
    
    function showToast(msg, isError) {
      const toast = document.createElement("div");
      toast.innerHTML = msg;
      toast.className = "fixed bottom-5 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-4 py-2 rounded-lg text-xs z-50 shadow-lg border border-zinc-700";
      document.body.appendChild(toast);
      setTimeout(function() { toast.remove(); }, 2000);
    }
    
    // Reverse DNS
    async function loadReverseDNS() {
      const el = document.getElementById("reverseDnsValue");
      if (!el) return;
      el.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      try {
        const res = await fetch("https://dns.google/resolve?name=" + encodeURIComponent(ipAddress) + "&type=PTR");
        const data = await res.json();
        if (data.Answer && data.Answer[0] && data.Answer[0].data) {
          let ptr = data.Answer[0].data.replace(/\\.$/, '');
          el.innerHTML = ptr.length > 45 ? ptr.slice(0,42) + '...' : ptr;
        } else {
          el.innerHTML = "No PTR record";
        }
      } catch(e) { el.innerHTML = "Error"; }
    }
    
    // Weather
    async function loadWeather() {
      const el = document.getElementById("weatherValue");
      if (!el || !hasLocationFlag) return;
      el.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      try {
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=" + latitude + "&longitude=" + longitude + "&current_weather=true");
        const data = await res.json();
        if (data.current_weather) {
          const w = data.current_weather;
          el.innerHTML = w.temperature + "°C, wind " + w.windspeed + " km/h";
        } else {
          el.innerHTML = "Unavailable";
        }
      } catch(e) { el.innerHTML = "Error"; }
    }
    
    // Speed test
    async function runSpeedTest() {
      const el = document.getElementById("speedValue");
      if (!el) return;
      el.innerHTML = '<i class="fas fa-spinner fa-spin"></i> testing...';
      const imgUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cloudflare_Logo.svg/200px-Cloudflare_Logo.svg.png?t=" + Date.now();
      const start = performance.now();
      try {
        await fetch(imgUrl, { mode: 'no-cors' });
        const end = performance.now();
        const duration = (end - start) / 1000;
        const bitsLoaded = 200 * 1024 * 8;
        const speedMbps = (bitsLoaded / duration / (1024*1024)).toFixed(1);
        el.innerHTML = speedMbps + " Mbps";
      } catch(e) { el.innerHTML = "Click again"; }
    }
    
    // Latency test
    async function testLatency() {
      const resultDiv = document.getElementById("latencyResult");
      resultDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Measuring...';
      const start = performance.now();
      try {
        await fetch("/?_=" + Date.now());
        const latency = Math.round(performance.now() - start);
        let color = "text-emerald-400";
        if (latency > 300) color = "text-yellow-400";
        if (latency > 600) color = "text-red-400";
        resultDiv.innerHTML = '<span class="' + color + '"><i class="fas fa-clock mr-1"></i>Latency: ' + latency + ' ms</span>';
        setTimeout(function() { if(resultDiv) resultDiv.innerHTML = ''; }, 3000);
      } catch(e) { resultDiv.innerHTML = '<span class="text-red-400">Test failed</span>'; }
    }
    
    // Share
    function shareIP() {
      if (navigator.share) {
        navigator.share({ title: "My IP Information", text: "My IP address is " + ipAddress, url: window.location.href });
      } else {
        showToast("Share not supported on this browser");
      }
    }
    
    // Event Listeners
    document.getElementById("copyBtn")?.addEventListener("click", copyIP);
    document.getElementById("latencyBtn")?.addEventListener("click", testLatency);
    document.getElementById("showJsonBtn")?.addEventListener("click", function() {
      const sec = document.getElementById("jsonSection");
      if (sec) sec.classList.toggle("hidden");
    });
    document.getElementById("shareBtn")?.addEventListener("click", shareIP);
    document.getElementById("runSpeedTest")?.addEventListener("click", runSpeedTest);
    
    // Load extra data after page load
    loadReverseDNS();
    if (hasLocationFlag) loadWeather();
  </script>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeJs(str) {
  if (!str) return "";
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '\\"');
}
