"use client";

import React, { useState } from 'react';
import { Volume2, VolumeX, Play, Pause, Music, Sun, Sunset, Moon, Sparkles, RotateCcw, X, Check, Eye, BookOpen } from 'lucide-react';
import { useAmbient, AmbientTrack } from '../../contexts/AmbientContext';

export function AmbientPanel() {
  const [isOpen, setIsOpen] = useState(false);

  const {
    isPlaying,
    currentTrack,
    volume,
    autoAmbient,
    autoTheme,
    timeTheme,
    microAnimationsEnabled,
    galleryMode,
    readingMode,
    toggleAmbient,
    playTrack,
    setTrack,
    setVolume,
    setAutoAmbient,
    setAutoTheme,
    setMicroAnimationsEnabled,
    setGalleryMode,
    setReadingMode,
    resetToDefaults,
  } = useAmbient();

  const tracks: Array<{ id: AmbientTrack; label: string; icon: string; desc: string }> = [
    {
      id: 'heritage',
      label: 'Heritage Gallery',
      icon: '🏛️',
      desc: 'Gentle sitar resonance and warm gallery acoustic tuning',
    },
    {
      id: 'riverbank',
      label: 'Riverbank',
      icon: '🌊',
      desc: 'Soft flowing water stream with bamboo flute notes',
    },
    {
      id: 'sunrise',
      label: 'Sunrise Over Stone',
      icon: '🌅',
      desc: 'Peaceful tanpura acoustic drone and morning warmth',
    },
  ];

  const getTimeThemeIcon = () => {
    switch (timeTheme) {
      case 'morning':
        return <Sun size={16} className="text-amber-500" />;
      case 'afternoon':
        return <Sun size={16} className="text-yellow-600" />;
      case 'evening':
        return <Sunset size={16} className="text-orange-500" />;
      case 'night':
        return <Moon size={16} className="text-indigo-400" />;
    }
  };

  return (
    <>
      {/* Floating Ambient Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2">
        {isPlaying && (
          <button
            onClick={toggleAmbient}
            className="p-2.5 sm:p-3 bg-[#6B1E2E] text-white rounded-full shadow-lg hover:bg-[#8B263E] transition-all flex items-center justify-center animate-pulse"
            title="Pause Ambient Music"
            aria-label="Pause Ambient Music"
          >
            <Pause size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        )}

        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-full shadow-xl border border-[#D4AF37]/40 text-xs font-medium transition-all ${
            isPlaying
              ? 'bg-[#2C1810] text-[#F5E6D3] ring-2 ring-[#D4AF37]/50'
              : 'bg-white text-[#2C1810] hover:bg-[#FFFDF7]'
          }`}
          aria-label="Open Ambient Experience Settings"
        >
          <Music size={16} className={isPlaying ? 'text-[#D4AF37] animate-spin duration-[6000ms]' : 'text-[#6B1E2E]'} />
          <span className="hidden sm:inline">
            {isPlaying ? `Playing: ${tracks.find((t) => t.id === currentTrack)?.label}` : 'Ambient Gallery'}
          </span>
        </button>
      </div>

      {/* Ambient Experience Panel Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in">
          <div
            className="w-full max-w-md bg-[#FFFDF7] text-[#2C1810] h-full shadow-2xl flex flex-col border-l border-[#E5D3B3] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Ambient Experience Settings"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#E5D3B3] flex items-center justify-between bg-[#F8F3EA]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#6B1E2E] text-white rounded-lg">
                  <Music size={20} />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#2C1810]">Ambient Experience</h2>
                  <p className="text-xs text-[#6B1E2E]/80">Immersive Indian Heritage Soundscape</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-[#2C1810]/60 hover:text-[#2C1810] rounded-full hover:bg-black/5"
                aria-label="Close Settings Panel"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 flex-1">
              {/* Main Play/Pause Control */}
              <div className="p-4 rounded-xl bg-[#F5E6D3]/40 border border-[#D4AF37]/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#6B1E2E]">Audio Status</div>
                  <div className="text-sm font-medium text-[#2C1810]">
                    {isPlaying ? 'Ambience Active' : 'Ambience Silent'}
                  </div>
                </div>
                <button
                  onClick={toggleAmbient}
                  className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                    isPlaying
                      ? 'bg-[#6B1E2E] text-white hover:bg-[#8B263E]'
                      : 'bg-[#2C1810] text-[#F5E6D3] hover:bg-[#422518]'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause size={14} /> Pause Audio
                    </>
                  ) : (
                    <>
                      <Play size={14} /> Enable Ambience
                    </>
                  )}
                </button>
              </div>

              {/* Soundscapes Track Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#2C1810]/70 mb-3 block">
                  Select Heritage Soundscape
                </label>
                <div className="space-y-2.5">
                  {tracks.map((track) => {
                    const isSelected = currentTrack === track.id;
                    return (
                      <button
                        key={track.id}
                        onClick={() => {
                          setTrack(track.id, true);
                          if (!isPlaying) playTrack(track.id);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between ${
                          isSelected
                            ? 'bg-white border-[#6B1E2E] shadow-sm ring-1 ring-[#6B1E2E]/20'
                            : 'bg-[#F8F3EA]/60 border-[#E5D3B3] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xl">{track.icon}</span>
                          <div>
                            <div className="text-sm font-bold text-[#2C1810] flex items-center gap-2">
                              {track.label}
                              {isSelected && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6B1E2E]/10 text-[#6B1E2E] font-medium">Active</span>}
                            </div>
                            <div className="text-xs text-[#2C1810]/60 mt-0.5">{track.desc}</div>
                          </div>
                        </div>
                        {isSelected && <Check size={16} className="text-[#6B1E2E] shrink-0 mt-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Volume Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#2C1810]/70 flex items-center gap-1.5">
                    {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />} Volume
                  </label>
                  <span className="text-xs font-medium text-[#6B1E2E]">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-[#6B1E2E] cursor-pointer"
                />
              </div>

              {/* Toggles Section */}
              <div className="pt-4 border-t border-[#E5D3B3] space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2C1810]/70">
                  Smart Preferences
                </div>

                {/* Auto Ambient Music */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#2C1810]">Smart Page Soundscapes</div>
                    <div className="text-xs text-[#2C1810]/60">Auto-switch track based on page section</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoAmbient}
                    onChange={(e) => setAutoAmbient(e.target.checked)}
                    className="w-4 h-4 accent-[#6B1E2E] rounded cursor-pointer"
                  />
                </div>

                {/* Time-Based Theme */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#2C1810] flex items-center gap-1.5">
                      Auto Time Palette {getTimeThemeIcon()}
                    </div>
                    <div className="text-xs text-[#2C1810]/60">Current: {timeTheme} lighting</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoTheme}
                    onChange={(e) => setAutoTheme(e.target.checked)}
                    className="w-4 h-4 accent-[#6B1E2E] rounded cursor-pointer"
                  />
                </div>

                {/* Micro Animations */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#2C1810] flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#D4AF37]" /> Micro-Animations
                    </div>
                    <div className="text-xs text-[#2C1810]/60">Subtle floating dust and ambient light rays</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={microAnimationsEnabled}
                    onChange={(e) => setMicroAnimationsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#6B1E2E] rounded cursor-pointer"
                  />
                </div>

                {/* Gallery Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#2C1810] flex items-center gap-1.5">
                      <Eye size={14} className="text-[#6B1E2E]" /> Gallery Mode
                    </div>
                    <div className="text-xs text-[#2C1810]/60">Focused distraction-free artwork view</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={galleryMode}
                    onChange={(e) => setGalleryMode(e.target.checked)}
                    className="w-4 h-4 accent-[#6B1E2E] rounded cursor-pointer"
                  />
                </div>

                {/* Reading Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#2C1810] flex items-center gap-1.5">
                      <BookOpen size={14} className="text-[#6B1E2E]" /> Reading Mode
                    </div>
                    <div className="text-xs text-[#2C1810]/60">Optimized typography for story reading</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={readingMode}
                    onChange={(e) => setReadingMode(e.target.checked)}
                    className="w-4 h-4 accent-[#6B1E2E] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#E5D3B3] bg-[#F8F3EA] flex items-center justify-between">
              <button
                onClick={resetToDefaults}
                className="text-xs text-[#6B1E2E] hover:underline flex items-center gap-1 font-medium"
              >
                <RotateCcw size={12} /> Reset to Defaults
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-[#2C1810] text-[#FFFDF7] rounded-lg text-xs font-semibold hover:bg-[#422518]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
