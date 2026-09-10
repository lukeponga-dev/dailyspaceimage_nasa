import React from 'react';
import { ApodData } from '../types';

interface StreamSectionProps {
  items: ApodData[];
  onSelectDate: (date: string) => void;
  onViewAll: () => void;
}

export default function StreamSection({ items, onSelectDate, onViewAll }: StreamSectionProps) {
  if (!items || items.length === 0) return null;

  return (
    <section aria-labelledby="stream-heading">
      <div className="section-header">
        <span className="section-title" id="stream-heading">Recent Transmissions</span>
        <button
          type="button"
          className="section-link"
          onClick={onViewAll}
          aria-label="View all items in explore catalog"
        >
          View All →
        </button>
      </div>

      <div className="stream-scroll" role="list">
        {items.map((item, index) => {
          const isVideo = item.media_type === 'video';
          const fallbackClass = `stream-thumb-${(index % 3) + 1}`;

          return (
            <div
              key={item.date}
              className="stream-card"
              role="listitem"
              onClick={() => onSelectDate(item.date)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectDate(item.date);
                }
              }}
              aria-label={`Select observation for ${item.date}: ${item.title}`}
            >
              <div
                className={`stream-thumb ${fallbackClass}`}
                style={
                  !isVideo && item.url
                    ? { backgroundImage: `url(${item.url})` }
                    : undefined
                }
              >
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-[9px] font-mono tracking-wider text-accent uppercase bg-black/70 px-2 py-0.5 rounded">
                      Video
                    </span>
                  </div>
                )}
              </div>

              <div className="stream-info">
                <span className="stream-date">{item.date}</span>
                <h3 className="stream-title">{item.title}</h3>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
