import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Starfield from './components/Starfield';
import Header, { NavTab } from './components/Header';
import DateStrip from './components/DateStrip';
import FeaturedCard from './components/FeaturedCard';
import StreamSection from './components/StreamSection';
import ArchiveGrid from './components/ArchiveGrid';
import ScanDetails from './components/ScanDetails';
import TabBar from './components/TabBar';
import Gallery from './components/Gallery';
import ArchiveView from './components/ArchiveView';
import Favorites from './components/Favorites';
import About from './components/About';
import ApodModal from './components/ApodModal';
import { ApodData } from './types';
import { fetchApod, fetchApodRange } from './lib/fetchApod';
import { getEasternDate, addDays } from './utils/dateUtils';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('today');
  const [selectedDate, setSelectedDate] = useState<string>(() => getEasternDate());
  const [currentApod, setCurrentApod] = useState<ApodData | null>(null);
  const [streamItems, setStreamItems] = useState<ApodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalItem, setModalItem] = useState<ApodData | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Curated user favorites stored in localStorage
  const [favorites, setFavorites] = useState<ApodData[]>(() => {
    try {
      const stored = localStorage.getItem('cosmic_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cosmic_favorites', JSON.stringify(favorites));
    } catch {
      // Ignore local storage write errors
    }
  }, [favorites]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const isFavorite = useCallback(
    (date: string) => favorites.some((f) => f.date === date),
    [favorites]
  );

  const toggleFavorite = useCallback((item: ApodData) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.date === item.date);
      if (exists) {
        return prev.filter((f) => f.date !== item.date);
      } else {
        return [item, ...prev];
      }
    });
  }, []);

  const removeFavorite = useCallback((date: string) => {
    setFavorites((prev) => prev.filter((f) => f.date !== date));
  }, []);

  // Fetch current APOD record whenever selectedDate changes
  const loadApodData = useCallback(async (date: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchApod(date);
      setCurrentApod(result.data);

      if (result.actualDate !== date) {
        setSelectedDate(result.actualDate);
      }

      if (result.isFallback) {
        showToast(`Telemetry for ${date} was unavailable. Synchronized to ${result.actualDate}.`);
      }
    } catch (err: any) {
      console.error('APOD telemetry link error:', err);
      setError(err.message || 'Failed to establish deep space telemetry connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApodData(selectedDate);
  }, [loadApodData, selectedDate]);

  // Pre-fetch recent 11 days for the stream and archive grid
  useEffect(() => {
    let isMounted = true;
    const loadRecentStream = async () => {
      try {
        const today = getEasternDate();
        const start = addDays(today, -11);
        const list = await fetchApodRange(start, today);
        if (isMounted && list && list.length > 0) {
          // Sort reverse chronologically
          setStreamItems(
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          );
        }
      } catch (err) {
        console.warn('Stream pre-fetch skipped:', err);
      }
    };
    loadRecentStream();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setActiveTab('today');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const todayStr = getEasternDate();
  const isSelectedToday = selectedDate === todayStr;

  return (
    <ThemeProvider>
      {/* 90 Twinkling Stars in Background */}
      <Starfield count={90} />

      <div className="app-container">
        {/* Header with logo, desk-nav, uplink status, theme switch, and sub-nav */}
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isSyncing={loading}
        />

        {/* Toast HUD */}
        {toastMsg && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-20 right-4 z-50 px-4 py-2 bg-surface border border-border-accent text-accent text-xs font-mono rounded-lg shadow-2xl backdrop-blur-md animate-fade-in"
          >
            {toastMsg}
          </div>
        )}

        {/* Main Content Area */}
        <main className="main-content" role="main">
          {activeTab === 'today' && (
            <>
              {/* Date Strip with formatted Cormorant Garamond date & controls */}
              <DateStrip
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />

              {/* Error State with Recovery */}
              {error && (
                <div className="scan-card text-center p-8 space-y-4 max-w-lg mx-auto">
                  <AlertCircle size={28} className="text-accent mx-auto" aria-hidden="true" />
                  <h2 className="text-base font-semibold text-text">Telemetry Offline</h2>
                  <p className="text-xs text-text-mid">{error}</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      className="date-btn"
                      onClick={() => loadApodData(selectedDate)}
                    >
                      <RefreshCw size={12} aria-hidden="true" />
                      <span>Retry Link</span>
                    </button>
                    <button
                      type="button"
                      className="date-btn active"
                      onClick={() => setSelectedDate(todayStr)}
                    >
                      Jump to Today
                    </button>
                  </div>
                </div>
              )}

              {/* Loading Placeholder */}
              {loading && !error && (
                <div className="featured animate-pulse">
                  <div className="featured-img-container">
                    <div className="nebula-glow" />
                    <span className="text-xs font-mono text-accent uppercase tracking-widest relative z-10">
                      Decoding Sensor Array...
                    </span>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="h-6 bg-surface-hover rounded w-3/4" />
                    <div className="h-4 bg-surface-hover rounded w-1/2" />
                    <div className="h-16 bg-surface-hover rounded w-full" />
                  </div>
                </div>
              )}

              {/* Featured Observation Card */}
              {!loading && !error && currentApod && (
                <FeaturedCard
                  data={currentApod}
                  isToday={isSelectedToday}
                  isFavorite={isFavorite(currentApod.date)}
                  onToggleFavorite={toggleFavorite}
                  onOpenModal={() => setModalItem(currentApod)}
                  onShare={(it) => {
                    showToast(`Observation link ready for ${it.title}.`);
                  }}
                />
              )}

              {/* Stream Section: Recent Transmissions Carousel */}
              <StreamSection
                items={streamItems.filter((i) => i.date !== selectedDate).slice(0, 6)}
                onSelectDate={handleSelectDate}
                onViewAll={() => setActiveTab('explore')}
              />

              {/* Archive Grid: Recent Timeline Cells */}
              <ArchiveGrid
                onSelectDate={handleSelectDate}
                onBrowse={() => setActiveTab('archive')}
                items={streamItems}
              />

              {/* Scan Details: Telemetry and Astrometric Metrics */}
              {!loading && currentApod && (
                <ScanDetails data={currentApod} />
              )}
            </>
          )}

          {activeTab === 'explore' && (
            <Gallery
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
              onSelectImage={handleSelectDate}
            />
          )}

          {activeTab === 'archive' && (
            <ArchiveView onSelectDate={handleSelectDate} />
          )}

          {activeTab === 'saved' && (
            <Favorites
              favorites={favorites}
              onRemoveFavorite={removeFavorite}
              onSelectImage={handleSelectDate}
              onToggleFavorite={toggleFavorite}
            />
          )}

          {activeTab === 'about' && <About />}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        savedCount={favorites.length}
      />

      {/* Fullscreen High-Resolution Inspection Modal */}
      {modalItem && (
        <ApodModal
          item={modalItem}
          isOpen={Boolean(modalItem)}
          onClose={() => setModalItem(null)}
          isFavorite={isFavorite(modalItem.date)}
          onToggleFavorite={toggleFavorite}
          onSelectDate={(date) => {
            setModalItem(null);
            handleSelectDate(date);
          }}
        />
      )}
    </ThemeProvider>
  );
}
