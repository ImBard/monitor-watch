let DATA = null;
let activeSize = "all";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit"
});

function statusLabel(status) {
  return {
    buy: "Comprar agora",
    good: "Bom negócio",
    watch: "Observar"
  }[status] || "Analisar";
}

function pctChange(current, previous) {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

function recommendationRank(v) {
  return { buy: 0, good: 1, watch: 2 }[v] ?? 9;
}

function sparkline(history = []) {
  if (!history.length) {
    return '<div style="height:72px;display:grid;place-items:center;color:var(--muted);font-size:12px">Sem histórico ainda</div>';
  }

  const w = 360, h = 72, p = 6;
  const vals = history.map(x => x.price);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = Math.max(1, max - min);

  const points = history.map((x, i) => {
    const px = p + (i * (w - 2*p) / Math.max(1, history.length - 1));
    const py = p + ((max - x.price) / span) * (h - 2*p);
    return [px, py];
  });

  const path = points.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return `
    <svg class="sparkline" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="Histórico de preço">
      <path d="${path}" fill="none" stroke="currentColor" stroke-width="2.5" vector-effect="non-scaling-stroke"/>
      <circle cx="${last[0]}" cy="${last[1]}" r="4.5" fill="currentColor"/>
    </svg>
  `;
}

function heroHTML(m) {
  const change = pctChange(m.price, m.previousPrice);
  return `
    <div class="hero-inner">
      <div>
        <span class="eyebrow">🏆 MELHOR COMPRA AGORA</span>
        <h2>${m.size}" ${m.model}</h2>
        <p>${m.notes}</p>

        <div class="hero-meta">
          <div class="metric"><span>Resolução</span><strong>${m.resolution}</strong></div>
          <div class="metric"><span>Painel</span><strong>${m.panel}</strong></div>
          <div class="metric"><span>Nitidez</span><strong>${m.ppi} PPI</strong></div>
        </div>
      </div>

      <div class="hero-price-card">
        <div>
          <span class="eyebrow">PREÇO ATUAL</span>
          <div class="hero-price">${brl.format(m.price)}</div>
          <div class="price-change ${change <= 0 ? "good" : "bad"}">
            ${change <= 0 ? "↓" : "↑"} ${Math.abs(change).toFixed(1)}% vs. busca anterior
          </div>
          <p style="margin-top:10px">${m.store} · mínima registrada ${brl.format(m.lowestPrice)}</p>
        </div>

        <div class="hero-actions">
          <a class="primary-link" href="${m.url}" target="_blank" rel="noopener">Ver oferta ↗</a>
          <a class="secondary-link" href="#radar">Ver comparação</a>
        </div>
      </div>
    </div>
  `;
}

function monitorCard(m) {
  const change = pctChange(m.price, m.previousPrice);
  const featureChips = [
    m.antiGlare ? "Antirreflexo" : null,
    m.flickerFree ? "Flicker-free" : null,
    m.lowBlueLight ? "Low Blue Light" : null,
    m.vesa ? "VESA" : null,
    m.usbCPD ? `USB-C PD ${m.usbCPD} W` : null
  ].filter(Boolean);

  const alternatives = (m.alternatives || []).map(a => `
    <div class="alternative-row">
      <div>
        <strong>${a.model}</strong>
        <span>${a.category || "alternativa"} · ${a.panel || "painel n/d"} · ${a.resolution || ""} · ${a.refreshRate || "?"} Hz${a.usbCPD ? ` · USB-C PD ${a.usbCPD} W` : ""}</span>
      </div>
      <div>
        <strong>${brl.format(a.price)}</strong>
        <span>${a.store || ""}</span>
      </div>
    </div>
  `).join("");

  return `
    <article class="monitor-card">
      <div class="card-top">
        <span class="size-pill">${m.size}"</span>
        <span class="status ${m.recommendation}">${statusLabel(m.recommendation)}</span>
      </div>

      <h3>${m.model}</h3>
      <p class="store">${m.store} · ${m.brand}</p>

      <div class="card-price-row">
        <div class="card-price">${brl.format(m.price)}</div>
        <div class="delta ${change <= 0 ? "price-change good" : "price-change bad"}">
          ${change <= 0 ? "↓" : "↑"} ${Math.abs(change).toFixed(1)}%
        </div>
      </div>

      <div class="specs">
        <div class="spec"><span>Resolução</span><strong>${m.resolution}</strong></div>
        <div class="spec"><span>Painel</span><strong>${m.panel}</strong></div>
        <div class="spec"><span>Hz</span><strong>${m.refreshRate}</strong></div>
        <div class="spec"><span>PPI</span><strong>${m.ppi}</strong></div>
      </div>

      <p class="notes">${m.notes}</p>

      <div class="chart-wrap">
        <div class="chart-meta">
          <span>Histórico recente</span>
          <span>Mín. ${brl.format(m.lowestPrice)}</span>
        </div>
        ${sparkline(m.history)}
      </div>

      <div class="card-footer">
        ${featureChips.map(x => `<span class="chip">${x}</span>`).join("")}
      </div>

      ${alternatives ? `
        <details class="alternatives">
          <summary>Ver ${m.alternatives.length} alternativas</summary>
          <div class="alternatives-list">${alternatives}</div>
        </details>
      ` : ""}

      <div class="hero-actions">
        <a class="primary-link" href="${m.url}" target="_blank" rel="noopener">Ver oferta ↗</a>
      </div>
    </article>
  `;
}

function render() {
  const sort = document.getElementById("sort").value;

  let list = DATA.monitors.filter(m => activeSize === "all" || String(m.size) === activeSize);

  list.sort((a, b) => {
    if (sort === "price") return a.price - b.price;
    if (sort === "quality") return b.qualityScore - a.qualityScore;
    if (sort === "ppi") return b.ppi - a.ppi;
    return recommendationRank(a.recommendation) - recommendationRank(b.recommendation) || b.qualityScore - a.qualityScore;
  });

  document.getElementById("cards").innerHTML = list.map(monitorCard).join("");
}

async function boot() {
  try {
    const [currentRes, historyRes, alternativesRes] = await Promise.all([
      fetch("data/current.json", { cache: "no-store" }),
      fetch("data/history.json", { cache: "no-store" }),
      fetch("data/alternatives.json", { cache: "no-store" })
    ]);

    if (!currentRes.ok || !historyRes.ok || !alternativesRes.ok) throw new Error("split-data unavailable");

    const [current, historyData, alternativesData] = await Promise.all([
      currentRes.json(),
      historyRes.json(),
      alternativesRes.json()
    ]);

    DATA = {
      ...current,
      monitors: current.monitors.map(m => ({
        ...m,
        history: historyData.histories?.[m.id] || [],
        alternatives: alternativesData.alternatives?.[m.id] || []
      }))
    };
  } catch (err) {
    console.warn("Usando data.json legado como fallback", err);
    const response = await fetch("data.json", { cache: "no-store" });
    DATA = await response.json();
  }

  const heroMonitor =
    DATA.monitors.find(m => m.size === DATA.headline.size && m.model === DATA.headline.model)
    || DATA.monitors.slice().sort((a,b) => recommendationRank(a.recommendation) - recommendationRank(b.recommendation))[0];

  const hero = document.getElementById("hero");
  hero.classList.remove("skeleton");
  hero.innerHTML = heroHTML(heroMonitor);

  document.getElementById("updatedAt").textContent =
    `Atualizado em ${dateFmt.format(new Date(DATA.updatedAt))}`;

  render();
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    activeSize = button.dataset.size;
    render();
  });
});

document.getElementById("sort").addEventListener("change", render);

document.getElementById("themeButton").addEventListener("click", () => {
  document.documentElement.classList.toggle("light");
  localStorage.setItem("mw-theme", document.documentElement.classList.contains("light") ? "light" : "dark");
});

if (localStorage.getItem("mw-theme") === "light") {
  document.documentElement.classList.add("light");
}

boot().catch(err => {
  console.error(err);
  document.getElementById("hero").innerHTML =
    `<div class="hero-inner"><div><h2>Não foi possível carregar os dados.</h2><p>Confira se o arquivo data.json está no mesmo diretório do index.html.</p></div></div>`;
});
