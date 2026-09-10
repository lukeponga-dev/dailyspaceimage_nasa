import React from 'react';
import { ApodData } from '../types';
import { addDays, getEasternDate } from '../utils/dateUtils';

interface ArchiveGridProps {
  onSelectDate: (date: string) => void;
  onBrowse: () => void;
  items?: ApodData[];
}

const ARCHIVE_COLORS = [
  'var(--ar1)',
  'var(--ar2)',
  'var(--ar3)',
  'var(--ar4)',
  'var(--ar5)',
  'var(--ar6)',
];

export default function ArchiveGrid({ onSelectDate, onBrowse, items = [] }: ArchiveGridProps) {
  const today = getEasternDate();

  // Generate 6 recent dates if items are not yet populated
  const displayDates = React.useMemo(() => {
    if (items.length >= 6) {
      return items.slice(0, 6).map((it, i) => ({
        fullDate: it.date,
        shortLabel: it.date.slice(5),
        imageUrl: it.media_type === 'image' ? it.url : undefined,
        color: ARCHIVE_COLORS[i % ARCHIVE_COLORS.length],
        title: it.title,
      }));
    }

    return Array.from({ length: 6 }, (_, i) => {
      const fullDate = addDays(today, -(i + 3));
      const match = items.find((item) => item.date === fullDate);
      return {
        fullDate,
        shortLabel: fullDate.slice(5),
        imageUrl: match?.media_type === 'image' ? match.url : undefined,
        color: ARCHIVE_COLORS[i % ARCHIVE_COLORS.length],
        title: match?.title || `Observation ${fullDate}`,
      };
    });
  }, [items, today]);

  return (
    <section aria-labelledby="archive-heading">
      <div className="section-header">
        <span className="section-title" id="archive-heading">NASA APOD Archive</span>
        <button
          type="button"
          className="section-link"
          onClick={onBrowse}
          aria-label="Browse full calendar archive"
        >
          Browse Archive →
        </button>
      </div>

      <div className="archive-grid" role="list">
        {displayDates.map((entry) => (
          <div
            key={entry.fullDate}
            className="archive-cell"
            role="listitem"
            onClick={() => onSelectDate(entry.fullDate)}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectDate(entry.fullDate);
              }
            }}
            title={entry.title}
            aria-label={`Jump to ${entry.fullDate}: ${entry.title}`}
            style={{
              background: entry.imageUrl
                ? `linear-gradient(to top, rgba(6,6,11,0.85), transparent), url(${entry.imageUrl}) center/cover no-repeat`
                : `linear-gradient(135deg, ${entry.color}, var(--surface))`,
            }}
          >
            <div className="archive-cell-label">{entry.shortLabel}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
