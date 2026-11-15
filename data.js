const Landmarks = {
  butler: {
    id: 'butler',
    name: 'Octavia E. Butler Landing',
    shortName: 'Butler Landing',
    role: 'Primary Habitat & Landing Site',
    lat: 18.4447,
    lon: 77.4508,
    elevM: -2570,
    color: '#1d6f42',
    visorX: 28,
    visorY: 64,
    crismId: 'FRT000047A3',
    description: 'Touchdown site of NASA Perseverance on Feb 18, 2021 upon the crater-floor fractured rough unit (Máaz formation). Serves as primary pressurized base station.',
    observed: 'Dark-toned, vesicular basaltic blocks and wind-scoured regolith hollows imaged by Mastcam-Z and Navcam.',
    inferred: 'Igneous lava flows or sheet-like impact melt emplaced prior to western delta progradation.',
    minerals: [
      { name: 'High-Ca Pyroxene (Augite)', formula: '(Ca,Mg,Fe)₂Si₂O₆', band: '1.05 & 2.30 μm', confidence: 'High', significance: 'Confirms mafic igneous floor bedrock.' },
      { name: 'Plagioclase Feldspar', formula: '(Na,Ca)(Si,Al)₄O₈', band: '1.25 μm Fe²⁺', confidence: 'Moderate', significance: 'Indicates evolved basaltic crystallization.' }
    ],
    citation: 'Farley et al. (2022), Science 377 · NASA Mars 2020 Landing Site Working Group'
  },
  threeforks: {
    id: 'threeforks',
    name: 'Three Forks Sample Depot',
    shortName: 'Three Forks',
    role: 'Cached Sample Depot · Delta Base',
    lat: 18.4470,
    lon: 77.4020,
    elevM: -2555,
    color: '#d97706',
    visorX: 43,
    visorY: 62,
    crismId: 'HRL000040FF',
    description: 'Flat, smooth terrain at the toe of the western delta where Perseverance deposited 10 sealed titanium sample tubes for Mars Sample Return.',
    observed: 'Fine-grained sandstone, sulfate-cemented siltstone, and low-slope aeolian ripples.',
    inferred: 'Distal prodeltaic lakebed deposits ideal for low-energy surface operations and sample caching.',
    minerals: [
      { name: 'Mg/Fe Phyllosilicates (Smectite)', formula: '(Mg,Fe)₃(Si,Al)₄O₁₀(OH)₂', band: '1.92 & 2.31 μm', confidence: 'High', significance: 'Aqueous alteration and high biosignature preservation potential.' },
      { name: 'Hydrated Sulfates', formula: 'MgSO₄·nH₂O', band: '1.94 & 2.40 μm', confidence: 'High', significance: 'Records late-stage evaporative lake chemistry.' }
    ],
    citation: 'Sun et al. (2023), JGR Planets · NASA PIA25681'
  },
  belva: {
    id: 'belva',
    name: 'Belva Crater · Delta Fan',
    shortName: 'Belva Crater',
    role: 'Primary Stratigraphic Outcrop',
    lat: 18.4800,
    lon: 77.3800,
    elevM: -2502,
    color: '#cf4724',
    visorX: 54,
    visorY: 57,
    crismId: 'FRT00005850',
    description: '900-meter-wide impact crater excavated directly into the upper western Jezero delta fan, exposing cross-bedded fluvial-lacustrine foreset strata.',
    observed: 'Dipping sandstone beds, boulder-rich ejecta apron, and truncated deltaic scarps.',
    inferred: 'Natural geological cross-section revealing stacked river-delta deposition episodes.',
    minerals: [
      { name: 'Fe/Mg Smectite Clays', formula: 'Nontronite / Saponite', band: '2.29–2.31 μm', confidence: 'Very High', significance: 'Detrital clays transported by ancient Neretva river waters.' },
      { name: 'Magnesite Carbonate', formula: 'MgCO₃', band: '2.30 & 2.50 μm', confidence: 'High', significance: 'Precipitated in neutral-to-alkaline lacustrine shoreline.' }
    ],
    citation: 'Mangold et al. (2021), Science 374 · NASA PIA25912'
  },
  neretva: {
    id: 'neretva',
    name: 'Neretva Vallis Margin',
    shortName: 'Neretva Inlet',
    role: 'Ancient River Breach & Carbonate Rim',
    lat: 18.5000,
    lon: 77.3400,
    elevM: -2430,
    color: '#1c5d8c',
    visorX: 69,
    visorY: 53,
    crismId: 'FRT000047A3',
    description: 'Western breach in Jezero Crater rim where the ancient Neretva Vallis river carved a canyon and fed the paleolake, bordered by the Marginal Carbonate unit.',
    observed: 'Bright-toned, fractured carbonate-bearing outcrops and coarse conglomerate boulders.',
    inferred: 'Nearshore paleolake beach and hydrothermal/fluvial margin prime for stromatolite-like biosignatures.',
    minerals: [
      { name: 'Mg-Rich Carbonate', formula: '(Mg,Fe)CO₃', band: '2.31 & 2.51 μm', confidence: 'Very High', significance: 'Strongest orbital carbonate signature in Jezero Crater.' },
      { name: 'Hydrated Silica (Opal-A)', formula: 'SiO₂·nH₂O', band: '2.21 μm', confidence: 'High', significance: 'Exceptional microfossil entombment matrix.' }
    ],
    citation: 'Horgan et al. (2020), Icarus 339 · Tarnas et al. (2021)'
  },
  jezerocenter: {
    id: 'jezerocenter',
    name: 'Jezero Basin Center',
    shortName: 'Basin Center',
    role: 'Deep Paleolake Floor Reference',
    lat: 18.4100,
    lon: 77.6900,
    elevM: -2610,
    color: '#63348c',
    visorX: 83,
    visorY: 61,
    crismId: 'HRL000040FF',
    description: 'Central low-elevation basin floor of the 45-km Jezero impact crater, characterized by extensive sand sheets, transverse aeolian ridges, and crater-floor basalt.',
    observed: 'Smooth dark-toned plains interrupted by secondary craters and windblown bedforms.',
    inferred: 'Deepest portion of the Noachian paleolake overlain by post-lacustrine volcanic and aeolian cover.',
    minerals: [
      { name: 'Forsteritic Olivine', formula: '(Mg,Fe)₂SiO₄', band: '1.05–1.30 μm broad', confidence: 'High', significance: 'Cumulate igneous bedrock exposed across Séítah and central basin.' },
      { name: 'Low-Ca Pyroxene', formula: '(Mg,Fe)SiO₃', band: '0.92 & 1.85 μm', confidence: 'Moderate', significance: 'Noachian crustal basement signature.' }
    ],
    citation: 'Goudge et al. (2015), JGR Planets · Sun & Stack (2020) USGS SIM 3464'
  }
};

const UsgsGeologicUnits = [
  {
    code: 'HNd',
    name: 'Western Delta Fan Deposits',
    age: 'Hesperian–Noachian Transition (~3.7 Ga)',
    color: '#d97706',
    frictionMu: 0.16,
    slopeDeg: 11,
    minerals: ['Fe/Mg Smectites', 'Mg-Carbonate', 'Hydrated Silica'],
    lithology: 'Layered fluvial-lacustrine sandstones, siltstones, and boulder conglomerates forming a bird-foot delta.',
    evaGuidance: 'Firm bedrock benches (μ = 0.16) with steep scarp edges requiring careful slope routing.',
    coords: [[18.508, 77.338], [18.512, 77.395], [18.485, 77.422], [18.452, 77.412], [18.444, 77.372], [18.478, 77.335]]
  },
  {
    code: 'HNl',
    name: 'Máaz Crater Floor (Rough Fractured)',
    age: 'Hesperian–Noachian (~3.8 Ga)',
    color: '#9a3412',
    frictionMu: 0.17,
    slopeDeg: 4,
    minerals: ['High-Ca Pyroxene', 'Plagioclase', 'Fe-Oxides'],
    lithology: 'Platy, fractured basaltic lava flows and regolith hollows covering the western Jezero floor.',
    evaGuidance: 'Low-slope graded terrain (μ = 0.17) ideal for low-energy, high-safety EVA traverses.',
    coords: [[18.485, 77.422], [18.490, 77.495], [18.435, 77.500], [18.420, 77.425], [18.452, 77.412]]
  },
  {
    code: 'Nol',
    name: 'Séítah Olivine-Bearing Floor Unit',
    age: 'Noachian (>3.8 Ga)',
    color: '#15803d',
    frictionMu: 0.22,
    slopeDeg: 6,
    minerals: ['Forsteritic Olivine', 'Mg-Carbonate', 'Serpentine'],
    lithology: 'Weathered olivine-cumulate ridges and carbonate-altered bedrock exposed beneath Máaz.',
    evaGuidance: 'Moderate traction across windblown sand ripples between bedrock ridges (μ = 0.22).',
    coords: [[18.468, 77.432], [18.472, 77.475], [18.432, 77.478], [18.428, 77.436]]
  },
  {
    code: 'Hl',
    name: 'Marginal Carbonate & Inlet Unit',
    age: 'Hesperian–Noachian (~3.7 Ga)',
    color: '#1c5d8c',
    frictionMu: 0.19,
    slopeDeg: 9,
    minerals: ['Magnesite (MgCO₃)', 'Hydrated Silica', 'Olivine'],
    lithology: 'Light-toned carbonate-cemented sandstones and shoreline deposits along the inner western rim.',
    evaGuidance: 'Moderate slopes (μ = 0.19) with high astrobiological sampling priority.',
    coords: [[18.525, 77.310], [18.528, 77.355], [18.495, 77.350], [18.485, 77.315]]
  },
  {
    code: 'Nnu',
    name: 'Jezero Crater Rim Highlands',
    age: 'Early–Middle Noachian (>3.9 Ga)',
    color: '#63348c',
    frictionMu: 0.26,
    slopeDeg: 18,
    minerals: ['Low-Ca Pyroxene', 'Impact Megabreccia', 'Clays'],
    lithology: 'Uplifted impact crater rim blocks and ancient crustal megabreccia.',
    evaGuidance: 'Steep talus slopes (~18°) and loose scree (μ = 0.26); avoid unless targeted.',
    coords: [[18.545, 77.280], [18.545, 77.325], [18.470, 77.320], [18.425, 77.305], [18.425, 77.275]]
  },
  {
    code: 'Ac',
    name: 'Belva Crater Ejecta Apron',
    age: 'Amazonian (<1.0 Ga)',
    color: '#c82828',
    frictionMu: 0.29,
    slopeDeg: 12,
    minerals: ['Reworked Delta Clasts', 'Impact Glass'],
    lithology: 'Blocky, unconsolidated impact ejecta blanket surrounding 900-m Belva Crater.',
    evaGuidance: 'High rolling resistance from dense angular boulders (μ = 0.29); shortest chord only.',
    coords: [[18.490, 77.368], [18.490, 77.394], [18.468, 77.394], [18.468, 77.368]]
  }
];

const PerseveranceTraverse = [
  { lat: 18.4447, lon: 77.4508, sol: 0, label: 'Butler Landing' },
  { lat: 18.4360, lon: 77.4450, sol: 120, label: 'Artuby Ridge' },
  { lat: 18.4410, lon: 77.4350, sol: 210, label: 'South Séítah' },
  { lat: 18.4470, lon: 77.4020, sol: 415, label: 'Three Forks Depot' },
  { lat: 18.4650, lon: 77.3920, sol: 570, label: 'Wildcat Ridge' },
  { lat: 18.4800, lon: 77.3800, sol: 785, label: 'Belva Crater Rim' },
  { lat: 18.4920, lon: 77.3580, sol: 980, label: 'Marginal Carbonate' },
  { lat: 18.5000, lon: 77.3400, sol: 1150, label: 'Neretva Vallis' }
];

const RegionCallouts = [
  { lat: 18.494, lon: 77.388, title: 'WESTERN DELTA FAN (HNd)', sub: 'Fluvial-lacustrine strata · 3.7 Ga' },
  { lat: 18.436, lon: 77.456, title: 'SÉÍTAH & MÁAZ FLOOR', sub: 'Olivine cumulate & basaltic flows' },
  { lat: 18.514, lon: 77.326, title: 'NERETVA VALLIS BREACH', sub: 'Ancient river inlet & carbonates' }
];
