/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import NasaApod from './components/NasaApod';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Discover from './components/Discover';
import Favorites from './components/Favorites';
import LandingPage from './components/LandingPage';
import { getEasternDate } from './utils/dateUtils';

interface ApodData {
  title: string;
  url: string;
  explanation: string;
  date: string;
  media_type: string;
  copyright?: string;
  hdurl?: string;
}

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [selectedDate, setSelectedDate] = useState<string>(() => getEasternDate());
  const [favorites, setFavorites] = useState<ApodData[]>(() => {
    try {
      const stored = localStorage.getItem('cosmic_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error loading favorites from localStorage:', e);
      return [];
    }
  });

  // Sync favorites with localStorage
  useEffect(() => {
    localStorage.setItem('cosmic_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (item: ApodData) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.date === item.date);
      if (exists) {
        return prev.filter(f => f.date !== item.date);
      } else {
        return [...prev, item];
      }
    });
  };

  const removeFavorite = (date: string) => {
    setFavorites(prev => prev.filter(f => f.date !== date));
  };

  const isFavorite = (date: string) => {
    return favorites.some(f => f.date === date);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setCurrentView('today');
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return (
          <LandingPage 
            onNavigate={setCurrentView}
            favoritesCount={favorites.length}
            onSelectDate={handleSelectDate}
          />
        );
      case 'today': 
        return (
          <NasaApod 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onToggleFavorite={toggleFavorite}
            isFavorite={isFavorite}
          />
        );
      case 'discover': 
        return (
          <Discover 
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            isFavorite={isFavorite}
            onSelectImage={handleSelectDate}
          />
        );
      case 'favorites': 
        return (
          <Favorites 
            favorites={favorites}
            onRemoveFavorite={removeFavorite}
            onSelectImage={handleSelectDate}
          />
        );
      default: 
        return (
          <NasaApod 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onToggleFavorite={toggleFavorite}
            isFavorite={isFavorite}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <Layout 
        currentView={currentView} 
        onNavigate={setCurrentView}
        selectedDate={selectedDate}
        onDateChange={handleSelectDate}
      >
        {renderView()}
      </Layout>
      <SpeedInsights />
    </ErrorBoundary>
  );
}
