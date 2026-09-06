/**
 * DatePicker Component
 * 
 * - What the component does:
 *   Provides an intuitive celestial date control console allowing users to step chronologically
 *   day-by-day, select custom dates via native ISO calendar pickers, jump immediately to today's
 *   coordinates in Eastern Time (NASA HQ), or randomize the archival timestamp across 1995–present.
 * 
 * - Why the design change improves UX:
 *   1. Eliminates invalid API requests by constraining min date to APOD launch (1995-06-16) and max to today.
 *   2. Synchronizes timezone boundaries with NASA HQ (US Eastern Time), preventing 404s before daily release.
 *   3. Offers tactile, instant button controls for rapid archival exploration.
 *   4. Displays accessible, non-blocking inline alerts (`role="alert"`) if an out-of-range date is entered.
 * 
 * - How the styling works:
 *   Constructed with obsidian card styling (`bg-[#0B0D13]/95`), gold accent borders (`border-[#E4A853]/30`),
 *   monospace typography (`font-mono`), dark color-scheme calendar inputs (`[color-scheme:dark]`),
 *   and glowing hover states (`hover:shadow-[0_0_20px_rgba(228,168,83,0.4)]`).
 * 
 * - How it fits into the NASA APOD workflow:
 *   Mounted atop `NasaApod.tsx`. When a user selects or steps a date, it fires `onDateChange`,
 *   which triggers data resolution through `fetchApodByDate` and re-renders `ApodHero`.
 */

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

    // Validation checks against astronomical bounds
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
    <div id="apod-date-selector-root" className="w-full flex flex-col items-center gap-2.5">
      {/* 
        Main Date Selector Command Console
        - What it does: Houses interactive controls for chronological APOD navigation, custom date picking, random archives, and jumping to today.
        - Why it exists: Provides an accessible, responsive, and visually cohesive control deck styled to match NASA telemetry hardware.
        - How it fits into the workflow: Directly captures user input and triggers `onDateChange` to load celestial imagery.
      */}
      <div 
        id="apod-date-selector-toolbar" 
        className="relative flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-[#0B0D13]/95 border border-[#E4A853]/30 backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.7),0_0_24px_rgba(228,168,83,0.08)] transition-all duration-300"
      >
        {/* Step to previous day */}
        <button
          id="date-selector-prev-btn"
          type="button"
          onClick={handlePrev}
          disabled={disabled || isAtMin}
          className="p-2 sm:p-2.5 text-slate-300 hover:text-[#E4A853] bg-white/[0.03] hover:bg-[#E4A853]/15 border border-white/5 hover:border-[#E4A853]/40 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-25 disabled:pointer-events-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#E4A853]"
          title="Previous Observation"
          aria-label="Previous day"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        {/* Date Selector input console container */}
        <div 
          id="date-selector-input-wrapper" 
          className="relative flex items-center bg-[#050608] border border-white/15 hover:border-[#E4A853]/50 focus-within:border-[#E4A853] focus-within:ring-2 focus-within:ring-[#E4A853]/20 rounded-xl px-3 py-1.5 sm:py-2 transition-all shadow-inner"
        >
          <Calendar size={15} className="text-[#E4A853] shrink-0 mr-2 pointer-events-none" aria-hidden="true" />
          <input
            id="date-selector-input"
            type="date"
            min={NASA_EPOCH}
            max={todayStr}
            value={selectedDate}
            onChange={handleInputChange}
            disabled={disabled}
            className="bg-transparent border-0 text-xs sm:text-sm font-mono font-medium text-slate-100 focus:outline-none transition-colors cursor-pointer disabled:opacity-50 [color-scheme:dark] tracking-wider"
            aria-label="Select observation date"
          />
        </div>

        {/* Step to next day */}
        <button
          id="date-selector-next-btn"
          type="button"
          onClick={handleNext}
          disabled={disabled || isAtMax}
          className="p-2 sm:p-2.5 text-slate-300 hover:text-[#E4A853] bg-white/[0.03] hover:bg-[#E4A853]/15 border border-white/5 hover:border-[#E4A853]/40 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-25 disabled:pointer-events-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#E4A853]"
          title="Next Observation"
          aria-label="Next day"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>

        <div className="h-6 w-px bg-white/10 mx-0.5 hidden sm:block" />

        {/* Quick action: Random */}
        <button
          id="date-selector-random-btn"
          type="button"
          onClick={handleRandom}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-mono font-medium text-slate-300 hover:text-[#E4A853] bg-white/[0.03] hover:bg-[#E4A853]/15 border border-white/10 hover:border-[#E4A853]/40 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-1 focus:ring-[#E4A853]"
          title="Jump to Random Historical Observation"
          aria-label="Jump to random historical observation"
        >
          <Shuffle size={13} aria-hidden="true" />
          <span className="hidden sm:inline">Random</span>
        </button>

        {/* Quick action: Today */}
        <button
          id="date-selector-today-btn"
          type="button"
          onClick={handleToday}
          disabled={disabled || isAtMax}
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-mono font-bold bg-[#E4A853] text-[#050608] hover:bg-[#f3be73] hover:shadow-[0_0_20px_rgba(228,168,83,0.4)] rounded-xl transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md focus:outline-none focus:ring-1 focus:ring-[#E4A853]"
          title="Jump to Latest Coordinates"
          aria-label="Jump to today's coordinates"
        >
          <Clock size={13} aria-hidden="true" />
          <span>Today</span>
        </button>
      </div>

      {/* Inline validation alert */}
      {validationError && (
        <div 
          id="date-selector-validation-alert" 
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-2 text-xs text-amber-300 font-mono bg-amber-950/50 border border-amber-500/30 px-3.5 py-1.5 rounded-xl shadow-lg backdrop-blur-md animate-fade-in"
        >
          <AlertCircle size={14} className="shrink-0 text-amber-400" aria-hidden="true" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
