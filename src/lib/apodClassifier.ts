/**
 * APOD Classifier & Astrometric Telemetry Module
 * 
 * - What it does:
 *   Analyzes NASA APOD titles and scientific descriptions using weighted lexical token analysis
 *   to categorize astronomical celestial bodies (planets, dwarf planets, nebulae, galaxies, star clusters,
 *   space missions, terrestrial phenomena) with a calculated confidence score.
 *   Resolves known physical distances from Earth in Light-Years (ly).
 * 
 * - Why it exists:
 *   Enriches raw APOD JSON into structured astrometric telemetry for real-time mission HUD readouts,
 *   deep space distance gauges, and automated taxonomy filtering.
 * 
 * - How it fits into the workflow:
 *   Called during APOD ingestion in both API/fetch pipelines and hero presentation layers.
 */

import { formatDistance as formatDistanceUnits, FormattedDistance } from './distanceFormatter';

// ---------------------------------------------------------
//  APOD CATEGORY KEYWORDS
// ---------------------------------------------------------
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  planet: ["mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune"],
  dwarfPlanet: ["pluto", "ceres", "haumea", "makemake", "eris"],
  moon: ["moon", "lunar", "io", "europa", "ganymede", "callisto", "titan", "enceladus", "phobos", "deimos"],
  star: ["star", "sun", "supernova", "white dwarf", "red giant", "neutron star"],
  nebula: ["nebula", "emission nebula", "planetary nebula", "supernova remnant"],
  galaxy: ["galaxy", "andromeda", "milky way", "sombrero", "whirlpool", "m87", "ngc", "ic "],
  cluster: ["cluster", "globular", "open cluster", "m13", "pleiades", "hyades"],
  deepSpace: ["interstellar", "quasar", "pulsar", "black hole", "cosmic web"],
  earth: ["aurora", "storm", "lightning", "volcano", "earth", "atmosphere", "halo"],
  rocket: ["launch", "rocket", "falcon", "sls", "shuttle", "booster", "liftoff"],
  human: ["astronaut", "crew", "eva", "portrait", "training", "spacesuit"],
  iss: ["iss", "international space station", "module", "spacecraft", "capsule"],
  telescope: ["jwst", "hubble", "chandra", "spitzer", "observatory", "telescope"],
  diagram: ["diagram", "chart", "infographic", "map", "schematic", "illustration"],
  art: ["artist", "rendering", "concept art", "visualization"],
  simulation: ["simulation", "model", "numerical", "computed", "synthetic"]
};

// ---------------------------------------------------------
//  MATCH HELPER
// ---------------------------------------------------------
export function matches(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

// ---------------------------------------------------------
//  CLASSIFIER WITH CONFIDENCE
// ---------------------------------------------------------
export function classifyApodWithConfidence(title: string, explanation: string) {
  const text = (title + " " + explanation).toLowerCase();

  let bestCategory = "unknown";
  let bestScore = 0;
  let matchedKeywords: string[] = [];

  for (const category in CATEGORY_KEYWORDS) {
    const keywords = CATEGORY_KEYWORDS[category];
    const found = keywords.filter(k => text.includes(k));
    const score = found.length / keywords.length;

    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
      matchedKeywords = found;
    }
  }

  return {
    category: bestCategory,
    confidence: Number(bestScore.toFixed(2)),
    matchedKeywords
  };
}

// ---------------------------------------------------------
//  DISTANCE RESOLVER (in Light-Years)
// ---------------------------------------------------------
export function resolveDistanceLy(title: string, category: string): number | null {
  const t = title.toLowerCase();

  // PLANETS + DWARF PLANETS
  if (category === "planet" || category === "dwarfPlanet") {
    const planetDistancesLy: Record<string, number> = {
      mercury: 0.000006,
      venus: 0.000011,
      earth: 0,
      mars: 0.000037,
      jupiter: 0.000082,
      saturn: 0.00015,
      uranus: 0.0003,
      neptune: 0.00047,
      pluto: 0.00055,
      ceres: 0.000015,
      haumea: 0.00063,
      makemake: 0.00065,
      eris: 0.00096
    };

    for (const key in planetDistancesLy) {
      if (t.includes(key)) return planetDistancesLy[key];
    }
  }

  // GALAXIES
  if (category === "galaxy") {
    const galaxyDistancesLy: Record<string, number> = {
      andromeda: 2537000,
      sombrero: 29000000,
      whirlpool: 31000000,
      triangulum: 3000000,
      m87: 53000000,
      milky: 0
    };

    for (const key in galaxyDistancesLy) {
      if (t.includes(key)) return galaxyDistancesLy[key];
    }
  }

  // NEBULAE
  if (category === "nebula") {
    const nebulaDistancesLy: Record<string, number> = {
      orion: 1344,
      crab: 6500,
      eagle: 7000,
      ring: 2300,
      helix: 655,
      rosette: 5200
    };

    for (const key in nebulaDistancesLy) {
      if (t.includes(key)) return nebulaDistancesLy[key];
    }
  }

  // STAR CLUSTERS
  if (category === "cluster") {
    const clusterDistancesLy: Record<string, number> = {
      pleiades: 444,
      hyades: 153,
      omega: 15800,
      m13: 22500
    };

    for (const key in clusterDistancesLy) {
      if (t.includes(key)) return clusterDistancesLy[key];
    }
  }

  // STARS
  if (category === "star") {
    const starDistancesLy: Record<string, number> = {
      sun: 0,
      betelgeuse: 642,
      rigel: 860,
      sirius: 8.6,
      vega: 25,
      polaris: 433
    };

    for (const key in starDistancesLy) {
      if (t.includes(key)) return starDistancesLy[key];
    }
  }

  // NON-SPACE OBJECTS
  if (
    category === "earth" ||
    category === "human" ||
    category === "rocket" ||
    category === "diagram" ||
    category === "art" ||
    category === "iss" ||
    category === "telescope" ||
    category === "simulation" ||
    category === "unknown"
  ) {
    return null;
  }

  return null;
}

// ---------------------------------------------------------
//  PIPELINE TELEMETRY BUILDER
// ---------------------------------------------------------
export function buildApodTelemetry(apod: { title: string; explanation: string }) {
  const { category, confidence, matchedKeywords } = classifyApodWithConfidence(
    apod.title,
    apod.explanation
  );

  const distanceLy =
    confidence >= 0.2
      ? resolveDistanceLy(apod.title, category)
      : null;

  const distance = formatDistanceUnits(distanceLy);

  return {
    category,
    confidence,
    matchedKeywords,
    distanceLightYears: distanceLy,
    distance
  };
}

// ---------------------------------------------------------
//  FORMATTING HELPERS FOR UI & TELEMETRY
// ---------------------------------------------------------
export function formatCategoryName(category: string): string {
  const map: Record<string, string> = {
    planet: "Major Planet",
    dwarfPlanet: "Dwarf Planet",
    moon: "Natural Satellite / Moon",
    star: "Stellar Object / Star",
    nebula: "Nebula & Interstellar Cloud",
    galaxy: "Extragalactic System",
    cluster: "Star Cluster",
    deepSpace: "Deep Space Phenomenon",
    earth: "Earth Atmosphere & Aurora",
    rocket: "Launch Vehicle / Rocket",
    human: "Human Spaceflight & EVA",
    iss: "Orbital Space Station",
    telescope: "Observatory & Instrument",
    diagram: "Scientific Diagram",
    art: "Concept Art / Visualization",
    simulation: "Numerical Simulation",
    unknown: "Deep Space Observation"
  };
  return map[category] || "Cosmic Observation";
}

export function formatDistance(ly: number | null): string {
  if (ly === null) return "Unknown / Celestial Coordinates Pending";
  if (ly === 0) return "0 ly (Earth / Local Sun)";
  if (ly < 0.001) {
    // Convert to Astronomical Units (AU) or Light-Minutes/Seconds for solar system scale
    const au = (ly * 63241.1).toFixed(2);
    return `${ly} ly (~${au} AU)`;
  }
  if (ly >= 1_000_000) {
    return `${(ly / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })} Million ly`;
  }
  return `${ly.toLocaleString()} ly`;
}
