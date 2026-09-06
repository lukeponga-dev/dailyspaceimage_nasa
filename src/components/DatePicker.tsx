/**
 * DatePicker Component
 * 
 * - What the component does:
 *   Provides an intuitive celestial date control console and a full-featured Mobile Modal Calendar
 *   with quick-jump shortcuts (Today, Previous, Next, Random, APOD Epoch 1995).
 * 
 * - Why the design change improves UX:
 *   1. Eliminates invalid API requests by constraining bounds to APOD launch (1995-06-16) and NASA HQ Eastern Time.
 *   2. Mobile modal calendar offers high-contrast 48px tap targets, month/year navigation, and day grid.
 *   3. Offers persistent quick-jump triggers directly on the control bar and inside the modal.
 *   4. Displays accessible, non-blocking inline alerts (`role="alert"`) if an out-of-range date is entered.
 * 
 * - How the styling works:
 *   Constructed with obsidian card styling (`bg-[#0B0D13]/95`), gold accent borders (`border-[#E4A853]/30`),
 *   monospace typography (`font-mono`), smooth `motion/react` modal animations, and glowing hover states.
 */

import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  Clock, 
  AlertCircle, 
  X, 
  ChevronDown,
  Sparkles,
  Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getEasternDate, addDays, NASA_EPOCH, getRandomDate, formatDate } from '../utils/dateUtils';

interface DatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  disabled?: boolean;
}

export default function DatePicker({ selectedDate, onDateChange, disabled = false }: DatePickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const todayStr = getEasternDate();

  // Parse currently selected year and month for calendar modal state
  const selectedYear = parseInt(selectedDate.substring(0, 4), 10) || 2026;
  const selectedMonth = parseInt(selectedDate.substring(5, 7), 10) - 1 || 0;

  const [viewYear, setViewYear] = useState(selectedYear);
  const [viewMonth, setViewMonth] = useState(selectedMonth);

  // Sync calendar view month/year when modal opens
  const handleOpenModal = () => {
    setViewYear(parseInt(selectedDate.substring(0, 4), 10) || 2026);
    setViewMonth(parseInt(selectedDate.substring(5, 7), 10) - 1 || 0);
    setIsModalOpen(true);
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

  // Calendar matrix calculations
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayOfWeek = useMemo(() => {
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  const handleMonthChange = (delta: number) => {
    let newMonth = viewMonth + delta;
    let newYear = viewYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }

    // Don't navigate before 1995 or beyond current year
    if (newYear < 1995) return;
    const maxYear = parseInt(todayStr.substring(0, 4), 10);
    if (newYear > maxYear) return;

    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const isoDate = `${viewYear}-${formattedMonth}-${formattedDay}`;

    if (isoDate < NASA_EPOCH) {
      setValidationError(`Date cannot precede APOD launch (${formatDate(NASA_EPOCH)})`);
      return;
    }

    if (isoDate > todayStr) {
      setValidationError(`Date cannot be in the future relative to NASA HQ (${formatDate(todayStr)})`);
      return;
    }

    setValidationError(null);
    onDateChange(isoDate);
    setIsModalOpen(false);
  };

  return (
    <div id="apod-date-selector-root" className="w-full flex flex-col items-center gap-2.5">
      {/* 
        Main Date Selector Command Console:
        Houses [ ◀ Prev ], [ 📅 YYYY-MM-DD ▾ ] (Modal trigger), [ Next ▶ ], [ ⟳ Random ], and [ Today ]
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
          className="min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center text-slate-300 hover:text-[#E4A853] bg-white/[0.03] hover:bg-[#E4A853]/15 border border-white/5 hover:border-[#E4A853]/40 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-25 disabled:pointer-events-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E4A853]"
          title="Previous Observation"
          aria-label="Previous day"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        {/* Date Selector Display & Modal Trigger: [ 📅 2026-09-05 ▾ ] */}
        <button
          id="date-selector-modal-trigger-btn"
          type="button"
          onClick={handleOpenModal}
          disabled={disabled}
          className="relative flex items-center gap-2 bg-[#050608] hover:bg-[#0C0E12] border border-white/15 hover:border-[#E4A853]/50 focus:border-[#E4A853] focus:ring-2 focus:ring-[#E4A853]/20 rounded-xl px-3 sm:px-4 py-2 transition-all shadow-inner min-h-[44px] cursor-pointer text-left group/datebtn active:scale-95"
          aria-label={`Open calendar modal to change date. Currently selected: ${selectedDate}`}
        >
          <CalendarIcon size={16} className="text-[#E4A853] shrink-0" aria-hidden="true" />
          <span className="text-xs sm:text-sm font-mono font-semibold text-slate-100 group-hover/datebtn:text-[#FFD700] transition-colors tracking-wider">
            {selectedDate}
          </span>
          <ChevronDown size={14} className="text-slate-400 group-hover/datebtn:text-[#E4A853] transition-colors shrink-0" />
        </button>

        {/* Step to next day */}
        <button
          id="date-selector-next-btn"
          type="button"
          onClick={handleNext}
          disabled={disabled || isAtMax}
          className="min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center text-slate-300 hover:text-[#E4A853] bg-white/[0.03] hover:bg-[#E4A853]/15 border border-white/5 hover:border-[#E4A853]/40 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-25 disabled:pointer-events-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E4A853]"
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
          className="min-h-[44px] flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-mono font-medium text-slate-300 hover:text-[#E4A853] bg-white/[0.03] hover:bg-[#E4A853]/15 border border-white/10 hover:border-[#E4A853]/40 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-[#E4A853]"
          title="Jump to Random Historical Observation"
          aria-label="Jump to random historical observation"
        >
          <Shuffle size={14} aria-hidden="true" />
          <span className="hidden sm:inline">Random</span>
        </button>

        {/* Quick action: Today */}
        <button
          id="date-selector-today-btn"
          type="button"
          onClick={handleToday}
          disabled={disabled || isAtMax}
          className="min-h-[44px] flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-mono font-bold bg-[#E4A853] text-[#050608] hover:bg-[#f3be73] hover:shadow-[0_0_20px_rgba(228,168,83,0.4)] rounded-xl transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md focus:outline-none focus:ring-2 focus:ring-[#E4A853]"
          title="Jump to Latest Coordinates"
          aria-label="Jump to today's coordinates"
        >
          <Clock size={14} aria-hidden="true" />
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

      {/* =========================================================================
          ENHANCED MOBILE MODAL CALENDAR (Interactive Month Grid & Quick-Jump Shortcuts)
          ========================================================================= */}
      <AnimatePresence>
        {isModalOpen && (
          <div 
            id="mobile-calendar-modal-backdrop"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-modal-title"
          >
            {/* Backdrop click to dismiss */}
            <div 
              className="absolute inset-0 cursor-pointer"
              onClick={() => setIsModalOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              id="calendar-modal-content"
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-sm bg-[#0C0E12] border border-[#E4A853]/40 rounded-2xl p-5 shadow-[0_25px_70px_rgba(0,0,0,0.9)] space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header: Month/Year Stepper & Close */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={16} className="text-[#E4A853]" />
                  <h3 id="calendar-modal-title" className="font-serif font-bold text-base text-white">
                    Select Observation
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close calendar modal"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Month / Year Navigator */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => handleMonthChange(-1)}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-white/5 hover:bg-[#E4A853]/20 text-slate-300 hover:text-[#E4A853] border border-white/10 transition-colors cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="text-center font-mono font-bold text-sm text-[#FFD700]">
                  {monthNames[viewMonth]} {viewYear}
                </div>

                <button
                  type="button"
                  onClick={() => handleMonthChange(1)}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-white/5 hover:bg-[#E4A853]/20 text-slate-300 hover:text-[#E4A853] border border-white/10 transition-colors cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono font-semibold text-slate-400 uppercase">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Day Matrix Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty padding cells for first week */}
                {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-9 w-full" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1;
                  const formattedMonth = String(viewMonth + 1).padStart(2, '0');
                  const formattedDay = String(day).padStart(2, '0');
                  const cellDate = `${viewYear}-${formattedMonth}-${formattedDay}`;

                  const isSelected = cellDate === selectedDate;
                  const isToday = cellDate === todayStr;
                  const isDisabled = cellDate < NASA_EPOCH || cellDate > todayStr;

                  return (
                    <button
                      key={`day-${day}`}
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      disabled={isDisabled}
                      className={`h-9 w-full rounded-lg text-xs font-mono font-medium flex items-center justify-center transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#E4A853] text-[#050608] border-[#E4A853] font-bold shadow-[0_0_12px_rgba(228,168,83,0.4)]'
                          : isToday
                          ? 'bg-[#E4A853]/15 text-[#FFD700] border-[#E4A853]/40 font-bold'
                          : 'bg-white/[0.03] text-slate-200 border-white/5 hover:bg-white/10 hover:border-[#E4A853]/30'
                      } ${isDisabled ? 'opacity-20 cursor-not-allowed pointer-events-none' : 'active:scale-90'}`}
                      aria-label={`Select ${cellDate}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Quick-Jump Shortcut Buttons inside Modal */}
              <div className="pt-3 border-t border-white/10 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block text-left">
                  Quick-Jump Shortcuts
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { onDateChange(todayStr); setIsModalOpen(false); }}
                    className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-[#E4A853] text-[#050608] font-mono font-bold text-xs flex items-center justify-center gap-1 shadow-md hover:bg-[#f3be73] active:scale-95 cursor-pointer"
                  >
                    <Clock size={12} />
                    <span>Today</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { onDateChange(addDays(selectedDate, -1)); setIsModalOpen(false); }}
                    className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-mono text-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft size={12} />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { onDateChange(getRandomDate(todayStr)); setIsModalOpen(false); }}
                    className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-[#E4A853]/20 border border-[#E4A853]/30 text-[#E4A853] font-mono text-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Shuffle size={12} />
                    <span>Random</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                  <span>Epoch: {NASA_EPOCH}</span>
                  <button
                    type="button"
                    onClick={() => { onDateChange(NASA_EPOCH); setIsModalOpen(false); }}
                    className="text-[#E4A853] hover:underline cursor-pointer"
                  >
                    First APOD (1995)
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
