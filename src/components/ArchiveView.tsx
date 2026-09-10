import React, { useState } from 'react';
import { getEasternDate, NASA_EPOCH, addDays } from '../utils/dateUtils';
import { Calendar, Search, Sparkles, Compass } from 'lucide-react';

interface ArchiveViewProps {
  onSelectDate: (date: string) => void;
}

const HISTORIC_MILESTONES = [
  { date: '2022-07-12', title: 'Webb’s First Deep Field (SMACS 0723)', tag: 'JWST' },
  { date: '2020-07-13', title: 'Comet NEOWISE over the Alps', tag: 'Comet' },
  { date: '2019-04-11', title: 'First Image of a Black Hole (M87*)', tag: 'EHT' },
  { date: '2015-07-15', title: 'Pluto and Charon from New Horizons', tag: 'Flyby' },
  { date: '2004-03-09', title: 'Hubble Ultra Deep Field', tag: 'HST' },
  { date: '1995-06-20', title: 'The Pleiades Star Cluster', tag: 'Pioneer' },
  { date: '1995-06-16', title: 'First NASA APOD: Neutron Star', tag: 'Epoch' },
];

export default function ArchiveView({ onSelectDate }: ArchiveViewProps) {
  const today = getEasternDate();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [manualDate, setManualDate] = useState<string>(today);

  // Years from 1995 to current
  const years = Array.from({ length: currentYear - 1995 + 1 }, (_, i) => currentYear - i);

  // Sample dates across selected year
  const sampleMonths = [
    { name: 'January', mm: '01' },
    { name: 'February', mm: '02' },
    { name: 'March', mm: '03' },
    { name: 'April', mm: '04' },
    { name: 'May', mm: '05' },
    { name: 'June', mm: '06' },
    { name: 'July', mm: '07' },
    { name: 'August', mm: '08' },
    { name: 'September', mm: '09' },
    { name: 'October', mm: '10' },
    { name: 'November', mm: '11' },
    { name: 'December', mm: '12' },
  ];

  const handleYearJump = (year: number, mm: string) => {
    let day = '15';
    // If year 1995 and before June 16
    if (year === 1995 && parseInt(mm) < 6) {
      mm = '06';
      day = '16';
    }
    const target = `${year}-${mm}-${day}`;
    if (target > today) {
      onSelectDate(today);
    } else {
      onSelectDate(target);
    }
  };

  return (
    <div className="space-y-6 text-left w-full" id="archive-view-container">
      {/* View Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif italic text-text">
          NASA APOD Archive
        </h2>
        <p className="text-xs font-mono text-text-dim mt-1 tracking-wider uppercase">
          1995-06-16 TO PRESENT • 30+ YEARS OF ASTRONOMICAL DISCOVERY
        </p>
      </div>

      {/* Date Jump Search Card */}
      <div className="scan-card">
        <div className="scan-title flex items-center justify-between">
          <span>Temporal Telemetry Link</span>
          <span className="text-[9px] font-mono text-accent">DIRECT ACCESS</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <input
              type="date"
              value={manualDate}
              min={NASA_EPOCH}
              max={today}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-border-accent"
              aria-label="Direct date selection"
            />
          </div>
          <button
            type="button"
            className="date-btn justify-center py-2.5 px-5"
            onClick={() => onSelectDate(manualDate)}
          >
            <Compass size={13} aria-hidden="true" />
            <span>Engage Uplink</span>
          </button>
        </div>
      </div>

      {/* Historic Milestones */}
      <div>
        <div className="section-header mb-3">
          <span className="section-title">Archival Milestones</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {HISTORIC_MILESTONES.map((item) => (
            <div
              key={item.date}
              className="p-3 bg-surface border border-border hover:border-border-accent rounded-lg cursor-pointer transition-all hover:translate-x-1"
              onClick={() => onSelectDate(item.date)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectDate(item.date);
                }
              }}
              role="button"
              aria-label={`Jump to historic milestone: ${item.title}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-mono text-accent">{item.date}</span>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-accent-dim text-accent border border-border-accent">
                  {item.tag}
                </span>
              </div>
              <h3 className="text-xs font-semibold text-text line-clamp-1">{item.title}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Chronological Year Navigator */}
      <div>
        <div className="section-header mb-3">
          <span className="section-title">Timeline Explorer</span>
          <span className="text-[10px] font-mono text-text-dim">SELECT YEAR</span>
        </div>

        {/* Year Pills Scroll */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {years.map((y) => (
            <button
              key={y}
              type="button"
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors shrink-0 ${
                selectedYear === y
                  ? 'bg-accent text-black font-bold'
                  : 'bg-surface border border-border text-text-mid hover:text-text'
              }`}
              onClick={() => setSelectedYear(y)}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Months Grid for Selected Year */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3">
          {sampleMonths.map((m) => {
            const isFuture = `${selectedYear}-${m.mm}-01` > today;
            const isBeforeEpoch = selectedYear === 1995 && parseInt(m.mm) < 6;
            const isDisabled = isFuture || isBeforeEpoch;

            return (
              <button
                key={m.mm}
                type="button"
                disabled={isDisabled}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isDisabled
                    ? 'opacity-30 border-border cursor-not-allowed bg-surface/40'
                    : 'bg-surface border-border hover:border-border-accent hover:bg-surface-hover cursor-pointer'
                }`}
                onClick={() => handleYearJump(selectedYear, m.mm)}
              >
                <div className="text-[10px] font-mono text-text-dim">
                  {selectedYear}-{m.mm}
                </div>
                <div className="text-xs font-semibold text-text mt-0.5">
                  {m.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
