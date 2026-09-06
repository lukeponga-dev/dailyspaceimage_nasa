import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Shuffle, Clock, AlertCircle } from 'lucide-react';
import { getEasternDate, addDays, NASA_EPOCH, getRandomDate, formatDate } from '../utils/dateUtils';

interface DatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  disabled?: boolean;
}

export default function DatePicker({ selectedDate, onDateChange, disabled = false }: DatePickerProps) {
  const [validationError, setValidationError] = useState<string | null>(null);
  const todayStr = getEasternDate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValidationError(null);

    if (!value) return;

    // Validation checks
    if (value < NASA_EPOCH) {
      setValidationError(`Date cannot precede APOD launch (${formatDate(NASA_EPOCH)})`);
      return;
    }

    if (value > todayStr) {
      setValidationError(`Date cannot be in the future relative to NASA HQ (${formatDate(todayStr)})`);
      return;
    }

    onDateChange(value);
  };

  const handlePrev = () => {
    setValidationError(null);
    if (selectedDate > NASA_EPOCH) {
      onDateChange(addDays(selectedDate, -1));
    }
  };

  const handleNext = () => {
    setValidationError(null);
    if (selectedDate < todayStr) {
      onDateChange(addDays(selectedDate, 1));
    }
  };

  const handleRandom = () => {
    setValidationError(null);
    onDateChange(getRandomDate(todayStr));
  };

  const handleToday = () => {
    setValidationError(null);
    onDateChange(todayStr);
  };

  const isAtMin = selectedDate <= NASA_EPOCH;
  const isAtMax = selectedDate >= todayStr;

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-xl bg-[#0C0E12]/90 border border-white/10 backdrop-blur-md shadow-lg">
        {/* Step to previous day */}
        <button
          onClick={handlePrev}
          disabled={disabled || isAtMin}
          className="p-2 text-slate-300 hover:text-[#E4A853] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
          title="Previous Day"
          aria-label="Previous day"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Date Selector input */}
        <div className="relative flex items-center">
          <Calendar size={14} className="absolute left-3 text-[#E4A853] pointer-events-none" />
          <input
            type="date"
            min={NASA_EPOCH}
            max={todayStr}
            value={selectedDate}
            onChange={handleInputChange}
            disabled={disabled}
            className="pl-8 pr-3 py-1.5 bg-[#050608] border border-white/10 focus:border-[#E4A853] text-xs font-mono text-slate-200 rounded-lg outline-none transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Select observation date"
          />
        </div>

        {/* Step to next day */}
        <button
          onClick={handleNext}
          disabled={disabled || isAtMax}
          className="p-2 text-slate-300 hover:text-[#E4A853] hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
          title="Next Day"
          aria-label="Next day"
        >
          <ChevronRight size={18} />
        </button>

        <div className="h-5 w-[1px] bg-white/10 mx-1 hidden sm:block" />

        {/* Quick action: Random */}
        <button
          onClick={handleRandom}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-[#E4A853] hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          title="Jump to Random Historical Observation"
        >
          <Shuffle size={13} />
          <span className="hidden sm:inline">Random</span>
        </button>

        {/* Quick action: Today */}
        <button
          onClick={handleToday}
          disabled={disabled || isAtMax}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-[#E4A853]/15 hover:bg-[#E4A853]/25 text-[#E4A853] border border-[#E4A853]/30 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Jump to Latest Coordinates"
        >
          <Clock size={13} />
          <span>Today</span>
        </button>
      </div>

      {/* Inline validation alert */}
      {validationError && (
        <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono bg-amber-950/40 border border-amber-500/20 px-3 py-1 rounded-md">
          <AlertCircle size={13} />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
