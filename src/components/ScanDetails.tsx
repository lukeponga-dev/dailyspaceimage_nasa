import React, { useMemo } from 'react';
import { ApodData } from '../types';
import { formatCategoryName } from '../lib/apodClassifier';

interface ScanDetailsProps {
  data: ApodData;
}

export default function ScanDetails({ data }: ScanDetailsProps) {
  // Extract astronomical parameters from the APOD data
  const objectName = useMemo(() => {
    const raw = data.title.split(/[:—–-]/)[0]?.trim() || data.title;
    return raw.length > 28 ? raw.slice(0, 26) + '...' : raw;
  }, [data.title]);

  const objectType = useMemo(() => {
    return data.category ? formatCategoryName(data.category) : 'Deep Space Phenomenon';
  }, [data.category]);

  const distanceText = useMemo(() => {
    if (data.distanceLightYears) {
      if (data.distanceLightYears < 0.001) {
        // Solar system distance
        return data.distance?.au ? `${data.distance.au.toLocaleString()} AU` : 'Solar System Vicinity';
      }
      return `${data.distanceLightYears.toLocaleString()} Light-Years`;
    }
    return 'Interstellar / Archival';
  }, [data.distanceLightYears, data.distance]);

  // Compute realistic telemetry quality metrics
  const signalQuality = useMemo(() => {
    if (data.hdurl) return 96;
    if (data.media_type === 'video') return 89;
    return 92;
  }, [data.hdurl, data.media_type]);

  const dataIntegrity = useMemo(() => {
    if (data.confidence && data.confidence > 0) {
      return Math.min(98, Math.max(78, Math.round(data.confidence * 100)));
    }
    return 88;
  }, [data.confidence]);

  const scanRows = [
    { label: 'Object', value: objectName, cls: 'accent' },
    { label: 'Type', value: objectType, cls: '' },
    { label: 'Observation Date', value: data.date, cls: '' },
    { label: 'Est. Distance', value: distanceText, cls: 'teal' },
  ];

  return (
    <section aria-labelledby="telemetry-heading">
      <div className="section-header">
        <span className="section-title" id="telemetry-heading">Scan Details</span>
      </div>

      <div className="scan-card" id="scan-telemetry-card">
        <div className="scan-title flex items-center justify-between">
          <span>Telemetry</span>
          <span className="text-[9px] font-mono text-text-dim tracking-wider">
            SENSOR LINK • NOMINAL
          </span>
        </div>

        {scanRows.map((row) => (
          <div key={row.label} className="scan-row">
            <span className="scan-label">{row.label}</span>
            <span className={`scan-value ${row.cls}`}>{row.value}</span>
          </div>
        ))}

        {/* Matched keywords if available */}
        {data.matchedKeywords && data.matchedKeywords.length > 0 && (
          <div className="scan-row pt-1">
            <span className="scan-label">Spectral Markers</span>
            <div className="flex flex-wrap gap-1 justify-end max-w-[65%]">
              {data.matchedKeywords.slice(0, 3).map((kw) => (
                <span
                  key={kw}
                  className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-hover text-text-dim border border-border"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Signal Quality Bar */}
        <div className="scan-bar-wrap pt-2 border-t border-border">
          <div className="scan-bar-label">
            <span>Signal Quality</span>
            <span>{signalQuality}%</span>
          </div>
          <div className="scan-bar-track">
            <div
              className="scan-bar-fill"
              style={{ width: `${signalQuality}%`, background: 'var(--teal)' }}
            />
          </div>
        </div>

        {/* Data Integrity Bar */}
        <div className="scan-bar-wrap">
          <div className="scan-bar-label">
            <span>Data Integrity</span>
            <span>{dataIntegrity}%</span>
          </div>
          <div className="scan-bar-track">
            <div
              className="scan-bar-fill"
              style={{ width: `${dataIntegrity}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
