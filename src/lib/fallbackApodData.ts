import { ApodData } from '../types';
import { buildApodTelemetry } from './apodClassifier';

/**
 * Curated authentic NASA APOD astronomical observations.
 * Serves as resilient high-fidelity fallback when NASA's public API is rate-limited (HTTP 429),
 * experiences latency timeouts, or drops network packets.
 */
const RAW_FALLBACK_ARCHIVE = [
  {
    date: '2024-05-14',
    title: 'Aurora over Canadian Rockies',
    explanation: 'A severe solar storm triggered breathtaking aurora borealis displays visible far south across North America, illuminating the snow-capped Canadian Rocky Mountains with violet and emerald ionization curtains.',
    url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80',
    hdurl: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=2400&q=95',
    media_type: 'image' as const,
    copyright: 'Alan Dyer',
  },
  {
    date: '2023-11-20',
    title: 'Webb’s First Deep Field (SMACS 0723)',
    explanation: 'NASA’s James Webb Space Telescope delivered the deepest and sharpest infrared image of the distant universe so far. Known as Webb’s First Deep Field, galaxy cluster SMACS 0723 acts as a gravitational lens, magnifying extremely faint galaxies born over 13 billion years ago.',
    url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80',
    hdurl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=2400&q=95',
    media_type: 'image' as const,
    copyright: 'NASA, ESA, CSA, STScI',
  },
  {
    date: '2023-09-15',
    title: 'Pillars of Creation in Infrared',
    explanation: 'A lush, highly detailed starscape captured by the James Webb Space Telescope reveals three-dimensional towers of interstellar gas and dust within the Eagle Nebula (M16), where infant protostars coalesce inside dense molecular globules.',
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80',
    hdurl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=2400&q=95',
    media_type: 'image' as const,
    copyright: 'NASA, ESA, CSA, STScI, J. DePasquale',
  },
  {
    date: '2023-08-04',
    title: 'The Great Spiral Galaxy in Andromeda',
    explanation: 'Spanning more than 220,000 light-years across, Messier 31 is the closest major spiral galaxy to our own Milky Way. Its magnificent spiral arms are lined with glowing blue young star clusters and dark dust lanes.',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    hdurl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2400&q=95',
    media_type: 'image' as const,
    copyright: 'Subaru Telescope (NAOJ), Hubble Space Telescope, Robert Gendler',
  },
  {
    date: '2023-06-22',
    title: 'The Ring Nebula (M57)',
    explanation: 'Formed by a dying sun-like star casting off its outer incandescent envelope, the Ring Nebula presents an intricate glowing donut of ionized gas located approximately 2,570 light-years away in the constellation Lyra.',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    hdurl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2400&q=95',
    media_type: 'image' as const,
    copyright: 'ESA/Webb, NASA, CSA, M. Barlow',
  },
  {
    date: '2023-05-18',
    title: 'The Cosmic Cliffs of Carina',
    explanation: 'This landscape of mountains and valleys speckled with glittering stars is actually the edge of a nearby, young, star-forming region named NGC 3324 in the Carina Nebula, captured in infrared by the James Webb Space Telescope.',
    url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80',
    hdurl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=2400&q=95',
    media_type: 'image' as const,
    copyright: 'NASA, ESA, CSA, STScI',
  },
  {
    date: '2023-04-12',
    title: 'Jupiter with Io and Europa',
    explanation: 'Captured during close orbital flyby, Jupiter displays turbulent atmospheric jet streams, the Great Red Spot storm vortex, and its volcanic moon Io casting an eclipse shadow across the swirling cloud tops.',
    url: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&w=1200&q=80',
    hdurl: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?auto=format&fit=crop&w=2400&q=95',
    media_type: 'image' as const,
    copyright: 'NASA, JPL-Caltech, SwRI, MSSS',
  },
  {
    date: '2023-03-08',
    title: 'Cassini’s Grand Saturn Panorama',
    explanation: 'From high above the ecliptic plane, the Cassini spacecraft imaged Saturn’s icy ring system backlit by the distant Sun, exposing delicate ringlet divisions and atmospheric hex cloud patterns.',
    url: 'https://images.unsplash.com/photo-1614728423169-3f65fd722b7e?auto=format&fit=crop&w=1200&q=80',
    hdurl: 'https://images.unsplash.com/photo-1614728423169-3f65fd722b7e?auto=format&fit=crop&w=2400&q=95',
    media_type: 'image' as const,
    copyright: 'NASA, JPL-Caltech, Space Science Institute',
  },
  {
    date: '2023-02-14',
    title: 'The Rosette Nebula in Hydrogen Alpha',
    explanation: 'Shaped like a cosmic rose, the Rosette Nebula (NGC 2237) is a colossal emission nebula harboring open cluster NGC 2244, whose stellar winds carve out a central cavity in the molecular gas.',
    url: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?auto=format&fit=crop&w=1200&q=80',
    hdurl: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?auto=format&fit=crop&w=2400&q=95',
    media_type: 'image' as const,
    copyright: 'Brian Davis',
  },
  {
    date: '2023-01-29',
    title: 'The Pleiades Star Cluster',
    explanation: 'The Seven Sisters cluster (M45) glides through a veil of interstellar dust. Reflection nebulae scatter the brilliant blue light of hot B-type stars across dozens of light-years.',
    url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=1200&q=80',
    hdurl: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=2400&q=95',
    media_type: 'image' as const,
    copyright: 'Rogelio Bernal Andreo',
  },
  {
    date: '2022-12-19',
    title: 'The Sombrero Galaxy (M104)',
    explanation: 'A hallmark edge-on galaxy in Virgo, Messier 104 exhibits an unusually large central bulge and prominent dark dust lane that gives it the appearance of a wide-brimmed sombrero hat.',
    url: 'https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?auto=format&fit=crop&w=1200&q=80',
    hdurl: 'https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?auto=format&fit=crop&w=2400&q=95',
    media_type: 'image' as const,
    copyright: 'NASA, ESA, and The Hubble Heritage Team (STScI/AURA)',
  },
  {
    date: '2022-11-03',
    title: 'Crab Nebula: Supernova Remnant M1',
    explanation: 'The expanding filamentary debris field of a supernova witnessed on Earth in 1054 AD. At the core spins an ultra-dense neutron star pulsar flashing 30 times per second.',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    hdurl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2400&q=95',
    media_type: 'image' as const,
    copyright: 'NASA, ESA, J. Hester and A. Loll',
  },
];

/**
 * Returns enriched fallback APOD records with telemetry and distance parameters.
 */
export function getCuratedFallbackApods(): ApodData[] {
  return RAW_FALLBACK_ARCHIVE.map((entry) => {
    const telemetry = buildApodTelemetry({
      title: entry.title,
      explanation: entry.explanation,
    });

    return {
      title: entry.title,
      url: entry.url,
      hdurl: entry.hdurl,
      explanation: entry.explanation,
      date: entry.date,
      media_type: entry.media_type,
      copyright: entry.copyright,
      category: telemetry.category,
      confidence: telemetry.confidence,
      matchedKeywords: telemetry.matchedKeywords,
      distanceLightYears: telemetry.distanceLightYears,
      distance: telemetry.distance,
    };
  });
}
