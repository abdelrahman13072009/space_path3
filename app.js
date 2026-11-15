
'use strict';
const $ = id => document.getElementById(id);

let toastTimer = null;
function showToast(msg) {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ============================================================================
 * 1. VERIFIED NASA / USGS PLANETARY DATASETS & CATALOGS
 * ============================================================================ */
/* ============================================================================
 * 2. MARTIAN PHYSICS, BIOENERGETICS & EMERGENCY ROUTING ENGINE
 * ============================================================================ */
(function initPhysics() {
  const MARS_R_KM = 3389.5;
  const MARS_G = 3.71;
  const SUIT_EFF = 0.22;
  const BASE_POWER_W = 85 + 235;
  const J_PER_KCAL = 4184;
  const KCAL_PER_L_O2 = 4.81;

  window.computeVisibility = function(dustTau, k = 1.5) {
    const tau = Math.max(0.1, Number(dustTau) || 0.5);
    const atten = Math.max(0.5, Number(k) || 1.5);
    const factor = Math.exp(-atten * tau);
    const pct = Math.max(1, Math.min(100, Math.round(factor * 100)));

    let label = 'Excellent', cssClass = 'vis-excellent';
    if (tau >= 2.2) { label = 'Poor (Storm Emergency)'; cssClass = 'vis-poor'; }
    else if (tau > 1.2) { label = 'Reduced (Hazy)'; cssClass = 'vis-reduced'; }
    else if (tau > 0.4) { label = 'Good (Nominal)'; cssClass = 'vis-good'; }

    const speedFactor = tau <= 0.7 ? 1.0 : Math.max(0.35, Number((1 / (1 + 0.32 * (tau - 0.7))).toFixed(3)));
    return { tau, k: atten, factor, pct, label, cssClass, speedFactor };
  };

  window.computeMarsChordKm = function(p1, p2) {
    if (!p1 || !p2 || (p1.id && p1.id === p2.id)) return 0.5;
    const rad = d => (d * Math.PI) / 180;
    const dLat = rad(p2.lat - p1.lat), dLon = rad(p2.lon - p1.lon);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) * Math.sin(dLon / 2) ** 2;
    const dist = MARS_R_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return p1.id ? Math.max(0.5, dist) : dist;
  };

  window.computeBearingDeg = function(p1, p2) {
    if (!p1 || !p2) return 318;
    const rad = d => (d * Math.PI) / 180;
    const dLon = rad(p2.lon - p1.lon);
    const y = Math.sin(dLon) * Math.cos(rad(p2.lat));
    const x = Math.cos(rad(p1.lat)) * Math.sin(rad(p2.lat)) - Math.sin(rad(p1.lat)) * Math.cos(rad(p2.lat)) * Math.cos(dLon);
    return (Math.round((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
  };

  window.computeMetabolicCost = function(distKm, deltaHM, mu, massKg, hours, visFactor = 0.47) {
    const distM = Math.max(100, distKm * 1000);
    const climbM = Math.max(0, deltaHM);
    const mass = Math.max(80, massKg);
    const sec = Math.max(600, hours * 3600);

    const workFlatJ = mass * MARS_G * distM * mu;
    const workClimbJ = mass * MARS_G * (climbM * 8.4);
    const dustMult = visFactor < 0.25 ? 1.12 : 1.0;
    const totalJ = (((workFlatJ + workClimbJ) / SUIT_EFF) + BASE_POWER_W * sec) * dustMult;

    const kcal = Math.round(totalJ / J_PER_KCAL);
    const o2Liters = Math.round(kcal / KCAL_PER_L_O2);
    const batteryPctRemaining = Math.max(12, Math.min(98, Math.round(100 - hours * 4.7)));

    return {
      o2Liters,
      kcal,
      deltaH: Math.round(deltaHM),
      mu,
      massKg: mass,
      workFlatKJ: Math.round(workFlatJ / 1000),
      workClimbKJ: Math.round(workClimbJ / 1000),
      batteryPctRemaining
    };
  };

  window.getSimulatedRoutes = function(startPlace, destPlace, suitMassKg, dustTau, o2CapacityL = 550) {
    const s = startPlace || Landmarks.butler;
    const d = (destPlace && destPlace.id !== s.id) ? destPlace : Landmarks.belva;
    const chordKm = window.computeMarsChordKm(s, d);
    const scale = chordKm / 8.45;
    const netElevGain = Math.max(0, (d.elevM || -2502) - (s.elevM || -2570));
    const vis = window.computeVisibility(dustTau, (window.AppState && window.AppState.attenuationK) || 1.5);

    const midLat = (s.lat + d.lat) / 2, midLon = (s.lon + d.lon) / 2;
    const dLat = d.lat - s.lat, dLon = d.lon - s.lon;

    const climbA = Math.round(netElevGain + 48);
    const climbB = Math.round(netElevGain * 0.35);
    const climbC = Math.round(netElevGain + 14);

    const build = (cfg) => {
      const distance = Number(Math.max(0.6, cfg.baseDistKm * scale).toFixed(1));
      const paceKmh = Number((cfg.basePaceKmh * vis.speedFactor).toFixed(2));
      const hours = Number((distance / Math.max(0.3, paceKmh)).toFixed(1));
      const bio = window.computeMetabolicCost(distance, cfg.deltaH, cfg.mu, suitMassKg, hours, vis.factor);
      const remaining = Math.max(0, o2CapacityL - bio.o2Liters);
      const pct = Math.max(0, Math.round((remaining / o2CapacityL) * 100));
      const feasible = (remaining - 85) >= 0;
      const status = remaining > 150 ? 'NOMINAL' : remaining >= 85 ? 'WARNING' : 'CRITICAL';

      return {
        ...cfg,
        distance,
        paceKmh,
        hours,
        visibility: vis,
        bio: { ...bio, remainingO2: remaining, remainingPct: pct, feasible, status }
      };
    };

    return {
      A: build({
        key: 'A', name: 'Delta Fan Rim', color: '#e56c45', baseDistKm: 4.8, basePaceKmh: 1.38,
        deltaH: climbA, mu: 0.16, riskLabel: 'Moderate', safetyScore: 0.66, scienceTargets: 3,
        points: [[s.lat, s.lon], [midLat + dLon * 0.16, midLon - dLat * 0.16], [d.lat, d.lon]]
      }),
      B: build({
        key: 'B', name: 'Smooth Floor', color: '#1d6f42', baseDistKm: 5.3, basePaceKmh: 1.48,
        deltaH: climbB, mu: 0.17, riskLabel: 'Very Low', safetyScore: 1.0, scienceTargets: 2,
        points: [[s.lat, s.lon], [midLat - dLon * 0.24, midLon + dLat * 0.24], [d.lat, d.lon]]
      }),
      C: build({
        key: 'C', name: 'Direct Chord', color: '#1c5d8c', baseDistKm: 4.2, basePaceKmh: 1.56,
        deltaH: climbC, mu: 0.29, riskLabel: 'Elevated', safetyScore: 0.32, scienceTargets: 1,
        points: [[s.lat, s.lon], [midLat, midLon], [d.lat, d.lon]]
      })
    };
  };

  window.computeEmergencyRoute = function(fromKey, stationPlace, massKg, o2RemainingL, dustTau) {
    const from = Landmarks[fromKey] || Landmarks.belva;
    const station = stationPlace || Landmarks.butler;
    const chordKm = window.computeMarsChordKm(from, station);
    const distKm = Number((chordKm * 1.08).toFixed(2));
    const speedKmh = dustTau >= 2.2 ? 1.45 : 1.80;
    const hours = Number((distKm / speedKmh).toFixed(1));
    const bio = window.computeMetabolicCost(distKm, 0, 0.25, massKg, hours, 0.15);
    const o2Needed = bio.o2Liters;
    const o2Remaining = Math.max(0, Math.round(o2RemainingL));
    const margin = o2Remaining - o2Needed;
    const status = margin >= 50 ? 'SAFE MARGIN' : margin >= 0 ? 'TIGHT O₂ RESERVE' : 'CRITICAL O₂ DEFICIT';
    const statusColor = margin >= 50 ? 'var(--green)' : margin >= 0 ? 'var(--amber)' : 'var(--danger)';
    return {
      distKm,
      hours,
      speedKmh: speedKmh.toFixed(2),
      o2Needed,
      o2Remaining,
      status,
      statusColor,
      bearing: window.computeBearingDeg(from, station),
      points: [[from.lat, from.lon], [station.lat, station.lon]]
    };
  };

  window.MarsPathCostAnalyzer = {
    analyzeAllRoutes(start, dest, state) {
      const routes = window.getSimulatedRoutes(start, dest, state.suitMassKg, state.dustTau, state.o2CapacityL);
      const list = ['A', 'B', 'C'].map(k => routes[k]);
      const lowestO2 = list.reduce((best, r) => r.bio.o2Liters < best.bio.o2Liters ? r : best, list[0]);
      const fastest = list.reduce((best, r) => r.hours < best.hours ? r : best, list[0]);
      return { start, dest, routes, lowestO2, fastest, active: routes[state.selectedRoute] || routes.A };
    },
    renderHTML(a) {
      const diffO2 = a.active.bio.o2Liters - a.lowestO2.bio.o2Liters;
      const summary = diffO2 === 0
        ? `<strong>Route ${a.active.key} (${a.active.name})</strong> is currently the most oxygen-efficient corridor at <strong>${a.active.bio.o2Liters} L O₂</strong> (${a.active.bio.remainingO2} L reserve).`
        : `<strong>Route ${a.active.key} (${a.active.name})</strong> uses <strong>+${diffO2} L more O₂</strong> than <strong>Route ${a.lowestO2.key} (${a.lowestO2.name})</strong> due to ${a.active.key === 'A' ? `steep scarp climbing (Δh +${a.active.bio.deltaH} m)` : `boulder rolling resistance (μ = ${a.active.bio.mu})`}.`;

      return `
        <div class="cost-box">
          <div class="cost-box-head">
            <div>
              <h4>NASA PLSS Bioenergetic &amp; Terrain Cost Analyzer</h4>
              <p style="margin:2px 0 0; font-size:11px; color:var(--muted);">Plain-English comparison of flat traction work vs. vertical climb penalty across all 3 corridors</p>
            </div>
            <span class="badge badge-model">550 L PLSS Tank · 85 L Reserve Floor</span>
          </div>
          <div style="font-size:12px; color:var(--text-sub);">${summary}</div>
          <div class="cost-grid">
            ${['A', 'B', 'C'].map(k => {
              const r = a.routes[k];
              const isBest = r.key === a.lowestO2.key;
              return `
                <div class="cost-item ${isBest ? 'best-cost' : ''}">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <strong>Route ${r.key} · ${r.name}</strong>
                    <span class="badge ${isBest ? 'badge-model' : 'badge-sim'}">${isBest ? 'Lowest O₂' : `+${r.bio.o2Liters - a.lowestO2.bio.o2Liters} L O₂`}</span>
                  </div>
                  <div style="color:var(--text-sub);">
                    • Total Burn: <strong>${r.bio.o2Liters} L O₂</strong> (${r.bio.kcal.toLocaleString()} kcal)<br>
                    • Mechanical Work: <strong>${r.bio.workFlatKJ} kJ</strong> flat + <strong>${r.bio.workClimbKJ} kJ</strong> climb<br>
                    • Reserve Margin: <strong>${r.bio.remainingO2} L</strong> (${r.bio.status})
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
  };
})();

/* ============================================================================
 * 3. APPLICATION STATE & MULTI-FACTOR RECOMMENDATION ENGINE
 * ============================================================================ */
const AppState = {
  startKey: 'butler',
  destKey: 'belva',
  selectedRoute: 'A',
  followRecommended: true,
  priority: 'balanced',
  mapLayer: 'hirise',
  orbitalOpacity: 1.0,
  usgsGeoVisible: true,
  usgsOpacity: 0.34,
  molaVisible: false,
  molaOpacity: 0.45,
  roverTraverseVisible: true,
  routesVisible: true,
  dustTau: 0.5,
  attenuationK: 1.5,
  suitMassKg: 165,
  o2CapacityL: 550,
  emergencyMode: false,
  autoDustEmergency: false,
  manualEmergencyLock: false,
  visorOpen: false,
  scienceInspectKey: 'belva',
  // Interactive GIS Map Tool States
  mapTool: 'inspect',        // 'inspect' | 'ruler'
  rulerPoints: [],           // [{ lat, lon }]
  customPins: [],            // [{ id, lat, lon, label }]
  elevProfileVisible: false,
  profileScrubT: null        // 0..1 progress along active route when scrubbing profile
};
window.AppState = AppState;

function evaluateRecommendation(routesMap) {
  const keys = ['A', 'B', 'C'];
  const vis = routesMap.A.visibility;
  const clearSkyBonus = Math.max(0, (vis.factor - 0.52) / 0.35);
  const hazeSeverity = Math.max(0, Math.min(1, (0.46 - vis.factor) / 0.38));
  const heavyLoadFactor = Math.max(0, (AppState.suitMassKg - 165) / 55);
  const lightLoadBonus = Math.max(0, (165 - AppState.suitMassKg) / 45);

  const weights = {
    balanced: { o2: 0.26, safety: 0.25, science: 0.31, speed: 0.18 },
    oxygen:   { o2: 0.78, safety: 0.10, science: 0.06, speed: 0.06 },
    safety:   { o2: 0.10, safety: 0.80, science: 0.05, speed: 0.05 },
    science:  { o2: 0.10, safety: 0.12, science: 0.72, speed: 0.06 },
    speed:    { o2: 0.06, safety: 0.06, science: 0.06, speed: 0.82 }
  }[AppState.priority] || { o2: 0.26, safety: 0.25, science: 0.31, speed: 0.18 };

  const w = { ...weights };
  if (AppState.priority === 'balanced') {
    w.safety += hazeSeverity * 0.65;
    w.o2 += heavyLoadFactor * 0.55;
    w.speed += (clearSkyBonus * 0.32) + (lightLoadBonus * 0.28);
  } else if (hazeSeverity > 0.45 && AppState.priority !== 'speed') {
    w.safety += hazeSeverity * 0.45;
  }

  const minO2 = Math.min(...keys.map(k => routesMap[k].bio.o2Liters));
  const maxO2 = Math.max(...keys.map(k => routesMap[k].bio.o2Liters));
  const o2Spread = Math.max(15, maxO2 - minO2);

  const raw = {};
  keys.forEach(k => {
    const r = routesMap[k];
    const o2Efficiency = 1 - ((r.bio.o2Liters - minO2) / o2Spread) * 0.78;
    const climbPenalty = heavyLoadFactor * (r.bio.deltaH / 120) * 0.32;
    const o2Score = Math.max(0, o2Efficiency - climbPenalty) + (!r.bio.feasible ? -0.9 : 0);

    const dustPen = hazeSeverity * (k === 'C' ? 0.48 : k === 'A' ? 0.36 : 0.0);
    const safetyScore = Math.max(0, r.safetyScore - dustPen);

    const speedScore = 0.55 * Math.pow(routesMap.C.hours / Math.max(0.5, r.hours), 1.35) +
                       0.45 * Math.pow(routesMap.C.distance / Math.max(0.5, r.distance), 1.35);

    raw[k] = w.o2 * o2Score + w.safety * safetyScore + w.science * (r.scienceTargets / 3) + w.speed * speedScore;
  });

  let bestKey = keys.reduce((best, k) => raw[k] > raw[best] ? k : best, 'A');
  const maxRaw = Math.max(...keys.map(k => raw[k]), 0.01);
  const scores = {};
  keys.forEach(k => scores[k] = Math.max(12, Math.min(99, Math.round((raw[k] / maxRaw) * 96))));

  if (AppState.emergencyMode) {
    bestKey = 'C';
    scores.C = 99;
    const station = Landmarks[AppState.startKey] || Landmarks.butler;
    return {
      bestKey, scores,
      reason: `⚠ EMERGENCY OVERRIDE (τ = ${AppState.dustTau.toFixed(1)}): Dust storm threshold exceeded. Route C (Direct Chord — ${routesMap.C.distance} km) is auto-selected as the shortest geometric return path to ${station.name}.`
    };
  }

  const win = routesMap[bestKey];
  const reasons = {
    A: `Route A (${win.name}) leads (${scores.A} pts) with firm bedrock traction (μ = 0.16) and all 3 primary science targets (Δh +${win.bio.deltaH} m, ${win.bio.o2Liters} L O₂).`,
    B: `Route B (${win.name}) leads (${scores.B} pts) with minimal climb (Δh +${win.bio.deltaH} m), lowest O₂ expenditure (${win.bio.o2Liters} L, ${win.bio.remainingO2} L reserve), and Very Low terrain hazard${vis.pct < 45 ? ` under ${vis.pct}% dust visibility` : ''}.`,
    C: `Route C (${win.name}) leads (${scores.C} pts) as the fastest, shortest geometric chord (${win.distance} km, ${win.hours} hrs), trading boulder friction (μ = 0.29) for speed.`
  };
  return { bestKey, scores, reason: reasons[bestKey] };
}

/* ============================================================================
 * 4. INTERACTIVE MULTI-LAYER PLANETARY GIS CANVAS & CROSS-SECTION ENGINE
 * ============================================================================ */
const DEFAULT_VIEW = { centerLat: 18.4620, centerLon: 77.4150, zoom: 13.0 };
const Camera = {
  ...DEFAULT_VIEW,
  dragging: false,
  startX: 0,
  startY: 0,
  moved: false,
  pinchDist: 0,
  cursorScreen: null,
  hoverUnit: null,
  hoverLandmark: null,
  hoverRoute: null,
  hoverSol: null,
  hoverCustomPin: null,
  lastRoutes: null,
  flyAnimId: null,
  pulsePhase: 0
};

const FLYOVERS = {
  overview: { lat: 18.4620, lon: 77.4150, zoom: 13.0, label: 'Jezero Overview' },
  delta:    { lat: 18.4760, lon: 77.3860, zoom: 13.9, label: 'Western Delta Fan (HNd)' },
  belva:    { lat: 18.4800, lon: 77.3800, zoom: 14.6, label: 'Belva Crater' },
  neretva:  { lat: 18.5020, lon: 77.3450, zoom: 14.0, label: 'Neretva Vallis Inlet (Hl)' },
  seitah:   { lat: 18.4250, lon: 77.5600, zoom: 12.7, label: 'Séítah Olivine Floor (Nol)' }
};

const WMTS_LAYERS = {
  hirise: { badge: 'NASA Mars Trek WMTS · HiRISE 25 cm/px', layer: 'JEZ_hirise_soc_006_orthoMosaic_25cm_Eqc_latTs0_lon0_first_dd', ext: 'png' },
  ctx:    { badge: 'NASA Mars Trek WMTS · CTX 6 m/px', layer: 'JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0_first_dd', ext: 'png' },
  midway: { badge: 'NASA Mars Trek WMTS · Jezero–Midway Blend', layer: 'Jezero_Midway_HiRISE_CTX_HRSC_blend_25cm', ext: 'png' },
  mola:   { badge: 'ASU / NASA MGS MOLA Relief (463 m/px)', layer: 'Mars_MGS_MOLA_ClrShade_merge_global_463m', ext: 'jpg' }
};

const TileCache = new Map();
function getTileImage(layer, ext, z, x, y, onReady) {
  const key = `${layer}/${z}/${x}/${y}`;
  if (TileCache.has(key)) return TileCache.get(key);
  const entry = { status: 'loading', img: new Image() };
  entry.img.crossOrigin = 'anonymous';
  entry.img.onload = () => { entry.status = 'loaded'; if (onReady) onReady(); };
  entry.img.onerror = () => { entry.status = 'error'; };
  entry.img.src = `https://trek.nasa.gov/tiles/Mars/EQ/${layer}/1.0.0/default/default028mm/${z}/${y}/${x}.${ext}`;
  TileCache.set(key, entry);
  return entry;
}

const COS_LAT = Math.cos((18.45 * Math.PI) / 180);
const ppd = () => (256 / 180) * Math.pow(2, Camera.zoom);
const toScreen = (lat, lon, w, h) => ({
  x: w / 2 + (lon - Camera.centerLon) * ppd() * COS_LAT,
  y: h / 2 - (lat - Camera.centerLat) * ppd()
});
const toGeo = (x, y, w, h) => ({
  lon: Camera.centerLon + (x - w / 2) / (ppd() * COS_LAT),
  lat: Camera.centerLat - (y - h / 2) / ppd()
});

function inPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
    if (((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / ((yj - yi) || 1e-9) + xi)) inside = !inside;
  }
  return inside;
}

function segDistSq(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (!l2) return (px - x1) ** 2 + (py - y1) ** 2;
  const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2));
  return (px - (x1 + t * (x2 - x1))) ** 2 + (py - (y1 + t * (y2 - y1))) ** 2;
}

// Quadratic Bezier point sampler for route curves (t in [0, 1])
function sampleRoutePoint(points, t) {
  if (!points || !points.length) return { lat: 18.46, lon: 77.41 };
  if (points.length === 3) {
    const [p0, p1, p2] = points;
    const u = 1 - t;
    return {
      lat: u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      lon: u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]
    };
  }
  const idx = Math.min(points.length - 2, Math.floor(t * (points.length - 1)));
  const localT = (t * (points.length - 1)) - idx;
  return {
    lat: points[idx][0] + (points[idx + 1][0] - points[idx][0]) * localT,
    lon: points[idx][1] + (points[idx + 1][1] - points[idx][1]) * localT
  };
}

function findUsgsUnitAt(lat, lon) {
  for (let i = UsgsGeologicUnits.length - 1; i >= 0; i--) {
    const u = UsgsGeologicUnits[i];
    let inside = false;
    for (let a = 0, b = u.coords.length - 1; a < u.coords.length; b = a++) {
      const [yi, xi] = u.coords[a], [yj, xj] = u.coords[b];
      if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / ((yj - yi) || 1e-9) + xi)) inside = !inside;
    }
    if (inside) return u;
  }
  return null;
}

function showPopover(html) {
  $('mapPopoverContent').innerHTML = html;
  $('mapPopover').classList.add('visible');
}
function hidePopover() { $('mapPopover').classList.remove('visible'); }

function setMapStartFromPopover(siteId) {
  if (!Landmarks[siteId]) return;
  AppState.startKey = siteId;
  $('startSelect').value = siteId;
  updateAll();
  inspectLandmark(Landmarks[siteId]);
  showToast(`Main Station set: ${Landmarks[siteId].shortName}`);
}
window.setMapStartFromPopover = setMapStartFromPopover;

function setMapDestFromPopover(siteId) {
  if (!Landmarks[siteId]) return;
  AppState.destKey = siteId;
  $('destSelect').value = siteId;
  if ($('copilotCoordInput')) {
    $('copilotCoordInput').value = `${Landmarks[siteId].lat.toFixed(4)}, ${Landmarks[siteId].lon.toFixed(4)}`;
  }
  updateAll();
  inspectLandmark(Landmarks[siteId]);
  showToast(`Destination set: ${Landmarks[siteId].shortName}`);
}
window.setMapDestFromPopover = setMapDestFromPopover;

function dropCustomMapPin(lat, lon) {
  const idx = AppState.customPins.length + 1;
  AppState.customPins.push({ id: `pin_${Date.now()}`, lat: Number(lat), lon: Number(lon), label: `Pin #${idx}` });
  drawMap();
  showToast(`Dropped Custom Marker Pin #${idx}`);
}
window.dropCustomMapPin = dropCustomMapPin;

function removeCustomMapPin(id) {
  AppState.customPins = AppState.customPins.filter(p => p.id !== id);
  hidePopover();
  drawMap();
  showToast('Custom marker removed');
}
window.removeCustomMapPin = removeCustomMapPin;

function inspectUsgsUnit(unit) {
  const cLat = (unit.coords.reduce((s, c) => s + c[0], 0) / unit.coords.length).toFixed(4);
  const cLon = (unit.coords.reduce((s, c) => s + c[1], 0) / unit.coords.length).toFixed(4);
  showPopover(`
    <span style="background:${unit.color}; color:#fff; font-family:var(--font-mono); font-weight:700; font-size:9.5px; padding:2px 6px; border-radius:4px;">USGS UNIT ${unit.code}</span>
    <strong style="display:block; font-family:var(--font-display); margin-top:5px; font-size:14px;">${unit.name}</strong>
    <div style="color:var(--muted); font-size:10.5px; margin-bottom:5px;">${unit.age} · Slope ~${unit.slopeDeg}°</div>
    <p style="margin:0 0 6px;">${unit.lithology}</p>
    <div style="font-size:11px; font-weight:700; color:var(--green); margin-bottom:7px;">Mobility: ${unit.evaGuidance}</div>
    <button type="button" class="copilot-btn primary" style="width:100%;" onclick="window.openCopilotForCoords(${cLat}, ${cLon}, 'USGS Unit ${unit.code}')">🤖 AI Coordinate Report</button>
  `);
}

function inspectLandmark(site) {
  const isStart = AppState.startKey === site.id;
  const isDest = AppState.destKey === site.id;
  showPopover(`
    <span class="badge badge-nasa">${site.role}</span>
    <strong style="display:block; font-family:var(--font-display); margin-top:4px; font-size:14px; color:var(--accent);">${site.name}</strong>
    <div style="font-family:var(--font-mono); font-size:10px; color:var(--blue); font-weight:700; margin-bottom:4px;">${site.lat.toFixed(4)}°N, ${site.lon.toFixed(4)}°E · ${site.elevM} m MOLA</div>
    <p style="margin:0 0 6px;">${site.description}</p>
    <div style="font-size:10.5px; font-weight:700; color:var(--green); margin-bottom:7px;">CRISM ${site.crismId}: ${site.minerals.map(m => m.name).join(', ')}</div>
    <button type="button" class="copilot-btn primary" style="width:100%;" onclick="window.openCopilotForCoords(${site.lat}, ${site.lon}, '${site.shortName}')">🤖 AI Site Briefing</button>
    <div class="popover-actions">
      <button type="button" class="copilot-btn" ${isStart ? 'disabled' : ''} onclick="window.setMapStartFromPopover('${site.id}')">${isStart ? '✓ Main Station' : '⚑ Set Start'}</button>
      <button type="button" class="copilot-btn" ${isDest ? 'disabled' : ''} onclick="window.setMapDestFromPopover('${site.id}')">${isDest ? '✓ Destination' : '🎯 Set Dest'}</button>
    </div>
  `);
}

function flyMapTo(lat, lon, zoom = 13.8) {
  if (Camera.flyAnimId) cancelAnimationFrame(Camera.flyAnimId);
  const startLat = Camera.centerLat, startLon = Camera.centerLon, startZoom = Camera.zoom;
  const targetLat = Number(lat), targetLon = Number(lon);
  const targetZoom = Math.max(11.2, Math.min(16.2, Number(zoom)));
  const duration = 420;
  const t0 = performance.now();

  const step = (now) => {
    const rawT = Math.min(1, (now - t0) / duration);
    const ease = 1 - Math.pow(1 - rawT, 3); // smooth cubic ease-out
    Camera.centerLat = startLat + (targetLat - startLat) * ease;
    Camera.centerLon = startLon + (targetLon - startLon) * ease;
    Camera.zoom = startZoom + (targetZoom - startZoom) * ease;
    $('coordReadout').textContent = `${Camera.centerLat.toFixed(4)}°N, ${Camera.centerLon.toFixed(4)}°E · IAU2000:49900`;
    drawMap();
    if (rawT < 1) Camera.flyAnimId = requestAnimationFrame(step);
    else Camera.flyAnimId = null;
  };
  Camera.flyAnimId = requestAnimationFrame(step);
}
window.flyMapTo = flyMapTo;

function setMapTool(tool) {
  AppState.mapTool = tool;
  $('toolInspectBtn')?.classList.toggle('active', tool === 'inspect');
  $('toolRulerBtn')?.classList.toggle('active', tool === 'ruler');
  $('rulerHud')?.classList.toggle('visible', tool === 'ruler');
  updateRulerReadout();
  drawMap();
}

function updateRulerReadout() {
  const el = $('rulerReadout');
  if (!el) return;
  const pts = AppState.rulerPoints;
  if (!pts.length) {
    el.innerHTML = 'Click anywhere on the map to drop geodesic measurement points.';
    return;
  }
  if (pts.length === 1) {
    el.innerHTML = `<strong>P1:</strong> ${pts[0].lat.toFixed(4)}°N, ${pts[0].lon.toFixed(4)}°E<br>Click a second point to measure chord distance &amp; O₂.`;
    return;
  }
  let totalKm = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    totalKm += window.computeMarsChordKm(pts[i], pts[i + 1]);
  }
  const lastBrg = window.computeBearingDeg(pts[pts.length - 2], pts[pts.length - 1]);
  const vis = window.computeVisibility(AppState.dustTau, AppState.attenuationK);
  const estHours = totalKm / Math.max(0.3, 1.42 * vis.speedFactor);
  const estO2 = window.computeMetabolicCost(totalKm, 25, 0.19, AppState.suitMassKg, estHours, vis.factor).o2Liters;
  el.innerHTML = `
    <strong>Segments:</strong> ${pts.length - 1} · <strong>Total Dist:</strong> <span style="color:var(--accent)">${totalKm.toFixed(2)} km</span> (${Math.round(totalKm * 1000)} m)<br>
    <strong>Last Bearing:</strong> ${lastBrg}° · <strong>Est. EVA:</strong> ${estHours.toFixed(1)} hrs (~${estO2} L O₂)
  `;
}

function drawElevationProfile() {
  const panel = $('elevProfilePanel');
  const canvas = $('elevProfileCanvas');
  if (!panel || !canvas || !AppState.elevProfileVisible) return;

  const start = Landmarks[AppState.startKey] || Landmarks.butler;
  const dest = Landmarks[AppState.destKey] || Landmarks.belva;
  const routes = window.getSimulatedRoutes(start, dest, AppState.suitMassKg, AppState.dustTau, AppState.o2CapacityL);
  const active = routes[AppState.selectedRoute] || routes.A;

  $('elevProfileTitle').textContent = `Route ${active.key} (${active.name}) · Elevation & Geologic Profile (${active.distance} km)`;

  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(260, Math.round(rect.width)), h = Math.max(90, Math.round(rect.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const padL = 46, padR = 16, padT = 14, padB = 22;
  const plotW = w - padL - padR, plotH = h - padT - padB;

  // Sample 48 points along the active route curve
  const samples = [];
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const geo = sampleRoutePoint(active.points, t);
    const u = findUsgsUnitAt(geo.lat, geo.lon);
    // Synthesize smooth terrain elevation curve matching start->dest + route scarp arch
    const arch = active.key === 'A' ? Math.sin(t * Math.PI) * 38 : active.key === 'C' ? Math.sin(t * Math.PI * 2) * 14 : Math.sin(t * Math.PI) * 8;
    const elev = Math.round(start.elevM + (dest.elevM - start.elevM) * t + arch);
    samples.push({ t, geo, elev, unit: u });
  }

  const minE = Math.min(...samples.map(s => s.elev)) - 15;
  const maxE = Math.max(...samples.map(s => s.elev)) + 15;
  const spanE = Math.max(20, maxE - minE);

  // Horizontal grid lines
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(27,21,18,0.08)';
  ctx.lineWidth = 1;
  ctx.font = '700 9px "Space Mono", monospace';
  ctx.fillStyle = isDark ? '#9e8d7d' : '#7a695c';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  [0, 0.5, 1].forEach(frac => {
    const y = padT + plotH * (1 - frac);
    const eVal = Math.round(minE + spanE * frac);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    ctx.fillText(`${eVal}m`, padL - 6, y);
  });

  // Fill terrain polygon under curve
  ctx.beginPath();
  samples.forEach((s, i) => {
    const x = padL + s.t * plotW;
    const y = padT + plotH * (1 - (s.elev - minE) / spanE);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(padL + plotW, padT + plotH);
  ctx.lineTo(padL, padT + plotH);
  ctx.closePath();
  const fillGrad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
  fillGrad.addColorStop(0, active.color + '66');
  fillGrad.addColorStop(1, active.color + '12');
  ctx.fillStyle = fillGrad;
  ctx.fill();

  // Stroke elevation line
  ctx.strokeStyle = active.color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  samples.forEach((s, i) => {
    const x = padL + s.t * plotW;
    const y = padT + plotH * (1 - (s.elev - minE) / spanE);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Distance axis ticks
  ctx.fillStyle = isDark ? '#9e8d7d' : '#7a695c';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  [0, 0.25, 0.5, 0.75, 1].forEach(frac => {
    const x = padL + frac * plotW;
    ctx.fillText(`${(active.distance * frac).toFixed(1)} km`, x, padT + plotH + 5);
  });

  // Scrub cursor indicator
  if (AppState.profileScrubT !== null) {
    const t = Math.max(0, Math.min(1, AppState.profileScrubT));
    const idx = Math.min(N, Math.round(t * N));
    const cur = samples[idx];
    const cx = padL + t * plotW;
    const cy = padT + plotH * (1 - (cur.elev - minE) / spanE);

    ctx.strokeStyle = '#cf4724';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(cx, padT); ctx.lineTo(cx, padT + plotH); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#cf4724';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    const unitTag = cur.unit ? `USGS ${cur.unit.code}` : 'Crater Rim';
    $('elevProfileReadout').textContent = `${(active.distance * t).toFixed(2)} km · ${cur.elev} m MOLA · ${unitTag} (${cur.geo.lat.toFixed(4)}°N, ${cur.geo.lon.toFixed(4)}°E)`;
  }

  ctx.restore();
}

function drawMap() {
  const canvas = $('marsMapCanvas');
  if (!canvas) return;
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(300, Math.round(rect.width)), h = Math.max(360, Math.round(rect.height));

  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(dpr, dpr);

  // 1. Orbital Mosaic Base
  const pal = {
    hirise: { bg: '#633b27', ridge: '#8f593d', basin: '#4a2b1d', dust: '#b37450' },
    ctx:    { bg: '#693f2b', ridge: '#946044', basin: '#523122', dust: '#bd805b' },
    midway: { bg: '#5c3829', ridge: '#855640', basin: '#42281c', dust: '#a67153' },
    mola:   { bg: '#1e3a5f', ridge: '#b45309', basin: '#0f172a', dust: '#1d6f42' }
  }[AppState.mapLayer] || { bg: '#633b27', ridge: '#8f593d', basin: '#4a2b1d', dust: '#b37450' };

  ctx.save();
  ctx.globalAlpha = AppState.orbitalOpacity;
  const bgGrad = ctx.createRadialGradient(w * 0.58, h * 0.54, 40, w * 0.45, h * 0.5, Math.max(w, h) * 0.85);
  bgGrad.addColorStop(0, pal.basin); bgGrad.addColorStop(0.55, pal.bg); bgGrad.addColorStop(1, pal.ridge);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle 0.05° planetary graticule
  ctx.strokeStyle = 'rgba(255, 236, 214, 0.09)';
  ctx.lineWidth = 1;
  for (let lat = 18.30; lat <= 18.60; lat += 0.05) {
    const p = toScreen(lat, 77.4, w, h);
    ctx.beginPath(); ctx.moveTo(0, p.y); ctx.lineTo(w, p.y); ctx.stroke();
  }
  for (let lon = 77.25; lon <= 77.75; lon += 0.05) {
    const p = toScreen(18.45, lon, w, h);
    ctx.beginPath(); ctx.moveTo(p.x, 0); ctx.lineTo(p.x, h); ctx.stroke();
  }

  // Delta fan & Neretva channel relief
  const apex = toScreen(18.500, 77.340, w, h), east = toScreen(18.470, 77.420, w, h);
  const south = toScreen(18.445, 77.385, w, h), north = toScreen(18.508, 77.388, w, h);
  const fanGrad = ctx.createLinearGradient(apex.x, apex.y, east.x, east.y);
  fanGrad.addColorStop(0, pal.dust); fanGrad.addColorStop(1, 'rgba(179,116,80,0.25)');
  ctx.fillStyle = fanGrad;
  ctx.beginPath();
  ctx.moveTo(apex.x, apex.y);
  ctx.quadraticCurveTo(north.x, north.y, east.x, east.y);
  ctx.quadraticCurveTo(south.x, south.y, apex.x, apex.y);
  ctx.fill();

  const inlet = toScreen(18.525, 77.280, w, h);
  ctx.strokeStyle = pal.basin;
  ctx.lineWidth = Math.max(6, ppd() * 0.0065);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(inlet.x, inlet.y);
  ctx.bezierCurveTo((inlet.x + apex.x) * 0.5, inlet.y + 18, apex.x - 24, apex.y - 10, apex.x, apex.y);
  ctx.stroke();

  const belvaPt = toScreen(18.4800, 77.3800, w, h);
  const belvaR = Math.max(10, ppd() * 0.0075);
  ctx.strokeStyle = 'rgba(255,224,198,0.34)'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(belvaPt.x, belvaPt.y, belvaR, 0, Math.PI * 2); ctx.stroke();

  // Non-blocking WMTS tiles when online
  const cfg = WMTS_LAYERS[AppState.mapLayer];
  if (cfg) {
    const z = Math.max(10, Math.min(14, Math.round(Camera.zoom)));
    const cols = Math.pow(2, z + 1), rows = Math.pow(2, z);
    const tl = toGeo(0, 0, w, h), br = toGeo(w, h, w, h);
    const minX = Math.max(0, Math.floor(((tl.lon + 180) / 360) * cols));
    const maxX = Math.min(cols - 1, Math.floor(((br.lon + 180) / 360) * cols));
    const minY = Math.max(0, Math.floor(((90 - tl.lat) / 180) * rows));
    const maxY = Math.min(rows - 1, Math.floor(((90 - br.lat) / 180) * rows));

    if ((maxX - minX + 1) * (maxY - minY + 1) <= 24) {
      for (let tx = minX; tx <= maxX; tx++) {
        for (let ty = minY; ty <= maxY; ty++) {
          const p0 = toScreen(90 - (ty / rows) * 180, (tx / cols) * 360 - 180, w, h);
          const p1 = toScreen(90 - ((ty + 1) / rows) * 180, ((tx + 1) / cols) * 360 - 180, w, h);
          const tile = getTileImage(cfg.layer, cfg.ext, z, tx, ty, drawMap);
          if (tile.status === 'loaded') ctx.drawImage(tile.img, p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
        }
      }
    }
  }
  ctx.restore();

  // 2. MOLA Overlay
  if (AppState.molaVisible) {
    ctx.save();
    ctx.globalAlpha = AppState.molaOpacity;
    const wh = toScreen(18.50, 77.30, w, h), el = toScreen(18.41, 77.69, w, h);
    const grad = ctx.createLinearGradient(wh.x, wh.y, el.x, el.y);
    grad.addColorStop(0, '#c82828'); grad.addColorStop(0.35, '#eab308'); grad.addColorStop(0.7, '#1d6f42'); grad.addColorStop(1, '#1c5d8c');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // 3. USGS Geologic Units
  if (AppState.usgsGeoVisible) {
    UsgsGeologicUnits.forEach(u => {
      const pts = u.coords.map(([lat, lon]) => toScreen(lat, lon, w, h));
      const hover = Camera.hoverUnit === u.code;
      ctx.save();
      ctx.beginPath();
      pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle = u.color;
      ctx.globalAlpha = hover ? Math.min(0.75, AppState.usgsOpacity + 0.18) : AppState.usgsOpacity;
      ctx.fill();
      ctx.globalAlpha = hover ? 0.95 : 0.65;
      ctx.strokeStyle = hover ? '#fff' : u.color;
      ctx.lineWidth = hover ? 2.4 : 1.2;
      ctx.stroke();

      const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = 'rgba(27,21,18,0.82)';
      ctx.beginPath(); ctx.roundRect(cx - 17, cy - 8, 34, 16, 4); ctx.fill();
      ctx.fillStyle = '#fbf8f2'; ctx.font = '700 9.5px "Space Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(u.code, cx, cy);
      ctx.restore();
    });
  }

  // 4. Perseverance Traverse, Interactive Sol Nodes & Callouts
  if (AppState.roverTraverseVisible) {
    ctx.save();
    const rPts = PerseveranceTraverse.map(p => toScreen(p.lat, p.lon, w, h));
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2.2; ctx.setLineDash([5, 4]);
    ctx.beginPath();
    rPts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke(); ctx.setLineDash([]);

    // Interactive Sol milestone dots
    PerseveranceTraverse.forEach((node, idx) => {
      const pt = rPts[idx];
      const isHover = Camera.hoverSol === node.sol;
      ctx.fillStyle = isHover ? '#fff' : '#fbbf24';
      ctx.strokeStyle = '#1b1512';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isHover ? 5.5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    RegionCallouts.forEach(reg => {
      const pt = toScreen(reg.lat, reg.lon, w, h);
      if (pt.x < 40 || pt.x > w - 40 || pt.y < 40 || pt.y > h - 40) return;
      ctx.strokeStyle = 'rgba(251,248,242,0.75)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(pt.x + 12, pt.y - 16); ctx.stroke();
      ctx.fillStyle = 'rgba(27,21,18,0.86)'; ctx.strokeStyle = 'rgba(251,191,36,0.7)';
      ctx.beginPath(); ctx.roundRect(pt.x + 12, pt.y - 34, 174, 26, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fde68a'; ctx.font = '700 8px "Space Mono", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(reg.title, pt.x + 17, pt.y - 30);
      ctx.fillStyle = '#f3ede2'; ctx.font = '600 8px Inter, sans-serif';
      ctx.fillText(reg.sub, pt.x + 17, pt.y - 19);
    });
    ctx.restore();
  }

  // 5. EVA Routes & Landmarks
  const startPlace = Landmarks[AppState.startKey] || Landmarks.butler;
  const destPlace = Landmarks[AppState.destKey] || Landmarks.belva;
  const routesMap = window.getSimulatedRoutes(startPlace, destPlace, AppState.suitMassKg, AppState.dustTau, AppState.o2CapacityL);
  const rec = evaluateRecommendation(routesMap);
  Camera.lastRoutes = routesMap;

  if (AppState.routesVisible) {
    const drawOrder = ['A', 'B', 'C'].sort((a, b) => (a === AppState.selectedRoute ? 1 : b === AppState.selectedRoute ? -1 : 0));
    drawOrder.forEach(k => {
      const r = routesMap[k];
      const sel = AppState.selectedRoute === k, isRec = rec.bestKey === k, hov = Camera.hoverRoute === k;
      const pts = r.points.map(([lat, lon]) => toScreen(lat, lon, w, h));
      ctx.save();
      if (sel || isRec) {
        ctx.strokeStyle = isRec ? 'rgba(92, 214, 141, 0.45)' : 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = sel ? 10 : 8;
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        pts.length === 3 ? ctx.quadraticCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y) : pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }
      ctx.strokeStyle = r.color;
      ctx.lineWidth = sel ? 5.0 : hov ? 3.8 : 2.5;
      ctx.globalAlpha = sel ? 1 : 0.72;
      if (!sel) ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      pts.length === 3 ? ctx.quadraticCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y) : pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke(); ctx.setLineDash([]);

      // Directional midpoint chevron along active route
      if (sel && pts.length === 3) {
        const pMid = sampleRoutePoint(r.points, 0.52);
        const pNext = sampleRoutePoint(r.points, 0.56);
        const s0 = toScreen(pMid.lat, pMid.lon, w, h);
        const s1 = toScreen(pNext.lat, pNext.lon, w, h);
        const ang = Math.atan2(s1.y - s0.y, s1.x - s0.x);
        ctx.save();
        ctx.translate(s0.x, s0.y);
        ctx.rotate(ang);
        ctx.fillStyle = '#fbf8f2';
        ctx.beginPath();
        ctx.moveTo(6, 0); ctx.lineTo(-4, -4); ctx.lineTo(-4, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      const mid = pts[1] || pts[0];
      const tagText = isRec ? `★ Route ${k} (Rec)` : `Route ${k}`;
      ctx.font = '700 9px "Space Mono", monospace';
      const boxW = ctx.measureText(tagText).width + 14;
      ctx.fillStyle = sel ? r.color : 'rgba(27,21,18,0.9)';
      ctx.strokeStyle = isRec ? '#5cd68d' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = isRec ? 1.5 : 1;
      ctx.beginPath(); ctx.roundRect(mid.x - boxW / 2, mid.y - 10, boxW, 19, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fbf8f2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(tagText, mid.x, mid.y);
      ctx.restore();
    });

    // Elevation profile scrub scout marker on active route
    if (AppState.elevProfileVisible && AppState.profileScrubT !== null) {
      const actRoute = routesMap[AppState.selectedRoute] || routesMap.A;
      const geo = sampleRoutePoint(actRoute.points, AppState.profileScrubT);
      const sp = toScreen(geo.lat, geo.lon, w, h);
      ctx.save();
      ctx.fillStyle = 'rgba(207, 71, 36, 0.32)';
      ctx.beginPath(); ctx.arc(sp.x, sp.y, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#cf4724';
      ctx.strokeStyle = '#fbf8f2';
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(sp.x, sp.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    if (AppState.emergencyMode) {
      const em = window.computeEmergencyRoute(AppState.destKey, startPlace, AppState.suitMassKg, 200, AppState.dustTau);
      const p0 = toScreen(em.points[0][0], em.points[0][1], w, h), p1 = toScreen(em.points[1][0], em.points[1][1], w, h);
      ctx.save(); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4; ctx.setLineDash([10, 6]);
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke(); ctx.restore();
    }

    Object.values(Landmarks).forEach(site => {
      const pt = toScreen(site.lat, site.lon, w, h);
      const isStart = site.id === AppState.startKey, isDest = site.id === AppState.destKey;
      const rad = (isStart || isDest) ? 8 : Camera.hoverLandmark === site.id ? 7.5 : 6;
      ctx.save();

      // Halo ring on active Main Station & Destination
      if (isStart || isDest) {
        ctx.strokeStyle = isStart ? 'rgba(29, 111, 66, 0.55)' : 'rgba(207, 71, 36, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, rad + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = isStart ? '#1d6f42' : isDest ? '#cf4724' : site.color;
      ctx.strokeStyle = '#fbf8f2'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, rad, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      const label = isStart ? `⚑ ${site.shortName}` : isDest ? `🎯 ${site.shortName}` : site.shortName;
      ctx.font = '700 9px "Space Mono", monospace';
      const tw = ctx.measureText(label).width + 12;
      ctx.fillStyle = 'rgba(27,21,18,0.92)';
      ctx.beginPath(); ctx.roundRect(pt.x - tw / 2, pt.y - rad - 21, tw, 17, 5); ctx.fill();
      ctx.fillStyle = '#fbf8f2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, pt.x, pt.y - rad - 12);
      ctx.restore();
    });
  }

  // 6. Custom Dropped Pins
  AppState.customPins.forEach(pin => {
    const pt = toScreen(pin.lat, pin.lon, w, h);
    const hov = Camera.hoverCustomPin === pin.id;
    ctx.save();
    ctx.fillStyle = '#0ea5e9';
    ctx.strokeStyle = '#fbf8f2';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, hov ? 7.5 : 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.font = '700 9px "Space Mono", monospace';
    const tw = ctx.measureText(`📌 ${pin.label}`).width + 10;
    ctx.fillStyle = 'rgba(14, 116, 144, 0.92)';
    ctx.beginPath(); ctx.roundRect(pt.x - tw / 2, pt.y - 25, tw, 16, 5); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`📌 ${pin.label}`, pt.x, pt.y - 17);
    ctx.restore();
  });

  // 7. Interactive Geodesic Ruler Overlay
  if (AppState.rulerPoints.length > 0) {
    const rPts = AppState.rulerPoints.map(p => toScreen(p.lat, p.lon, w, h));
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.8;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    rPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    if (AppState.mapTool === 'ruler' && Camera.cursorScreen) {
      ctx.lineTo(Camera.cursorScreen.x, Camera.cursorScreen.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 0; i < rPts.length - 1; i++) {
      const segKm = window.computeMarsChordKm(AppState.rulerPoints[i], AppState.rulerPoints[i + 1]);
      const mx = (rPts[i].x + rPts[i + 1].x) / 2;
      const my = (rPts[i].y + rPts[i + 1].y) / 2;
      const txt = `${segKm.toFixed(2)} km`;
      ctx.font = '700 9px "Space Mono", monospace';
      const bw = ctx.measureText(txt).width + 10;
      ctx.fillStyle = 'rgba(12, 74, 110, 0.92)';
      ctx.beginPath(); ctx.roundRect(mx - bw / 2, my - 9, bw, 17, 5); ctx.fill();
      ctx.fillStyle = '#e0f2fe'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, mx, my);
    }

    rPts.forEach((p, idx) => {
      ctx.fillStyle = '#0284c7';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = '700 8.5px "Space Mono", monospace';
      ctx.fillStyle = '#fff';
      ctx.fillText(`P${idx + 1}`, p.x, p.y - 12);
    });
    ctx.restore();
  }

  // 8. Dynamic Kilometers Scale Bar & North Compass Rose (Bottom-Left above Legend)
  ctx.save();
  const kmPerDegLat = (2 * Math.PI * 3389.5) / 360; // ~59.16 km/deg on Mars
  const pxPerKm = ppd() / kmPerDegLat;
  const niceKm = [0.25, 0.5, 1, 2, 5, 10].find(k => k * pxPerKm >= 55 && k * pxPerKm <= 135) || 2;
  const barPx = Math.round(niceKm * pxPerKm);
  const sbX = 14, sbY = h - 54;

  ctx.fillStyle = 'rgba(27, 21, 18, 0.84)';
  ctx.beginPath(); ctx.roundRect(sbX - 4, sbY - 16, barPx + 46, 24, 6); ctx.fill();
  ctx.strokeStyle = '#fbf8f2'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sbX + 4, sbY - 3); ctx.lineTo(sbX + 4, sbY + 2);
  ctx.lineTo(sbX + 4 + barPx, sbY + 2); ctx.lineTo(sbX + 4 + barPx, sbY - 3);
  ctx.stroke();
  ctx.fillStyle = '#fbf8f2'; ctx.font = '700 9px "Space Mono", monospace';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(`${niceKm} km`, sbX + barPx + 10, sbY - 2);

  // Compact North Rose Badge
  const nrX = w - 28, nrY = 62;
  ctx.fillStyle = 'rgba(27, 21, 18, 0.84)';
  ctx.beginPath(); ctx.arc(nrX, nrY, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#cf4724';
  ctx.beginPath(); ctx.moveTo(nrX, nrY - 10); ctx.lineTo(nrX - 4, nrY); ctx.lineTo(nrX + 4, nrY); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fbf8f2';
  ctx.beginPath(); ctx.moveTo(nrX, nrY + 10); ctx.lineTo(nrX - 4, nrY); ctx.lineTo(nrX + 4, nrY); ctx.closePath(); ctx.fill();
  ctx.font = '700 8px "Space Mono", monospace'; ctx.textAlign = 'center';
  ctx.fillText('N', nrX, nrY - 19);
  ctx.restore();

  if (AppState.dustTau > 0.8) {
    ctx.save();
    ctx.fillStyle = `rgba(194,114,66,${Math.min(0.42, (AppState.dustTau - 0.8) * 0.14).toFixed(2)})`;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  ctx.restore();
}

function initMapInteractions() {
  const canvas = $('marsMapCanvas');
  if (!canvas) return;
  const hoverTip = $('mapHoverTip');

  const hitTest = (x, y, w, h) => {
    for (const pin of AppState.customPins) {
      const pt = toScreen(pin.lat, pin.lon, w, h);
      if ((x - pt.x) ** 2 + (y - pt.y) ** 2 <= 196) return { type: 'customPin', pin };
    }
    for (const s of Object.values(Landmarks)) {
      const pt = toScreen(s.lat, s.lon, w, h);
      if ((x - pt.x) ** 2 + (y - pt.y) ** 2 <= 256) return { type: 'landmark', site: s };
    }
    if (AppState.roverTraverseVisible) {
      for (const node of PerseveranceTraverse) {
        const pt = toScreen(node.lat, node.lon, w, h);
        if ((x - pt.x) ** 2 + (y - pt.y) ** 2 <= 121) return { type: 'sol', node };
      }
    }
    if (Camera.lastRoutes && AppState.routesVisible) {
      for (const k of ['A', 'B', 'C']) {
        const pts = Camera.lastRoutes[k].points.map(([lat, lon]) => toScreen(lat, lon, w, h));
        for (let i = 0; i < pts.length - 1; i++) {
          if (segDistSq(x, y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) <= 121) return { type: 'route', key: k };
        }
      }
    }
    if (AppState.usgsGeoVisible) {
      for (let i = UsgsGeologicUnits.length - 1; i >= 0; i--) {
        const u = UsgsGeologicUnits[i];
        if (inPoly(x, y, u.coords.map(([lat, lon]) => toScreen(lat, lon, w, h)))) return { type: 'usgs', unit: u };
      }
    }
    return null;
  };

  const updateHoverTooltip = (hit, x, y, w) => {
    if (!hoverTip || AppState.mapTool === 'ruler') {
      if (hoverTip) hoverTip.classList.remove('visible');
      return;
    }
    if (!hit) {
      hoverTip.classList.remove('visible');
      return;
    }
    let html = '';
    if (hit.type === 'landmark') {
      const s = hit.site;
      html = `
        <div class="map-hover-tip-kicker">${s.role}</div>
        <div class="map-hover-tip-title">${s.name}</div>
        <div class="map-hover-tip-sub">${s.elevM} m MOLA · CRISM ${s.crismId} · Click to inspect or assign</div>
      `;
    } else if (hit.type === 'route') {
      const r = Camera.lastRoutes?.[hit.key];
      if (r) {
        html = `
          <div class="map-hover-tip-kicker">Candidate EVA Corridor</div>
          <div class="map-hover-tip-title">Route ${r.key} · ${r.name}</div>
          <div class="map-hover-tip-sub">${r.distance} km · ${r.hours} hrs · ${r.bio.o2Liters} L O₂ · Click to select</div>
        `;
      }
    } else if (hit.type === 'usgs') {
      const u = hit.unit;
      html = `
        <div class="map-hover-tip-kicker">USGS Geologic Unit ${u.code}</div>
        <div class="map-hover-tip-title">${u.name}</div>
        <div class="map-hover-tip-sub">Friction μ = ${u.frictionMu} · Slope ~${u.slopeDeg}° · Click for stratigraphy</div>
      `;
    } else if (hit.type === 'sol') {
      const n = hit.node;
      html = `
        <div class="map-hover-tip-kicker">NASA Perseverance Traverse</div>
        <div class="map-hover-tip-title">Sol ${n.sol} · ${n.label}</div>
        <div class="map-hover-tip-sub">${n.lat.toFixed(4)}°N, ${n.lon.toFixed(4)}°E · Click to analyze</div>
      `;
    } else if (hit.type === 'customPin') {
      const p = hit.pin;
      html = `
        <div class="map-hover-tip-kicker">Custom Terrain Pin</div>
        <div class="map-hover-tip-title">${p.label}</div>
        <div class="map-hover-tip-sub">${p.lat.toFixed(4)}°N, ${p.lon.toFixed(4)}°E · Click for options</div>
      `;
    }
    if (html) {
      hoverTip.innerHTML = html;
      hoverTip.classList.add('visible');
      const flipLeft = x > w - 260;
      hoverTip.style.left = `${x}px`;
      hoverTip.style.top = `${y}px`;
      hoverTip.style.transform = flipLeft ? 'translate(calc(-100% - 14px), -50%)' : 'translate(14px, -50%)';
    }
  };

  const handleTapOrClick = (x, y, w, h) => {
    if (AppState.mapTool === 'ruler') {
      const geo = toGeo(x, y, w, h);
      AppState.rulerPoints.push({ lat: Number(geo.lat.toFixed(4)), lon: Number(geo.lon.toFixed(4)) });
      updateRulerReadout();
      drawMap();
      return;
    }

    const hit = hitTest(x, y, w, h);
    if (hit?.type === 'landmark') inspectLandmark(hit.site);
    else if (hit?.type === 'route') {
      AppState.followRecommended = false;
      AppState.selectedRoute = hit.key;
      updateAll();
      showToast(`Manual Override: Route ${hit.key}`);
    } else if (hit?.type === 'usgs') inspectUsgsUnit(hit.unit);
    else if (hit?.type === 'sol') {
      const n = hit.node;
      showPopover(`
        <span class="badge badge-nasa">Mars 2020 Rover Milestone</span>
        <strong style="display:block; font-family:var(--font-display); margin-top:4px; font-size:14px;">Sol ${n.sol} · ${n.label}</strong>
        <div style="font-family:var(--font-mono); font-size:10px; color:var(--blue); font-weight:700; margin:3px 0 7px;">${n.lat.toFixed(4)}°N, ${n.lon.toFixed(4)}°E</div>
        <button type="button" class="copilot-btn primary" style="width:100%;" onclick="window.openCopilotForCoords(${n.lat}, ${n.lon}, 'Sol ${n.sol} (${n.label})')">🤖 AI Coordinate Report</button>
      `);
    } else if (hit?.type === 'customPin') {
      const p = hit.pin;
      showPopover(`
        <span class="badge badge-model">Custom Waypoint Marker</span>
        <strong style="display:block; font-family:var(--font-display); margin-top:4px; font-size:14px;">📌 ${p.label}</strong>
        <div style="font-family:var(--font-mono); font-size:10px; color:var(--blue); font-weight:700; margin:3px 0 7px;">${p.lat.toFixed(4)}°N, ${p.lon.toFixed(4)}°E</div>
        <button type="button" class="copilot-btn primary" style="width:100%;" onclick="window.openCopilotForCoords(${p.lat}, ${p.lon}, '${p.label}')">🤖 AI Coordinate Report</button>
        <button type="button" class="copilot-btn" style="width:100%; margin-top:6px; color:var(--danger); border-color:var(--danger);" onclick="window.removeCustomMapPin('${p.id}')">Remove Marker</button>
      `);
    } else {
      const geo = toGeo(x, y, w, h);
      const u = findUsgsUnitAt(geo.lat, geo.lon);
      const unitInfo = u ? `USGS Unit ${u.code} (${u.name})` : 'Jezero Rim / Highlands';
      showPopover(`
        <span class="badge badge-model">Custom Terrain Point</span>
        <strong style="display:block; font-family:var(--font-display); margin-top:4px; font-size:14px;">${geo.lat.toFixed(4)}°N, ${geo.lon.toFixed(4)}°E</strong>
        <div style="font-size:11px; color:var(--muted); margin:3px 0 7px;">${unitInfo} · IAU2000:49900</div>
        <button type="button" class="copilot-btn primary" style="width:100%;" onclick="window.openCopilotForCoords(${geo.lat.toFixed(4)}, ${geo.lon.toFixed(4)}, 'Custom Map Pin')">🤖 AI Coordinate Report</button>
        <button type="button" class="copilot-btn" style="width:100%; margin-top:6px;" onclick="window.dropCustomMapPin(${geo.lat.toFixed(4)}, ${geo.lon.toFixed(4)})">📌 Drop Marker Here</button>
      `);
    }
  };

  canvas.addEventListener('mousedown', e => {
    if (Camera.flyAnimId) { cancelAnimationFrame(Camera.flyAnimId); Camera.flyAnimId = null; }
    const r = canvas.getBoundingClientRect();
    Camera.dragging = true; Camera.startX = e.clientX - r.left; Camera.startY = e.clientY - r.top; Camera.moved = false;
  });

  window.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (Camera.dragging) {
      const dx = x - Camera.startX, dy = y - Camera.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) Camera.moved = true;
      Camera.centerLon -= dx / (ppd() * COS_LAT);
      Camera.centerLat += dy / ppd();
      Camera.startX = x; Camera.startY = y;
      if (hoverTip) hoverTip.classList.remove('visible');
      drawMap();
      return;
    }
    if (x >= 0 && y >= 0 && x <= r.width && y <= r.height) {
      Camera.cursorScreen = { x, y };
      const geo = toGeo(x, y, r.width, r.height);
      $('coordReadout').textContent = `${geo.lat.toFixed(4)}°N, ${geo.lon.toFixed(4)}°E · IAU2000:49900`;
      const hit = hitTest(x, y, r.width, r.height);
      const prev = `${Camera.hoverLandmark}|${Camera.hoverRoute}|${Camera.hoverUnit}|${Camera.hoverSol}|${Camera.hoverCustomPin}`;
      Camera.hoverLandmark = hit?.type === 'landmark' ? hit.site.id : null;
      Camera.hoverRoute = hit?.type === 'route' ? hit.key : null;
      Camera.hoverUnit = hit?.type === 'usgs' ? hit.unit.code : null;
      Camera.hoverSol = hit?.type === 'sol' ? hit.node.sol : null;
      Camera.hoverCustomPin = hit?.type === 'customPin' ? hit.pin.id : null;
      canvas.style.cursor = AppState.mapTool === 'ruler' ? 'crosshair' : hit ? 'pointer' : 'grab';
      updateHoverTooltip(hit, x, y, r.width);
      if (prev !== `${Camera.hoverLandmark}|${Camera.hoverRoute}|${Camera.hoverUnit}|${Camera.hoverSol}|${Camera.hoverCustomPin}` || (AppState.mapTool === 'ruler' && AppState.rulerPoints.length > 0)) {
        drawMap();
      }
    } else {
      Camera.cursorScreen = null;
      if (hoverTip) hoverTip.classList.remove('visible');
    }
  });

  window.addEventListener('mouseup', e => {
    if (!Camera.dragging) return;
    const moved = Camera.moved; Camera.dragging = false;
    if (!moved) {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (x >= 0 && y >= 0 && x <= r.width && y <= r.height) handleTapOrClick(x, y, r.width, r.height);
    }
  });

  canvas.addEventListener('mouseleave', () => {
    Camera.cursorScreen = null;
    if (hoverTip) hoverTip.classList.remove('visible');
    if (AppState.mapTool === 'ruler' && AppState.rulerPoints.length > 0) drawMap();
  });

  canvas.addEventListener('touchstart', e => {
    if (Camera.flyAnimId) { cancelAnimationFrame(Camera.flyAnimId); Camera.flyAnimId = null; }
    const r = canvas.getBoundingClientRect();
    if (e.touches.length === 1) {
      Camera.dragging = true;
      Camera.startX = e.touches[0].clientX - r.left;
      Camera.startY = e.touches[0].clientY - r.top;
      Camera.moved = false;
    } else if (e.touches.length === 2) {
      Camera.dragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      Camera.pinchDist = Math.hypot(dx, dy);
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', e => {
    const r = canvas.getBoundingClientRect();
    if (e.touches.length === 1 && Camera.dragging) {
      const x = e.touches[0].clientX - r.left, y = e.touches[0].clientY - r.top;
      const dx = x - Camera.startX, dy = y - Camera.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) Camera.moved = true;
      Camera.centerLon -= dx / (ppd() * COS_LAT);
      Camera.centerLat += dy / ppd();
      Camera.startX = x; Camera.startY = y;
      drawMap();
    } else if (e.touches.length === 2 && Camera.pinchDist > 0) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const scaleRatio = newDist / Camera.pinchDist;
      Camera.zoom = Math.max(11.2, Math.min(16.2, Camera.zoom + Math.log2(scaleRatio)));
      Camera.pinchDist = newDist;
      drawMap();
    }
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    Camera.pinchDist = 0;
    if (!Camera.dragging) return;
    const moved = Camera.moved;
    Camera.dragging = false;
    if (!moved) {
      const r = canvas.getBoundingClientRect();
      handleTapOrClick(Camera.startX, Camera.startY, r.width, r.height);
    }
  });

  // Zoom anchored smoothly toward mouse cursor position
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (Camera.flyAnimId) { cancelAnimationFrame(Camera.flyAnimId); Camera.flyAnimId = null; }
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const beforeGeo = toGeo(x, y, r.width, r.height);
    Camera.zoom = Math.max(11.2, Math.min(16.2, Camera.zoom + (e.deltaY < 0 ? 0.35 : -0.35)));
    const afterGeo = toGeo(x, y, r.width, r.height);
    Camera.centerLat += (beforeGeo.lat - afterGeo.lat);
    Camera.centerLon += (beforeGeo.lon - afterGeo.lon);
    $('coordReadout').textContent = `${beforeGeo.lat.toFixed(4)}°N, ${beforeGeo.lon.toFixed(4)}°E · IAU2000:49900`;
    drawMap();
  }, { passive: false });

  // Keyboard navigation when map canvas is focused
  canvas.addEventListener('keydown', e => {
    const panStep = 0.008 * Math.pow(2, 13 - Camera.zoom);
    if (e.key === 'ArrowUp') { e.preventDefault(); Camera.centerLat += panStep; drawMap(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); Camera.centerLat -= panStep; drawMap(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); Camera.centerLon -= panStep; drawMap(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); Camera.centerLon += panStep; drawMap(); }
    else if (e.key === '+' || e.key === '=') { Camera.zoom = Math.min(16.2, Camera.zoom + 0.4); drawMap(); }
    else if (e.key === '-' || e.key === '_') { Camera.zoom = Math.max(11.2, Camera.zoom - 0.4); drawMap(); }
    else if (e.key.toLowerCase() === 'r') { flyMapTo(DEFAULT_VIEW.centerLat, DEFAULT_VIEW.centerLon, DEFAULT_VIEW.zoom); }
    else if (e.key.toLowerCase() === 'm') { setMapTool(AppState.mapTool === 'ruler' ? 'inspect' : 'ruler'); }
  });

  // Elevation profile scrubbing
  const elevCanvas = $('elevProfileCanvas');
  if (elevCanvas) {
    const scrub = (clientX) => {
      const r = elevCanvas.getBoundingClientRect();
      const padL = 46, padR = 16;
      const t = (clientX - r.left - padL) / Math.max(10, r.width - padL - padR);
      AppState.profileScrubT = Math.max(0, Math.min(1, t));
      drawElevationProfile();
      drawMap();
    };
    elevCanvas.addEventListener('mousemove', e => scrub(e.clientX));
    elevCanvas.addEventListener('touchmove', e => { if (e.touches.length === 1) scrub(e.touches[0].clientX); }, { passive: true });
    elevCanvas.addEventListener('mouseleave', () => {
      AppState.profileScrubT = null;
      $('elevProfileReadout').textContent = 'Scrub profile to inspect';
      drawElevationProfile();
      drawMap();
    });
  }

  window.addEventListener('resize', () => {
    drawMap();
    drawElevationProfile();
  });
}

/* ============================================================================
 * 5. AR HELMET VISOR HUD
 * ============================================================================ */
function updateVisorHud(routesMap) {
  const modal = $('visorHudModal');
  if (!modal) return;
  const start = Landmarks[AppState.startKey] || Landmarks.butler;
  const dest = Landmarks[AppState.destKey] || Landmarks.belva;
  const active = routesMap[AppState.selectedRoute] || routesMap.A;

  $('hudStartLabel').textContent = start.shortName;
  $('hudDustTau').textContent = AppState.dustTau.toFixed(1);
  $('hudO2Value').textContent = `${active.bio.o2Liters} L`;
  $('hudKcalValue').textContent = `${active.bio.kcal.toLocaleString()} kcal`;
  $('hudBatteryValue').textContent = `${active.bio.batteryPctRemaining}%`;
  $('hudSuitMass').textContent = `4.3 psi · ${active.bio.massKg} kg`;
  $('hudO2ReservePct').textContent = `${active.bio.remainingPct}% REMAINING`;
  $('hudO2BarFill').style.width = `${active.bio.remainingPct}%`;
  $('hudO2BarFill').style.background = active.bio.remainingPct < 20 ? '#ff6b5b' : 'linear-gradient(90deg, var(--hud-neon), var(--hud-cyan))';
  $('hudActiveRouteTag').textContent = `ROUTE ${active.key}`;
  $('hudRouteSummary').innerHTML = `Target: <strong>${dest.shortName}</strong> · Dist: <strong>${active.distance} km</strong> · Climb: <strong>+${active.bio.deltaH} m</strong> · Friction: <strong>μ=${active.bio.mu}</strong>`;
  $('hudLifeSupportStatus').textContent = AppState.emergencyMode ? '⚠ EMERGENCY' : `● ${active.bio.status}`;
  $('hudLifeSupportStatus').style.color = AppState.emergencyMode ? '#ff6b5b' : 'var(--hud-neon)';

  ['A', 'B', 'C'].forEach(k => $(`arGroup${k}`)?.setAttribute('opacity', AppState.selectedRoute === k ? '1' : '0.32'));
  $('arGroupEmergency')?.setAttribute('opacity', AppState.emergencyMode ? '1' : '0');

  modal.style.setProperty('--dust-blur', AppState.dustTau > 0.8 ? Math.min(6, (AppState.dustTau - 0.8) * 1.8).toFixed(1) + 'px' : '0px');
  modal.classList.toggle('visor-dusty', AppState.dustTau > 0.8);
  modal.classList.toggle('visor-emergency', AppState.emergencyMode);
  $('visorEmergencySub').textContent = `EVACUATION ROUTE SET: ${start.shortName} SHELTER · MAINTAIN 1.8 KM/H PACE`;

  document.querySelectorAll('.hud-route-btn').forEach(b => b.classList.toggle('active', b.dataset.hudRoute === AppState.selectedRoute));

  const layer = $('visorPinsLayer');
  layer.innerHTML = Object.values(Landmarks).map(s => `
    <div class="ar-reticle ${s.id === AppState.destKey ? 'target-active' : ''}" data-visor-site="${s.id}" style="left:${s.visorX}%; top:${s.visorY}%;">
      <div class="ar-reticle-box">
        <div class="ar-reticle-title">${s.id === AppState.destKey ? '🎯' : '◈'} ${s.shortName}</div>
        <div class="ar-reticle-sub">${window.computeMarsChordKm(start, s).toFixed(1)} km · BRG ${window.computeBearingDeg(start, s)}°</div>
      </div>
      <div class="ar-reticle-stem"></div><div class="ar-reticle-diamond"></div>
    </div>
  `).join('');

  layer.querySelectorAll('.ar-reticle').forEach(el => el.addEventListener('click', () => {
    AppState.destKey = el.dataset.visorSite;
    $('destSelect').value = AppState.destKey;
    updateAll();
    showToast(`Retargeted: ${Landmarks[AppState.destKey].name}`);
  }));
}

/* ============================================================================
 * 6. CRISM MINERALOGY & SCIENCE RENDERER
 * ============================================================================ */
function renderScienceSections() {
  const bar = $('scienceLandmarkBar'), detail = $('scienceLandmarkDetail');
  if (bar && detail) {
    bar.innerHTML = Object.values(Landmarks).map(s => `
      <button type="button" class="chip-btn ${AppState.scienceInspectKey === s.id ? 'active' : ''}" data-sci="${s.id}">${s.shortName} (${s.crismId})</button>
    `).join('');
    bar.querySelectorAll('[data-sci]').forEach(b => b.addEventListener('click', () => {
      AppState.scienceInspectKey = b.dataset.sci; renderScienceSections();
    }));

    const s = Landmarks[AppState.scienceInspectKey] || Landmarks.belva;
    detail.innerHTML = `
      <div style="background:var(--panel); border:1.5px solid var(--border-strong); border-radius:14px; padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
          <div>
            <span class="badge badge-nasa">${s.role}</span>
            <h4 style="font-family:var(--font-display); margin:5px 0 2px; font-size:17px;">${s.name}</h4>
            <div style="font-family:var(--font-mono); font-size:10.5px; color:var(--accent); font-weight:700;">${s.lat.toFixed(4)}°N, ${s.lon.toFixed(4)}°E · ${s.elevM} m MOLA · CRISM ${s.crismId}</div>
          </div>
          <button type="button" class="copilot-btn primary" onclick="window.openCopilotForCoords(${s.lat}, ${s.lon}, '${s.shortName}')">🤖 AI Coordinate Report</button>
        </div>
        <p style="font-size:12.5px; color:var(--text-sub); margin:0 0 10px;">${s.description}</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:9px; margin-bottom:12px; font-size:11.5px;">
          <div style="background:var(--green-soft); border:1px solid var(--green-border); border-radius:9px; padding:9px 11px;">
            <strong style="color:var(--green);">✓ Observed (NASA/USGS):</strong><div style="margin-top:2px; color:var(--text-sub);">${s.observed}</div>
          </div>
          <div style="background:var(--blue-soft); border:1px solid var(--blue-border); border-radius:9px; padding:9px 11px;">
            <strong style="color:var(--blue);">◈ Geologic Interpretation:</strong><div style="margin-top:2px; color:var(--text-sub);">${s.inferred}</div>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:9px;">
          ${s.minerals.map(m => `
            <div style="background:var(--panel2); border:1px solid var(--border-strong); border-radius:10px; padding:10px 12px; font-size:11.5px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:3px;"><strong>${m.name}</strong><span class="badge badge-model">${m.confidence}</span></div>
              <div style="font-family:var(--font-mono); font-size:10px; color:var(--accent); font-weight:700; margin-bottom:4px;">${m.formula} · ${m.band}</div>
              <div style="color:var(--text-sub);">${m.significance}</div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:9px; font-size:11px; color:var(--muted);"><strong>Reference:</strong> ${s.citation}</div>
      </div>
    `;
  }
}

/* ============================================================================
 * 7. MASTER UI UPDATE LOOP & EVENTS
 * ============================================================================ */
function updateAll() {
  const start = Landmarks[AppState.startKey] || Landmarks.butler;
  const dest = Landmarks[AppState.destKey] || Landmarks.belva;

  if (AppState.dustTau >= 2.2 && !AppState.manualEmergencyLock) {
    AppState.emergencyMode = true; AppState.autoDustEmergency = true; AppState.selectedRoute = 'C';
  } else if (AppState.dustTau < 2.2 && AppState.autoDustEmergency) {
    AppState.emergencyMode = false; AppState.autoDustEmergency = false;
  }

  const routes = window.getSimulatedRoutes(start, dest, AppState.suitMassKg, AppState.dustTau, AppState.o2CapacityL);
  const rec = evaluateRecommendation(routes);
  if (AppState.followRecommended || AppState.emergencyMode) {
    AppState.selectedRoute = rec.bestKey;
  }
  const autoBtn = $('applyRecommendationBtn');
  if (autoBtn) {
    autoBtn.textContent = AppState.followRecommended
      ? `★ Auto-Following Recommended (Route ${rec.bestKey})`
      : `Lock to Recommended Route ${rec.bestKey} →`;
  }
  const act = routes[AppState.selectedRoute] || routes.A;
  const vis = act.visibility;

  // KPIs
  $('kpiDistance').textContent = `${act.distance} km`;
  $('kpiRouteName').textContent = `Route ${act.key} · ${act.name}`;
  $('kpiDuration').textContent = `${act.hours} hrs`;
  $('kpiPaceSub').textContent = `Pace: ${act.paceKmh} km/h (${Math.round(vis.speedFactor * 100)}% nominal)`;
  $('kpiO2').textContent = `${act.bio.o2Liters} L O₂`;
  $('kpiKcalSub').textContent = `${act.bio.kcal.toLocaleString()} kcal · Reserve: ${act.bio.remainingO2} L (${act.bio.remainingPct}%)`;
  $('kpiVisibility').textContent = `${vis.pct}%`;
  $('kpiDustSub').textContent = `τ = ${vis.tau.toFixed(1)} · k = ${vis.k.toFixed(1)} (${vis.label.split(' ')[0]})`;
  $('kpiScienceRisk').textContent = `${act.scienceTargets} Targets · ${act.riskLabel}`;
  $('kpiTerrainSub').textContent = `Δh +${act.bio.deltaH} m · Friction μ = ${act.bio.mu}`;

  // Map & Layer readouts
  $('activeLayerBadge').textContent = (WMTS_LAYERS[AppState.mapLayer] || WMTS_LAYERS.hirise).badge;
  $('mapStatusLine').textContent = `Active Traverse: ${start.name} → ${dest.name} (Route ${act.key}${rec.bestKey === act.key ? ' · ★ Recommended' : ' · Manual'})`;
  $('waypointChordReadout').textContent = `${window.computeMarsChordKm(start, dest).toFixed(2)} km`;
  const elev = dest.elevM - start.elevM;
  $('waypointElevReadout').textContent = `${elev >= 0 ? '+' : ''}${elev} m`;
  $('orbitalOpacityVal').textContent = `${Math.round(AppState.orbitalOpacity * 100)}%`;
  $('usgsOpacityVal').textContent = `${Math.round(AppState.usgsOpacity * 100)}%`;
  $('molaOpacityVal').textContent = `${Math.round(AppState.molaOpacity * 100)}%`;

  // Environment readouts
  $('dustTauVal').textContent = AppState.dustTau.toFixed(1);
  $('attenuationKVal').textContent = AppState.attenuationK.toFixed(1);
  $('suitMassVal').textContent = `${AppState.suitMassKg} kg`;
  $('envVisReadout').textContent = `${vis.pct}% (${vis.label})`;
  $('envVisReadout').className = vis.cssClass;
  $('envPaceMultReadout').textContent = `${Math.round(vis.speedFactor * 100)}% of nominal EVA walking speed`;

  // Emergency UI
  $('topEmergencyBtn').classList.toggle('active-emergency', AppState.emergencyMode);
  $('emergencyBtn').classList.toggle('active-emergency', AppState.emergencyMode);
  $('legendEmergency').style.display = AppState.emergencyMode ? 'inline' : 'none';
  $('emergencyBanner').classList.toggle('active', AppState.emergencyMode);
  if (AppState.emergencyMode) {
    const em = window.computeEmergencyRoute(AppState.destKey, start, act.bio.massKg, act.bio.remainingO2, AppState.dustTau);
    $('emDist').textContent = `${em.distKm} km direct chord`;
    $('emTime').textContent = `${em.hours} hrs @ ${em.speedKmh} km/h`;
    $('emO2').textContent = `${em.o2Needed} L needed / ${em.o2Remaining} L rem.`;
    $('emStatus').textContent = em.status;
    $('emStatus').style.color = em.statusColor;
    $('emBearing').textContent = `${em.bearing}° toward ${start.shortName}`;
  }

  // Recommendation & Route Cards
  $('recommendationBanner').classList.toggle('emergency-override', AppState.emergencyMode);
  $('recHeadline').textContent = AppState.emergencyMode ? `⚠ Emergency Abort Route: Route C · Direct Chord` : `★ Recommended Route: Route ${rec.bestKey} · ${routes[rec.bestKey].name}`;
  $('recPriorityBadge').textContent = AppState.emergencyMode ? 'EMERGENCY OVERRIDE' : `${AppState.priority.toUpperCase()} PRIORITY`;
  $('recExplanation').textContent = rec.reason;
  $('recScorePills').innerHTML = ['A', 'B', 'C'].map(k => `<span class="score-pill ${rec.bestKey === k ? 'winner' : ''}">Route ${k}: ${rec.scores[k]} pts (${routes[k].bio.o2Liters} L O₂)</span>`).join('');

  ['A', 'B', 'C'].forEach(k => {
    const r = routes[k];
    $(`tblDist${k}`).textContent = `${r.distance} km`;
    $(`tblTime${k}`).textContent = `${r.hours} hrs`;
    $(`tblPace${k}`).textContent = `${r.paceKmh} km/h`;
    $(`tblO2${k}`).textContent = `${r.bio.o2Liters} L O₂ (${r.bio.kcal.toLocaleString()} kcal)`;
    $(`tblWork${k}`).textContent = `${r.bio.workFlatKJ} kJ / ${r.bio.workClimbKJ} kJ`;
    const cardRow = $(`tblWork${k}`)?.closest('table')?.rows?.[6];
    if (cardRow && cardRow.cells[1]) cardRow.cells[1].textContent = `${r.riskLabel} (Δh +${r.bio.deltaH}m, μ=${r.bio.mu})`;
    const cls = r.bio.status === 'NOMINAL' ? 'feas-nominal' : r.bio.status === 'WARNING' ? 'feas-warning' : 'feas-critical';
    $(`tblRem${k}`).innerHTML = `<span class="feas-badge ${cls}">${r.bio.remainingO2} L (${r.bio.status})</span>`;
    $(`routeTag${k}`).textContent = rec.bestKey === k ? '★ RECOMMENDED' : k === 'A' ? 'HIGH SCIENCE' : k === 'B' ? 'SAFEST TERRAIN' : 'SHORTEST DIST';
  });

  document.querySelectorAll('.route-card').forEach(c => {
    const sel = c.dataset.route === AppState.selectedRoute;
    c.classList.toggle('selected', sel);
    c.setAttribute('aria-pressed', sel ? 'true' : 'false');
  });

  const costAnalysis = window.MarsPathCostAnalyzer.analyzeAllRoutes(start, dest, AppState);
  $('costImpactAnalysisBox').innerHTML = window.MarsPathCostAnalyzer.renderHTML(costAnalysis);

  updateVisorHud(routes);
  updateRulerReadout();
  drawElevationProfile();
  drawMap();
}

function initEvents() {
  $('themeToggleBtn').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    $('themeIcon').textContent = next === 'dark' ? '🌙' : '☀️';
    $('themeLabel').textContent = next === 'dark' ? 'Night Orbit' : 'Parchment';
    drawElevationProfile();
    drawMap();
  });

  $('startSelect').addEventListener('change', e => { AppState.startKey = e.target.value; updateAll(); });
  $('destSelect').addEventListener('change', e => {
    AppState.destKey = e.target.value;
    const d = Landmarks[AppState.destKey];
    if (d && $('copilotCoordInput')) $('copilotCoordInput').value = `${d.lat.toFixed(4)}, ${d.lon.toFixed(4)}`;
    updateAll();
  });
  $('nasaLayerSelect').addEventListener('change', e => { AppState.mapLayer = e.target.value; updateAll(); });
  $('orbitalOpacitySlider').addEventListener('input', e => { AppState.orbitalOpacity = parseFloat(e.target.value); updateAll(); });
  $('usgsGeoToggle').addEventListener('change', e => { AppState.usgsGeoVisible = e.target.checked; updateAll(); });
  $('usgsOpacitySlider').addEventListener('input', e => { AppState.usgsOpacity = parseFloat(e.target.value); updateAll(); });
  $('molaToggle').addEventListener('change', e => { AppState.molaVisible = e.target.checked; updateAll(); });
  $('molaOpacitySlider').addEventListener('input', e => { AppState.molaOpacity = parseFloat(e.target.value); updateAll(); });
  $('roverTraverseToggle').addEventListener('change', e => { AppState.roverTraverseVisible = e.target.checked; updateAll(); });
  $('routesToggle').addEventListener('change', e => { AppState.routesVisible = e.target.checked; updateAll(); });

  // Interactive Map Tools (Inspect / Ruler / Elevation Profile)
  $('toolInspectBtn').addEventListener('click', () => setMapTool('inspect'));
  $('toolRulerBtn').addEventListener('click', () => setMapTool(AppState.mapTool === 'ruler' ? 'inspect' : 'ruler'));
  $('clearRulerBtn').addEventListener('click', () => {
    AppState.rulerPoints = [];
    updateRulerReadout();
    drawMap();
  });

  $('toolProfileBtn').addEventListener('click', () => {
    AppState.elevProfileVisible = !AppState.elevProfileVisible;
    $('toolProfileBtn').classList.toggle('active', AppState.elevProfileVisible);
    $('elevProfilePanel').classList.toggle('visible', AppState.elevProfileVisible);
    if (AppState.elevProfileVisible) drawElevationProfile();
    drawMap();
  });
  $('closeElevProfileBtn').addEventListener('click', () => {
    AppState.elevProfileVisible = false;
    AppState.profileScrubT = null;
    $('toolProfileBtn').classList.remove('active');
    $('elevProfilePanel').classList.remove('visible');
    drawMap();
  });

  document.querySelectorAll('.usgs-chip[data-usgs-code]').forEach(chip => chip.addEventListener('click', () => {
    const u = UsgsGeologicUnits.find(x => x.code === chip.dataset.usgsCode);
    if (u) {
      AppState.usgsGeoVisible = true;
      $('usgsGeoToggle').checked = true;
      const cLat = u.coords.reduce((s, c) => s + c[0], 0) / u.coords.length;
      const cLon = u.coords.reduce((s, c) => s + c[1], 0) / u.coords.length;
      flyMapTo(cLat, cLon, 13.8);
      inspectUsgsUnit(u);
    }
  }));

  document.querySelectorAll('[data-fly]').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('[data-fly]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const p = FLYOVERS[btn.dataset.fly];
    if (p) { flyMapTo(p.lat, p.lon, p.zoom); showToast(`Flyover: ${p.label}`); }
  }));

  $('zoomInBtn').addEventListener('click', () => { flyMapTo(Camera.centerLat, Camera.centerLon, Camera.zoom + 0.5); });
  $('zoomOutBtn').addEventListener('click', () => { flyMapTo(Camera.centerLat, Camera.centerLon, Camera.zoom - 0.5); });
  $('resetViewBtn').addEventListener('click', () => { flyMapTo(DEFAULT_VIEW.centerLat, DEFAULT_VIEW.centerLon, DEFAULT_VIEW.zoom); hidePopover(); });
  $('closeMapPopoverBtn').addEventListener('click', hidePopover);

  $('dustTauSlider').addEventListener('input', e => {
    AppState.dustTau = parseFloat(e.target.value);
    if (AppState.dustTau < 2.2) AppState.manualEmergencyLock = false;
    updateAll();
  });
  $('attenuationKSlider').addEventListener('input', e => { AppState.attenuationK = parseFloat(e.target.value); updateAll(); });
  $('suitMassSlider').addEventListener('input', e => { AppState.suitMassKg = parseInt(e.target.value, 10); updateAll(); });

  $('prioritySelect').addEventListener('change', e => { AppState.priority = e.target.value; AppState.followRecommended = true; updateAll(); });
  $('applyRecommendationBtn').addEventListener('click', () => {
    const routes = window.getSimulatedRoutes(Landmarks[AppState.startKey], Landmarks[AppState.destKey], AppState.suitMassKg, AppState.dustTau, AppState.o2CapacityL);
    const rec = evaluateRecommendation(routes);
    AppState.followRecommended = true;
    AppState.selectedRoute = rec.bestKey; updateAll(); showToast(`Auto-Tracking Recommended Route ${rec.bestKey}`);
  });

  document.querySelectorAll('.route-card').forEach(card => {
    const pick = () => { AppState.followRecommended = false; AppState.selectedRoute = card.dataset.route; updateAll(); showToast(`Inspecting Route ${card.dataset.route}`); };
    card.addEventListener('click', pick);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  });

  const toggleEmergency = () => {
    AppState.emergencyMode = !AppState.emergencyMode;
    if (!AppState.emergencyMode) { AppState.autoDustEmergency = false; AppState.manualEmergencyLock = true; showToast('Emergency Cleared'); }
    else { AppState.selectedRoute = 'C'; showToast('⚠ EMERGENCY ABORT ACTIVE'); }
    updateAll();
  };
  $('topEmergencyBtn').addEventListener('click', toggleEmergency);
  $('emergencyBtn').addEventListener('click', toggleEmergency);
  $('cancelEmergencyBtn').addEventListener('click', () => {
    AppState.emergencyMode = false; AppState.autoDustEmergency = false; AppState.manualEmergencyLock = true; updateAll(); showToast('Emergency Cleared');
  });

  const openVisor = () => { AppState.visorOpen = true; document.body.classList.add('visor-open'); $('visorHudModal').classList.add('active'); updateAll(); };
  const closeVisor = () => { AppState.visorOpen = false; document.body.classList.remove('visor-open'); $('visorHudModal').classList.remove('active'); };
  $('openVisorBtn').addEventListener('click', openVisor);
  $('mapHudBtn').addEventListener('click', openVisor);
  $('closeVisorBtn').addEventListener('click', closeVisor);
  document.querySelectorAll('.hud-route-btn').forEach(b => b.addEventListener('click', () => { AppState.followRecommended = false; AppState.selectedRoute = b.dataset.hudRoute; updateAll(); }));

  const updateVisorLook = (clientX, clientY) => {
    if (!AppState.visorOpen) return;
    const nx = (clientX / window.innerWidth) - 0.5, ny = (clientY / window.innerHeight) - 0.5;
    $('visorWorld').style.transform = `translate3d(${(-nx * 90).toFixed(1)}px, ${(-ny * 36).toFixed(1)}px, 0)`;
    $('visorCompassTape').style.transform = `translateX(calc(-50% + ${(-nx * 160).toFixed(1)}px))`;
    const baseBrg = window.computeBearingDeg(Landmarks[AppState.startKey], Landmarks[AppState.destKey]);
    const hdg = (baseBrg + Math.round(nx * 50) + 360) % 360;
    $('visorHeadingReadout').textContent = `▲ HDG ${String(hdg).padStart(3, '0')}° · TARGET BEARING ${baseBrg}°`;
  };
  $('visorHudModal').addEventListener('mousemove', e => updateVisorLook(e.clientX, e.clientY));
  $('visorHudModal').addEventListener('touchmove', e => {
    if (e.touches.length === 1) updateVisorLook(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && AppState.visorOpen) closeVisor(); });

  const tabs = [['tabBtnCrism', 'panelCrism'], ['tabBtnMethodology', 'panelMethodology']];
  tabs.forEach(([bId, pId]) => $(bId).addEventListener('click', () => {
    tabs.forEach(([ob, op]) => { $(ob).classList.remove('active'); $(ob).setAttribute('aria-selected', 'false'); $(op).classList.remove('active'); });
    $(bId).classList.add('active'); $(bId).setAttribute('aria-selected', 'true'); $(pId).classList.add('active');
  }));
}

/* ============================================================================
 * 8. AI SITE ANALYST & COORDINATE REPORT CHATBOT (GEMINI 3 FLASH + FALLBACK)
 * ============================================================================ */
function parseCoords(raw) {
  const m = String(raw || '').trim().match(/(-?\d+(?:\.\d+)?)\s*°?\s*([NS])?[,\s;/]+(-?\d+(?:\.\d+)?)\s*°?\s*([EW])?/i);
  if (!m) return null;
  let lat = parseFloat(m[1]), lon = parseFloat(m[3]);
  if ((m[2] || '').toUpperCase() === 'S') lat = -Math.abs(lat);
  if ((m[4] || '').toUpperCase() === 'W') lon = -Math.abs(lon);
  if (Number.isNaN(lat) || Number.isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 360) return null;
  return { lat: Number(lat.toFixed(4)), lon: Number(lon.toFixed(4)) };
}

function evaluateCoordTelemetry(lat, lon) {
  const start = Landmarks[AppState.startKey] || Landmarks.butler;
  const pt = { id: 'target', lat, lon, elevM: -2535 };
  let nearestSite = Landmarks.belva, nearestDistKm = Infinity;
  Object.values(Landmarks).forEach(s => {
    const d = window.computeMarsChordKm(pt, s);
    if (d < nearestDistKm) { nearestDistKm = d; nearestSite = s; }
  });

  let unit = findUsgsUnitAt(lat, lon) || {
    code: 'Nnu', name: 'Jezero Crater Rim Highlands', frictionMu: 0.26, slopeDeg: 18,
    minerals: ['Low-Ca Pyroxene', 'Impact Breccia'],
    lithology: 'Ancient Noachian crustal rim and impact megabreccia.',
    evaGuidance: 'Steep crater-wall slopes (~15–22°) and loose talus aprons.'
  };

  const distFromStartKm = Number(window.computeMarsChordKm(start, pt).toFixed(2));
  const bearingFromStart = window.computeBearingDeg(start, pt);
  const estElevM = Math.round(nearestSite.elevM + (lat - nearestSite.lat) * 950 - (lon - nearestSite.lon) * 420);
  const deltaH = Math.max(0, estElevM - start.elevM);
  const vis = window.computeVisibility(AppState.dustTau, AppState.attenuationK);
  const roundTripKm = Number((distFromStartKm * 2 * 1.24).toFixed(2));
  const roundTripHours = Number((roundTripKm / Math.max(0.3, 1.35 * vis.speedFactor)).toFixed(1));
  const o2RoundTripL = window.computeMetabolicCost(roundTripKm, deltaH, unit.frictionMu, AppState.suitMassKg, roundTripHours, vis.factor).o2Liters;
  const o2RemainingAfterReturnL = AppState.o2CapacityL - o2RoundTripL;

  let overallDanger = 'LOW / NOMINAL', dangerClass = 'danger-safe';
  if (AppState.dustTau >= 2.2 || o2RemainingAfterReturnL < 85 || distFromStartKm > 9.5) {
    overallDanger = 'HIGH / CRITICAL RISK'; dangerClass = 'danger-high';
  } else if (unit.frictionMu >= 0.26 || AppState.dustTau >= 1.2 || o2RemainingAfterReturnL < 160) {
    overallDanger = 'MODERATE / CAUTION'; dangerClass = 'danger-caution';
  }

  return {
    lat, lon, estElevM, startStationName: start.name, distFromStartKm, bearingFromStart,
    nearestSite, nearestDistKm: Number(nearestDistKm.toFixed(2)), unit, vis,
    roundTripKm, roundTripHours, o2RoundTripL, o2RemainingAfterReturnL, overallDanger, dangerClass
  };
}

function buildContextPrompt(t) {
  const start = Landmarks[AppState.startKey] || Landmarks.butler;
  const dest = Landmarks[AppState.destKey] || Landmarks.belva;
  const routes = window.getSimulatedRoutes(start, dest, AppState.suitMassKg, AppState.dustTau, AppState.o2CapacityL);
  const rec = evaluateRecommendation(routes);
  const routeLines = ['A', 'B', 'C'].map(k => {
    const r = routes[k];
    return `- Route ${k} (${r.name}): ${r.distance} km, ${r.hours} hrs, O2 ${r.bio.o2Liters} L (${r.bio.remainingO2} L rem), climb +${r.bio.deltaH} m, mu=${r.bio.mu}, hazard=${r.riskLabel}, science=${r.scienceTargets} targets.`;
  }).join('\n');

  return `LIVE MARSPATH TELEMETRY:\nMain Station: ${start.name} | Dest: ${dest.name} | Active Route: ${AppState.selectedRoute} | Recommended: ${rec.bestKey}\n${routeLines}\nDust tau=${AppState.dustTau.toFixed(1)} (${t.vis.pct}% visibility), Suit+Astronaut Mass=${AppState.suitMassKg} kg, PLSS Tank=${AppState.o2CapacityL} L (85 L reserve), Emergency=${AppState.emergencyMode ? 'ACTIVE' : 'OFF'}.\nTARGET COORDS (${t.lat}°N, ${t.lon}°E): Est. Elev ${t.estElevM} m MOLA, ${t.distFromStartKm} km from station on bearing ${t.bearingFromStart}°, USGS Unit ${t.unit.code} (${t.unit.name}, mu=${t.unit.frictionMu}), Minerals: ${t.unit.minerals.join(', ')}, Round-trip ${t.roundTripKm} km (${t.roundTripHours} hrs) requires ${t.o2RoundTripL} L O2 (${t.o2RemainingAfterReturnL} L rem), Hazard: ${t.overallDanger}.`;
}

async function callGemini(payload) {
  const apiKey = "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
  for (const delay of [0, 1000, 2000]) {
    if (delay) await new Promise(r => setTimeout(r, delay));
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (_) {}
  }
  throw new Error('Fallback');
}

function initCopilot() {
  const drawer = $('copilotDrawer'), history = [];
  let busy = false;

  const addMsg = (role, content) => {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    role === 'user' ? (div.textContent = content) : (div.innerHTML = content);
    $('copilotMessages').appendChild(div);
    $('copilotMessages').scrollTop = $('copilotMessages').scrollHeight;
    return div;
  };

  const runReport = async (coords, focus = '') => {
    if (!coords || busy) return showToast('Enter valid coordinates (e.g. 18.4800, 77.3800)');
    $('copilotCoordInput').value = `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`;
    busy = true; $('copilotSendBtn').disabled = $('analyzeCoordBtn').disabled = true;
    const typing = addMsg('bot', `🛰️ Analyzing ${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E <span class="copilot-dots"><span></span><span></span><span></span></span>`);

    const t = evaluateCoordTelemetry(coords.lat, coords.lon);
    let rep;
    try {
      const raw = await callGemini({
        systemInstruction: { parts: [{ text: 'You are the MarsPath NASA Planetary GIS AI Analyst for Jezero Crater. Output concise JSON with keys scienceReport, dangerReport, actionPlan (2-3 sentences each) grounded strictly in the provided telemetry.' }] },
        contents: [{ role: 'user', parts: [{ text: `${buildContextPrompt(t)}\n${focus}` }] }],
        generationConfig: {
          temperature: 0.25, responseMimeType: 'application/json',
          responseSchema: { type: 'OBJECT', properties: { scienceReport: { type: 'STRING' }, dangerReport: { type: 'STRING' }, actionPlan: { type: 'STRING' } }, required: ['scienceReport', 'dangerReport', 'actionPlan'] }
        }
      });
      rep = JSON.parse(raw);
      $('copilotEngineBadge').textContent = 'Gemini 3 Flash';
    } catch (_) {
      $('copilotEngineBadge').textContent = 'Local Telemetry';
      rep = {
        scienceReport: `USGS Unit ${t.unit.code} (${t.unit.name}, est. ${t.estElevM} m MOLA). ${t.unit.lithology} Target minerals: ${t.unit.minerals.join(', ')}. Located ${t.nearestDistKm} km from ${t.nearestSite.name}.`,
        dangerReport: `${t.overallDanger} — ${t.unit.evaGuidance} Dust τ = ${t.vis.tau.toFixed(1)} (${t.vis.pct}% visibility). Round-trip traverse (${t.roundTripKm} km, ${t.roundTripHours} hrs) requires ${t.o2RoundTripL} L O₂, leaving ${t.o2RemainingAfterReturnL} L reserve.`,
        actionPlan: `Approach on bearing ${t.bearingFromStart}° from ${t.startStationName} (${t.distFromStartKm} km one-way) using HiRISE 0.25 m/px obstacle mapping and verify the 85 L PLSS safety reserve before sampling.`
      };
    }

    typing.remove();
    addMsg('bot', `
      <div class="rep-head">
        <div><strong style="color:var(--accent);">📍 ${t.lat.toFixed(4)}°N, ${t.lon.toFixed(4)}°E</strong> <span class="badge badge-usgs">${t.unit.code}</span>
        <div style="font-size:10px; color:var(--muted);">${t.distFromStartKm} km from ${t.startStationName} · Brg ${t.bearingFromStart}° · Est. ${t.estElevM} m</div></div>
        <span class="danger-pill ${t.dangerClass}">${t.overallDanger}</span>
      </div>
      <div class="rep-sec"><div class="rep-title"><span>🔬 1. Geological &amp; CRISM Report</span><span class="badge badge-nasa">USGS / CRISM</span></div><div style="font-size:11.5px; color:var(--text-sub);">${rep.scienceReport}</div></div>
      <div class="rep-sec"><div class="rep-title"><span>⚠ 2. Terrain, Dust &amp; PLSS Danger</span><span class="badge badge-model">τ=${t.vis.tau.toFixed(1)} · ${t.o2RoundTripL}L O₂</span></div><div style="font-size:11.5px; color:var(--text-sub);">${rep.dangerReport}</div></div>
      <div class="rep-sec"><div class="rep-title"><span>🧭 3. EVA Action Plan</span><span class="badge badge-model">${t.roundTripHours} hrs RT</span></div><div style="font-size:11.5px; color:var(--text-sub);">${rep.actionPlan}</div></div>
      <div style="display:flex; gap:6px; margin-top:8px;">
        <button type="button" class="copilot-btn" onclick="flyMapTo(${t.lat}, ${t.lon}, 14.3); showToast('Centered map on target');">🎯 Fly Map</button>
        <button type="button" class="copilot-btn" onclick="window.askCopilotFollowUp('What sampling tools and precautions should I bring to ${t.lat.toFixed(4)}°N, ${t.lon.toFixed(4)}°E?')">🧪 Gear Advice</button>
      </div>
    `);
    busy = false; $('copilotSendBtn').disabled = $('analyzeCoordBtn').disabled = false;
  };

  const runChat = async (text, coords) => {
    if (busy) return;
    busy = true; $('copilotSendBtn').disabled = $('analyzeCoordBtn').disabled = true;
    const typing = addMsg('bot', `🛰️ Evaluating live telemetry <span class="copilot-dots"><span></span><span></span><span></span></span>`);
    const t = evaluateCoordTelemetry(coords.lat, coords.lon);
    history.push({ role: 'user', parts: [{ text }] });

    let reply;
    try {
      reply = await callGemini({
        systemInstruction: { parts: [{ text: `You are the MarsPath AI Mission Copilot for Jezero Crater. Answer clearly and concisely using exact live telemetry:\n${buildContextPrompt(t)}` }] },
        contents: history.slice(-8),
        generationConfig: { temperature: 0.35 }
      });
      history.push({ role: 'model', parts: [{ text: reply }] });
      $('copilotEngineBadge').textContent = 'Gemini 3 Flash';
    } catch (_) {
      $('copilotEngineBadge').textContent = 'Local Telemetry';
      const start = Landmarks[AppState.startKey], dest = Landmarks[AppState.destKey];
      const routes = window.getSimulatedRoutes(start, dest, AppState.suitMassKg, AppState.dustTau, AppState.o2CapacityL);
      const rec = evaluateRecommendation(routes);
      reply = `At **${t.lat.toFixed(4)}°N, ${t.lon.toFixed(4)}°E** (**USGS ${t.unit.code}**), round-trip O₂ cost is **${t.o2RoundTripL} L** (${t.o2RemainingAfterReturnL} L reserve, ${t.overallDanger}). For your active traverse (**${start.shortName} → ${dest.shortName}**), **Route ${rec.bestKey} (${routes[rec.bestKey].name})** is recommended (${routes[rec.bestKey].bio.o2Liters} L O₂, ${routes[rec.bestKey].hours} hrs).`;
    }

    typing.remove();
    const safeHtml = reply.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').split(/\r?\n/).map(l => l.trim() ? `<p>${l}</p>` : '').join('');
    addMsg('bot', `<div class="bot-prose">${safeHtml}</div>`);
    busy = false; $('copilotSendBtn').disabled = $('analyzeCoordBtn').disabled = false;
  };

  const openDrawer = () => {
    drawer.classList.add('open');
    if (!$('copilotMessages').children.length) {
      const d = Landmarks[AppState.destKey] || Landmarks.belva;
      runReport({ lat: d.lat, lon: d.lon });
    }
  };

  $('copilotFab').addEventListener('click', () => drawer.classList.contains('open') ? drawer.classList.remove('open') : openDrawer());
  $('openCopilotTopBtn').addEventListener('click', openDrawer);
  $('closeCopilotBtn').addEventListener('click', () => drawer.classList.remove('open'));
  $('clearCopilotBtn').addEventListener('click', () => { if (!busy) { history.length = 0; $('copilotMessages').innerHTML = ''; showToast('Chat cleared'); } });
  $('syncDestCoordBtn').addEventListener('click', () => { const d = Landmarks[AppState.destKey]; addMsg('user', `Report on ${d.name}`); runReport({ lat: d.lat, lon: d.lon }); });
  $('analyzeCoordBtn').addEventListener('click', () => { const c = parseCoords($('copilotCoordInput').value); if (c) addMsg('user', `Full Report: ${c.lat}°N, ${c.lon}°E`); runReport(c); });

  document.querySelectorAll('[data-copilot-q]').forEach(c => c.addEventListener('click', () => {
    const q = c.dataset.copilotQ;
    if (q === 'current') { const d = Landmarks[AppState.destKey]; addMsg('user', `Report on ${d.name}`); runReport({ lat: d.lat, lon: d.lon }); }
    else { const p = parseCoords(q); if (p) { addMsg('user', `Report on ${c.textContent.trim()}`); runReport(p); } }
  }));

  document.querySelectorAll('[data-copilot-ask]').forEach(c => c.addEventListener('click', () => {
    const q = c.dataset.copilotAsk; addMsg('user', q);
    const d = Landmarks[AppState.destKey];
    runChat(q, parseCoords($('copilotCoordInput').value) || { lat: d.lat, lon: d.lon });
  }));

  $('copilotChatForm').addEventListener('submit', e => {
    e.preventDefault();
    const text = $('copilotChatInput').value.trim();
    if (!text || busy) return;
    $('copilotChatInput').value = '';
    addMsg('user', text);
    const inline = parseCoords(text), box = parseCoords($('copilotCoordInput').value), d = Landmarks[AppState.destKey];
    const target = inline || box || { lat: d.lat, lon: d.lon };
    if (inline && /\b(report|briefing|analyze)\b/i.test(text)) runReport(target, text);
    else runChat(text, target);
  });

  window.openCopilotForCoords = (lat, lon, label) => {
    openDrawer();
    if (label) addMsg('user', `Inspect ${label} (${Number(lat).toFixed(4)}°N, ${Number(lon).toFixed(4)}°E)`);
    runReport({ lat: Number(lat), lon: Number(lon) });
  };
  window.askCopilotFollowUp = q => { openDrawer(); addMsg('user', q); const d = Landmarks[AppState.destKey]; runChat(q, parseCoords($('copilotCoordInput').value) || { lat: d.lat, lon: d.lon }); };
}

document.addEventListener('DOMContentLoaded', () => {
  initMapInteractions();
  initEvents();
  renderScienceSections();
  updateAll();
  initCopilot();
});
window.addEventListener('load', () => {
  drawMap();
  drawElevationProfile();
});
