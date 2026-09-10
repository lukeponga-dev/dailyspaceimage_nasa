import React from 'react';
import { useTheme } from '../context/ThemeContext';

export type NavTab = 'today' | 'explore' | 'archive' | 'saved' | 'about';

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isSyncing?: boolean;
}

export default function Header({ activeTab, onTabChange, isSyncing = false }: HeaderProps) {
  const { theme, toggle } = useTheme();

  const segItems: { id: NavTab; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'explore', label: 'Explore' },
    { id: 'archive', label: 'Archive' },
    { id: 'saved', label: 'Saved' },
    { id: 'about', label: 'About' },
  ];

  const deskItems: { id: NavTab; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'explore', label: 'Explore' },
    { id: 'archive', label: 'Archive' },
    { id: 'saved', label: 'Saved' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header className="header" id="dsu-header">
      <div className="header-top">
        {/* Logo */}
        <div 
          className="logo" 
          onClick={() => onTabChange('today')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onTabChange('today');
            }
          }}
          aria-label="Deep Space Uplink Home"
        >
          <div className="logo-ring" aria-hidden="true" />
          <div className="logo-text">
            <span className="logo-name">Deep Space Uplink</span>
            <span className="logo-sub">Est. 2026-09-06</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="desk-nav" aria-label="Main Desktop Navigation">
          {deskItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`desk-nav-item${item.id === activeTab ? ' active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Header Right Status and Theme Toggle */}
        <div className="header-right">
          <div className="header-status">
            <span 
              className={`status-dot ${isSyncing ? 'animate-ping' : ''}`} 
              style={{ background: isSyncing ? 'var(--accent)' : 'var(--teal)' }}
              aria-hidden="true" 
            />
            <span 
              className="status-label"
              style={{ color: isSyncing ? 'var(--accent)' : 'var(--teal)' }}
            >
              {isSyncing ? 'Syncing...' : 'Uplink Active'}
            </span>
          </div>

          <button
            type="button"
            id="theme-toggle-btn"
            className="theme-toggle"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Current: ${theme} mode. Click to toggle.`}
          >
            <div className="toggle-knob">
              <svg className="toggle-icon toggle-icon--moon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
              <svg className="toggle-icon toggle-icon--sun" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Segmented Sub-Navigation Bar */}
      <div className="seg-nav" role="tablist" aria-label="Section Tabs">
        {segItems.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={item.id === activeTab}
            className={`seg-btn${item.id === activeTab ? ' active' : ''}`}
            onClick={() => onTabChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
}
