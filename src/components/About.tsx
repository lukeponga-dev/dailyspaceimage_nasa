import React from 'react';
import { Database, Code, Radio, Shield, Sparkles, Compass } from 'lucide-react';

export default function About() {
  return (
    <div className="w-full space-y-6 text-left pb-16" id="about-mission-root">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-serif italic text-text">
          Deep Space Uplink Mission Dossier
        </h2>
        <p className="text-xs text-text-mid font-mono uppercase tracking-wider mt-1">
          OPERATIONAL SPECIFICATION • NASA APOD TELEMETRY INTERFACE
        </p>
      </div>

      {/* Mission Overview Card */}
      <div className="scan-card">
        <div className="scan-title flex items-center justify-between">
          <span>Telemetry Protocol</span>
          <span className="text-[9px] font-mono text-teal">ACTIVE LINK</span>
        </div>

        <p className="text-sm text-text leading-relaxed font-sans">
          Deep Space Uplink is an observational telemetry interface engineered to explore NASA's Astronomy Picture of the Day (APOD) archive. Sourced directly from NASA Goddard Space Flight Center and professional astronomers, it decodes celestial imagery, distance metrics, and spectral classifications in real time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-accent">
              <Database size={15} />
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                NASA APOD API
              </span>
            </div>
            <p className="text-xs text-text-mid leading-relaxed">
              Continuous operation since June 16, 1995. Features daily celestial photographs and scientific explanations composed by NASA astronomers.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-teal">
              <Radio size={15} />
              <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                Astrometric Classifier
              </span>
            </div>
            <p className="text-xs text-text-mid leading-relaxed">
              Lexical spectral analyzer that identifies celestial types (e.g. Eclipsing Binaries, Spiral Galaxies, Emission Nebulae) and estimates astronomical distances in light-years.
            </p>
          </div>
        </div>
      </div>

      {/* Specifications Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-surface border border-border rounded-xl space-y-1 text-left">
          <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider">Archive Span</span>
          <div className="text-lg font-semibold text-text font-serif italic">1995 — 2026+</div>
          <p className="text-[11px] text-text-mid">Over 11,000 cosmic transmissions cataloged.</p>
        </div>

        <div className="p-4 bg-surface border border-border rounded-xl space-y-1 text-left">
          <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider">Design Architecture</span>
          <div className="text-lg font-semibold text-accent font-serif italic">Deep Space Uplink</div>
          <p className="text-[11px] text-text-mid">Dual-theme high-contrast editorial typography.</p>
        </div>

        <div className="p-4 bg-surface border border-border rounded-xl space-y-1 text-left">
          <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider">Storage State</span>
          <div className="text-lg font-semibold text-teal font-serif italic">Client Vault</div>
          <p className="text-[11px] text-text-mid">Local L1/L2 tiered caching with offline memory map.</p>
        </div>
      </div>

      {/* Credits & Footer Banner */}
      <div className="scan-card text-center p-6 space-y-3">
        <Sparkles size={20} className="text-accent mx-auto" aria-hidden="true" />
        <h3 className="text-base font-serif italic text-text">
          Deep Space Uplink • Version 2.0
        </h3>
        <p className="text-xs text-text-mid max-w-md mx-auto">
          Crafted with React 19, TypeScript, and Tailwind CSS. Imagery courtesy of NASA, STScI, ESA, and contributing astrophotographers worldwide.
        </p>
      </div>
    </div>
  );
}
