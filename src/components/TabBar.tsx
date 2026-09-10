import React from 'react';
import { NavTab } from './Header';

interface TabBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  savedCount?: number;
}

interface TabDef {
  id: NavTab;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  {
    id: 'today',
    label: 'Today',
    icon: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </>
    ),
  },
  {
    id: 'explore',
    label: 'Explore',
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
  },
  {
    id: 'saved',
    label: 'Saved',
    icon: <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />,
  },
  {
    id: 'about',
    label: 'About',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </>
    ),
  },
];

export default function TabBar({ activeTab, onTabChange, savedCount = 0 }: TabBarProps) {
  return (
    <nav className="tab-bar" aria-label="Mobile Navigation" role="tablist">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`tab-item${isActive ? ' active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <div className="relative">
              <svg className="tab-icon" viewBox="0 0 24 24" aria-hidden="true">
                {tab.icon}
              </svg>
              {tab.id === 'saved' && savedCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-accent text-[8px] font-mono font-bold text-black rounded-full flex items-center justify-center">
                  {savedCount}
                </span>
              )}
            </div>
            <span className="tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
