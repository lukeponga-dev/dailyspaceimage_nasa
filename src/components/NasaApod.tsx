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

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

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

  const handleToggleFavWithToast = (item: ApodData) => {
    const wasFav = isFavorite(item.date);
    onToggleFavorite(item);
    showToast(wasFav ? 'De-cataloged from Vault' : 'Cataloged to Saved Wonders ⭐');
  };

  const todayStr = getEasternDate();

  return (
    <div className="w-full mx-auto animate-fade-in relative flex flex-col items-center space-y-6">
      {/* Toast Notification HUD */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-[#0C0E12]/95 border border-[#E4A853]/40 text-[#E4A853] px-5 py-3 rounded-full backdrop-blur-xl shadow-[0_10px_30px_rgba(228,168,83,0.25)] flex items-center gap-2.5 text-xs font-mono tracking-wider font-semibold"
          >
            <Sparkles size={14} className="animate-spin [animation-duration:6s]" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Date Selector with Validation & Quick Triggers */}
      <DatePicker
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        disabled={loading}
      />

      {/* Error Boundary display if API limits exceeded or network failure */}
      {error && (
        <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-6 text-red-300 flex flex-col sm:flex-row items-start gap-4 max-w-2xl w-full mx-auto shadow-xl">
          <AlertCircle className="text-red-400 shrink-0 mt-1" size={22} />
          <div className="space-y-3 flex-1 text-left">
            <div>
              <h4 className="text-sm font-semibold text-red-200">Cosmic Link Exception</h4>
              <p className="text-xs font-sans font-light leading-relaxed text-red-300/80 pt-1">
                {error}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => onDateChange(todayStr)}
                className="px-3 py-1.5 bg-[#E4A853]/15 hover:bg-[#E4A853]/25 border border-[#E4A853]/30 text-[#E4A853] text-xs font-mono rounded-lg cursor-pointer transition-colors"
              >
                Jump to Today
              </button>
              <button
                onClick={() => onDateChange(addDays(selectedDate, -1))}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono rounded-lg cursor-pointer transition-colors"
              >
                Previous Day
              </button>
              <button
                onClick={() => loadData(selectedDate)}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={12} />
                Retry
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
