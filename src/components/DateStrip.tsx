import React, { useRef } from 'react';
import { getEasternDate, addDays, getRandomDate, NASA_EPOCH } from '../utils/dateUtils';
import { Calendar, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';

interface DateStripProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DateStrip({ selectedDate, onDateChange }: DateStripProps) {
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const today = getEasternDate();
  const isToday = selectedDate === today;
  const isAtEpoch = selectedDate <= NASA_EPOCH;

  // Format date to "Month Day, Year" in Cormorant Garamond
  const formattedDate = (() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d));
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      });
    } catch {
      return selectedDate;
    }
  })();

  const handlePrevDay = () => {
    if (isAtEpoch) return;
    onDateChange(addDays(selectedDate, -1));
  };

  const handleNextDay = () => {
    if (isToday) return;
    onDateChange(addDays(selectedDate, 1));
  };

  const handleToday = () => {
    onDateChange(today);
  };

  const handleRandom = () => {
    const random = getRandomDate(today);
    onDateChange(random);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onDateChange(e.target.value);
    }
  };

  return (
    <div className="date-strip" id="date-strip">
      <div className="flex items-center gap-2">
        <h1 className="date-label m-0 font-serif">
          {formattedDate}
        </h1>
        {isToday && (
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono tracking-widest uppercase bg-teal-dim text-teal border border-teal/20">
            Latest
          </span>
        )}
      </div>

      <div className="date-controls">
        {/* Step Prev Day */}
        <button
          type="button"
          className="date-btn p-1.5 sm:px-2.5 sm:py-2"
          onClick={handlePrevDay}
          disabled={isAtEpoch}
          title="Previous day"
          aria-label="Previous day"
        >
          <ChevronLeft size={13} aria-hidden="true" />
        </button>

        {/* Today Button */}
        <button
          type="button"
          className={`date-btn${isToday ? ' active' : ''}`}
          onClick={handleToday}
        >
          Today
        </button>

        {/* Random Button */}
        <button
          type="button"
          className="date-btn"
          onClick={handleRandom}
          title="Random historical APOD"
        >
          <Shuffle size={11} className="hidden sm:inline" aria-hidden="true" />
          Random
        </button>

        {/* Step Next Day */}
        <button
          type="button"
          className="date-btn p-1.5 sm:px-2.5 sm:py-2 disabled:opacity-30 disabled:pointer-events-none"
          onClick={handleNextDay}
          disabled={isToday}
          title="Next day"
          aria-label="Next day"
        >
          <ChevronRight size={13} aria-hidden="true" />
        </button>

        {/* Calendar Picker Trigger */}
        <button
          type="button"
          className="date-btn p-1.5 sm:px-2.5 sm:py-2 relative"
          onClick={() => {
            const input = dateInputRef.current;
            if (input) {
              if (typeof input.showPicker === 'function') {
                input.showPicker();
              } else {
                input.click();
              }
            }
          }}
          title="Pick date from calendar"
          aria-label="Pick date from calendar"
        >
          <Calendar size={13} aria-hidden="true" />
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            min={NASA_EPOCH}
            max={today}
            onChange={handleDatePickerChange}
            className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none w-0 h-0"
            tabIndex={-1}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}
