/**
 * Rideau Canal Skateway — Dashboard Frontend
 * Fetches data from the Express API and renders cards + charts
 */

// ── Config ────────────────────────────────────────────────────────────────────
const REFRESH_INTERVAL = 30; // seconds

// ── Chart instances (kept globally to allow updates) ─────────────────────────
let iceChart  = null;
let tempChart = null;

// ── Chart colours per location ────────────────────────────────────────────────
const COLORS = {
  "Dow's Lake":   { border: "#0284c7", bg: "rgba(2,132,199,0.1)"   },
  "Fifth Avenue": { border: "#7c3aed", bg: "rgba(124,58,237,0.1)"  },
  "NAC":          { border: "#059669", bg: "rgba(5,150,105,0.1)"   },
};

// ── Safety helpers ────────────────────────────────────────────────────────────
function safetyClass(status) {
  if (!status) return "";
  return status.toLowerCase(); // "safe" | "caution" | "unsafe"
}

function cardId(location) {
  return "card-" + location.toLowerCase()
    .replace(/'/g, "")              // strip apostrophes first
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── Render a location card ────────────────────────────────────────────────────
function renderCard(data) {
  const id    = cardId(data.location);
  const card  = document.getElementById(id);
  if (!card) return;

  const cls = safetyClass(data.safetyStatus);
  card.className = `card ${cls}`;

  card.innerHTML = `
    <div class="card-header">
      <span class="location-name">${data.location}</span>
      <span class="badge ${cls}">${data.safetyStatus || "—"}</span>
    </div>
    <div class="metrics">
      <div class="metric">
        <div class="metric-label">Ice Thickness</div>
        <div class="metric-value">${fmt(data.avgIceThickness)} <span class="metric-unit">cm</span></div>
      </div>
      <div class="metric">
        <div class="metric-label">Surface Temp</div>
        <div class="metric-value">${fmt(data.avgSurfaceTemp)} <span class="metric-unit">°C</span></div>
      </div>
      <div class="metric">
        <div class="metric-label">Snow Depth</div>
        <div class="metric-value">${fmt(data.maxSnowAccumulation)} <span class="metric-unit">cm</span></div>
      </div>
      <div class="metric">
        <div class="metric-label">External Temp</div>
        <div class="metric-value">${fmt(data.avgExternalTemp)} <span class="metric-unit">°C</span></div>
      </div>
    </div>
    <div class="card-footer">
      Ice range: ${fmt(data.minIceThickness)}–${fmt(data.maxIceThickness)} cm ·
      ${data.readingCount} readings ·
      ${shortTime(data.windowEnd)}
    </div>
  `;
}

// ── Update overall system status badge ───────────────────────────────────────
function updateSystemStatus(readings) {
  const badge  = document.getElementById("system-status");
  const statuses = readings.map(r => r.safetyStatus || "Unsafe");

  let overall;
  if (statuses.every(s => s === "Safe"))           overall = "Safe";
  else if (statuses.some(s => s === "Unsafe"))     overall = "Unsafe";
  else                                              overall = "Caution";

  badge.textContent = `System: ${overall}`;
  badge.className   = `system-badge ${overall.toLowerCase()}`;
}

// ── Build / update Chart.js charts ───────────────────────────────────────────
function buildDatasets(history, field) {
  const locations = ["Dow's Lake", "Fifth Avenue", "NAC"];
  return locations.map(loc => {
    const points = history
      .filter(r => r.location === loc)
      .map(r => ({ x: r.windowEnd, y: r[field] }));

    return {
      label:           loc,
      data:            points,
      borderColor:     COLORS[loc].border,
      backgroundColor: COLORS[loc].bg,
      borderWidth:     2,
      pointRadius:     3,
      tension:         0.3,
      fill:            true,
    };
  });
}

const CHART_OPTIONS = (yLabel) => ({
  responsive: true,
  animation:  false,
  scales: {
    x: {
      type:    "time",
      time:    { unit: "minute", displayFormats: { minute: "HH:mm" } },
      title:   { display: true, text: "Time (UTC)" },
      ticks:   { maxTicksLimit: 8 },
    },
    y: {
      title: { display: true, text: yLabel },
    },
  },
  plugins: {
    legend: { position: "bottom" },
    tooltip: {
      callbacks: {
        label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)} ${yLabel}`,
      },
    },
  },
});

function renderCharts(history) {
  const iceDatasets  = buildDatasets(history, "avgIceThickness");
  const tempDatasets = buildDatasets(history, "avgSurfaceTemp");

  if (iceChart) {
    iceChart.data.datasets = iceDatasets;
    iceChart.update();
  } else {
    iceChart = new Chart(document.getElementById("chart-ice"), {
      type: "line",
      data: { datasets: iceDatasets },
      options: CHART_OPTIONS("cm"),
    });
  }

  if (tempChart) {
    tempChart.data.datasets = tempDatasets;
    tempChart.update();
  } else {
    tempChart = new Chart(document.getElementById("chart-temp"), {
      type: "line",
      data: { datasets: tempDatasets },
      options: CHART_OPTIONS("°C"),
    });
  }
}

// ── Main data load ────────────────────────────────────────────────────────────
async function loadAll() {
  try {
    const latest = await fetch("/api/latest").then(r => r.json());
    latest.forEach(renderCard);
    updateSystemStatus(latest);
  } catch (err) {
    console.error("Failed to load latest data:", err);
    document.getElementById("system-status").textContent = "Connection Error";
  }

  try {
    const history = await fetch("/api/history").then(r => r.json());
    if (Array.isArray(history) && history.length > 0) renderCharts(history);
  } catch (err) {
    console.error("Failed to load history (charts unavailable):", err);
  }
}

// ── Countdown timer ───────────────────────────────────────────────────────────
let countdown = REFRESH_INTERVAL;
function tick() {
  document.getElementById("countdown").textContent = countdown;
  if (--countdown < 0) {
    countdown = REFRESH_INTERVAL;
    loadAll();
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n)       { return n != null ? Number(n).toFixed(1) : "—"; }
function shortTime(ts){ return ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""; }

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadAll();
  setInterval(tick, 1000);
});