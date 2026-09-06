/**
 * NasaApod Component
 * 
 * - What the component does:
 *   Orchestrates the main Astronomy Picture of the Day inspection workspace.
 *   Manages fetching state, date synchronization with NASA HQ, error boundaries with rapid recovery buttons,
 *   floating toast HUD confirmations for favorites/shares, and coordinates child components (`DatePicker`, `ApodHero`, `ApodModal`, `HeroSkeleton`).
 * 
 * - Why the design change improves UX:
 *   1. Guarantees zero cumulative layout shift by swapping smoothly between `HeroSkeleton` and `ApodHero`.
 *   2. Prevents blank dead-ends: automatically recovers from unpublished future dates and offers instant recovery actions ("Jump to Today", "Previous Day", "Retry").
 *   3. Enhances accessibility through polite ARIA live regions for toast announcements and full keyboard control.
 * 
 * - How the styling works:
 *   Centered responsive column (`max-w-4xl mx-auto space-y-6`), floating obsidian/gold toast HUD (`fixed top-6 right-6`),
 *   and high-contrast error banners (`bg-red-950/20 border-red-500/30`).
 * 
 * - How it fits into the NASA APOD workflow:
 *   Serves as the primary active view (`currentView === 'apod'`). Receives `selectedDate` from `App.tsx`
 *   and delegates API calls to `fetchApod` in `/src/lib/fetchApod.ts`.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ApodData } from '../types';
import { fetchApod } from '../lib/fetchApod';
import { getEasternDate, addDays } from '../utils/dateUtils';
import DatePicker from './DatePicker';
import ApodHero from './ApodHero';
import ApodModal from './ApodModal';
import { HeroSkeleton } from './Skeleton';

interface NasaApodProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onToggleFavorite: (item: ApodData) => void;
  isFavorite: (date: string) => boolean;
}

export default function NasaApod({
  selectedDate,
  onDateChange,
  onToggleFavorite,
  isFavorite,
}: NasaApodProps) {
  const [data, setData] = useState<ApodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  /**
   * Displays temporary toast notification in an accessible HUD banner.
   */
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  /**
   * Dispatches data query to the APOD proxy / cache layer.
   * Handles edge cases such as future dates by updating parent state to the actual fallback date.
   */
  const loadData = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchApod(date);
      setData(result.data);

      // If API resolved to an actual fallback date, update parent state
      if (result.actualDate !== date) {
        onDateChange(result.actualDate);
      }

      if (result.isFallback) {
        showToast(`Observation for ${date} unavailable. Synchronized to ${result.actualDate}.`);
      }
    } catch (err: any) {
      console.error('Fetch error in NasaApod:', err);
      setError(err.message || 'Failed to establish deep space telemetry link.');
    } finally {
      setLoading(false);
    }
  }, [onDateChange]);

  useEffect(() => {
    loadData(selectedDate);
  }, [loadData, selectedDate]);

  /**
   * Web Share API integration with automatic fallback to clipboard copy.
   */
  const handleShare = async (item: ApodData) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: item.explanation.substring(0, 120) + '...',
          url: item.url,
        });
        showToast('Telemetry shared successfully!');
      } else {
        await navigator.clipboard.writeText(item.url);
        showToast('Stellar Link copied to clipboard!');
      }
    } catch {
      // User cancelled share
    }
  };

  /**
   * Toggles cataloging into local favorites vault with toast feedback.
   */
  const handleToggleFavWithToast = (item: ApodData) => {
    const wasFav = isFavorite(item.date);
    onToggleFavorite(item);
    showToast(wasFav ? 'De-cataloged from Vault' : 'Cataloged to Saved Wonders ⭐');
  };

  const todayStr = getEasternDate();

  return (
    <div id="nasa-apod-workspace-root" className="w-full mx-auto animate-fade-in relative flex flex-col items-center space-y-6">
      {/* Toast Notification HUD with polite ARIA live announcement */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="fixed top-6 right-6 z-50 pointer-events-none"
      >
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              role="status"
              className="bg-[#0C0E12]/95 border border-[#E4A853]/40 text-[#E4A853] px-5 py-3 rounded-full backdrop-blur-xl shadow-[0_10px_30px_rgba(228,168,83,0.25)] flex items-center gap-2.5 text-xs font-mono tracking-wider font-semibold pointer-events-auto"
            >
              <Sparkles size={14} className="animate-spin [animation-duration:6s]" aria-hidden="true" />
              <span>{toastMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Date Selector with Validation & Quick Triggers */}
      <DatePicker
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        disabled={loading}
      />

      {/* Error Boundary display if API limits exceeded or network failure */}
      {error && (
        <div 
          role="alert"
          className="bg-red-950/20 border border-red-500/30 rounded-2xl p-6 text-red-300 flex flex-col sm:flex-row items-start gap-4 max-w-2xl w-full mx-auto shadow-xl"
        >
          <AlertCircle className="text-red-400 shrink-0 mt-1" size={22} aria-hidden="true" />
          <div className="space-y-3 flex-1 text-left">
            <div>
              <h4 className="text-sm font-semibold text-red-200">Cosmic Link Exception</h4>
              <p className="text-xs font-sans font-light leading-relaxed text-red-300/80 pt-1">
                {error}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onDateChange(todayStr)}
                className="px-3 py-1.5 bg-[#E4A853]/15 hover:bg-[#E4A853]/25 border border-[#E4A853]/30 text-[#E4A853] text-xs font-mono rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-[#E4A853]"
              >
                Jump to Today
              </button>
              <button
                type="button"
                onClick={() => onDateChange(addDays(selectedDate, -1))}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono rounded-lg cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                Previous Day
              </button>
              <button
                type="button"
                onClick={() => loadData(selectedDate)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <RefreshCw size={12} aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Perceived Performance: Skeleton Loader */}
      {loading && <HeroSkeleton />}

      {/* Daily APOD Hero Showcase */}
      {!loading && !error && data && (
        <ApodHero
          data={data}
          onOpenModal={() => setModalOpen(true)}
          onToggleFavorite={handleToggleFavWithToast}
          isFavorite={isFavorite(data.date)}
          onShare={handleShare}
        />
      )}

      {/* Accessible HD Fullscreen Viewer Modal */}
      <ApodModal
        item={data}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

