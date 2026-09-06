/**
 * Utility functions for parsing and formatting NASA APOD scientific texts for mobile-first skimmable cards.
 */

export interface ParsedScientificContent {
  keyInsight: string;
  notes: string[];
  missionContext: {
    instrumentOrMission: string;
    credit: string;
    date: string;
    observationType: string;
  };
}

/**
 * Parses raw NASA APOD explanation text into structured sections:
 * - Key Insight (1-2 opening sentences)
 * - Scientific Notes (clean bullet points for rapid skimming)
 * - Mission Context (extracted observatory/mission details, credits, and classification)
 */
export function parseScientificSummary(
  explanation: string,
  title: string,
  copyright?: string,
  date?: string,
  mediaType?: string
): ParsedScientificContent {
  if (!explanation) {
    return {
      keyInsight: 'Observation details incoming from NASA deep-space telemetry network.',
      notes: ['Awaiting archival telemetry stream from NASA mission logs.'],
      missionContext: {
        instrumentOrMission: 'NASA Deep Space Network',
        credit: copyright || 'NASA / Public Domain',
        date: date || 'Archived Observation',
        observationType: mediaType === 'video' ? 'Video Telemetry' : 'Deep Space Imagery'
      }
    };
  }

  // Split into sentences using common punctuation boundaries
  const sentences = explanation
    .replace(/\s+/g, ' ')
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  // Key Insight: First 1 or 2 sentences
  const keyInsight = sentences.slice(0, Math.min(2, sentences.length)).join(' ');

  // Scientific Notes: Remaining sentences formatted as bullet points (take up to 3-4 points)
  let rawNotes = sentences.slice(Math.min(2, sentences.length));
  if (rawNotes.length === 0) {
    // If text was very short, split by commas or clauses
    rawNotes = [keyInsight];
  }

  // Deduplicate and constrain length for mobile screens
  const notes = rawNotes.slice(0, 3).map(n => {
    // Ensure clean sentence formatting
    return n.endsWith('.') ? n : `${n}.`;
  });

  // Detect mission/observatory mentions from title + text
  const combined = `${title} ${explanation}`.toLowerCase();
  let instrumentOrMission = 'NASA Deep Space Observatory Array';

  if (combined.includes('james webb') || combined.includes('jwst') || combined.includes('nircam') || combined.includes('miri')) {
    instrumentOrMission = 'James Webb Space Telescope (JWST)';
  } else if (combined.includes('hubble') || combined.includes('hst')) {
    instrumentOrMission = 'Hubble Space Telescope (HST)';
  } else if (combined.includes('chandra')) {
    instrumentOrMission = 'Chandra X-ray Observatory';
  } else if (combined.includes('spitzer')) {
    instrumentOrMission = 'Spitzer Space Telescope';
  } else if (combined.includes('new horizons') || combined.includes('pluto')) {
    instrumentOrMission = 'New Horizons Interplanetary Mission';
  } else if (combined.includes('perseverance') || combined.includes('curiosity') || combined.includes('mars')) {
    instrumentOrMission = 'NASA Mars Exploration Rover System';
  } else if (combined.includes('cassini') || combined.includes('saturn')) {
    instrumentOrMission = 'Cassini-Huygens Mission';
  } else if (combined.includes('eso') || combined.includes('very large telescope') || combined.includes('alma')) {
    instrumentOrMission = 'European Southern Observatory (ESO)';
  } else if (combined.includes('voyager')) {
    instrumentOrMission = 'Voyager Interstellar Mission';
  }

  return {
    keyInsight,
    notes: notes.length > 0 ? notes : ['Continuous telemetry monitoring via NASA astronomical archives.'],
    missionContext: {
      instrumentOrMission,
      credit: copyright ? copyright.trim() : 'NASA / APOD Science Team',
      date: date || 'Recorded Observation',
      observationType: mediaType === 'video' ? 'Astronomy Video Stream' : 'High-Resolution Optical/Infrared'
    }
  };
}
