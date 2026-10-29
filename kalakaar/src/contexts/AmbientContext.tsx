"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { AMBIENT_TRACKS } from '../config/assets';

export type AmbientTrack = 'heritage' | 'riverbank' | 'sunrise';
export type TimeTheme = 'morning' | 'afternoon' | 'evening' | 'night';

export interface AmbientPreferences {
  ambientEnabled: boolean;
  currentTrack: AmbientTrack;
  volume: number; // 0 to 1
  loop: boolean;
  autoAmbient: boolean;
  autoTheme: boolean;
  microAnimationsEnabled: boolean;
}

interface AmbientContextType extends AmbientPreferences {
  isPlaying: boolean;
  timeTheme: TimeTheme;
  manualTrackOverride: boolean;
  galleryMode: boolean;
  readingMode: boolean;
  
  // Actions
  toggleAmbient: () => void;
  playTrack: (track?: AmbientTrack) => void;
  pauseTrack: () => void;
  setTrack: (track: AmbientTrack, isManual?: boolean) => void;
  setVolume: (volume: number) => void;
  setLoop: (loop: boolean) => void;
  setAutoAmbient: (enabled: boolean) => void;
  setAutoTheme: (enabled: boolean) => void;
  setMicroAnimationsEnabled: (enabled: boolean) => void;
  setGalleryMode: (enabled: boolean) => void;
  setReadingMode: (enabled: boolean) => void;
  resetToDefaults: () => void;
}

const STORAGE_KEY = 'kalakaar_ambient_preferences';

const DEFAULT_PREFERENCES: AmbientPreferences = {
  ambientEnabled: false,
  currentTrack: 'heritage',
  volume: 0.5,
  loop: true,
  autoAmbient: true,
  autoTheme: true,
  microAnimationsEnabled: true,
};

const AmbientContext = createContext<AmbientContextType | undefined>(undefined);

// Web Audio Ambient Synthesizer Engine
class WebAudioAmbientEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeSourceNodes: Array<{ stop: () => void }> = [];
  private currentTrack: AmbientTrack | null = null;
  private volume: number = 0.5;

  private initCtx() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.audioCtx.currentTime + 0.1);
    }
  }

  public async play(track: AmbientTrack) {
    this.initCtx();
    if (!this.audioCtx || !this.masterGain) return;

    if (this.currentTrack === track && this.activeSourceNodes.length > 0) {
      return;
    }

    this.stopCurrentNodes(0.5);
    this.currentTrack = track;

    if (track === 'heritage') {
      this.startHeritageTrack();
    } else if (track === 'riverbank') {
      this.startRiverbankTrack();
    } else if (track === 'sunrise') {
      this.startSunriseTrack();
    }
  }

  public stop(fadeSeconds = 0.5) {
    this.stopCurrentNodes(fadeSeconds);
    this.currentTrack = null;
  }

  private stopCurrentNodes(fadeSeconds: number) {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const nodes = [...this.activeSourceNodes];
    this.activeSourceNodes = [];

    nodes.forEach((node) => {
      try {
        if ('gain' in node && (node as any).gain instanceof GainNode) {
          ((node as any).gain as GainNode).gain.linearRampToValueAtTime(0.0001, now + fadeSeconds);
        }
        setTimeout(() => {
          node.stop();
        }, fadeSeconds * 1000 + 50);
      } catch {
        // ignore
      }
    });
  }

  // Heritage Gallery: Warm Indian ambient drone in C/G tuning with soft harmonics
  private startHeritageTrack() {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const trackGain = ctx.createGain();
    trackGain.gain.setValueAtTime(0.001, now);
    trackGain.gain.linearRampToValueAtTime(0.25, now + 1.0);
    trackGain.connect(this.masterGain);

    // Root C3 (130.81 Hz), G3 (196.00 Hz), C4 (261.63 Hz)
    const freqs = [130.81, 196.00, 261.63, 392.00];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.1 + idx * 0.05, now);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(1.5, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.12 / freqs.length, now);

      osc.connect(oscGain);
      oscGain.connect(trackGain);

      osc.start(now);
      lfo.start(now);

      this.activeSourceNodes.push({
        stop: () => {
          try {
            osc.stop();
            lfo.stop();
          } catch {}
        },
        gain: oscGain,
      } as any);
    });
  }

  // Riverbank: Soft flowing water stream & bamboo flute resonance
  private startRiverbankTrack() {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const trackGain = ctx.createGain();
    trackGain.gain.setValueAtTime(0.001, now);
    trackGain.gain.linearRampToValueAtTime(0.2, now + 1.0);
    trackGain.connect(this.masterGain);

    // Buffer noise for gentle water stream
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to sound like soft water
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.Q.setValueAtTime(1.5, now);

    const filterLfo = ctx.createOscillator();
    filterLfo.frequency.setValueAtTime(0.2, now);
    const filterLfoGain = ctx.createGain();
    filterLfoGain.gain.setValueAtTime(150, now);
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(filter.frequency);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(trackGain);

    whiteNoise.start(now);
    filterLfo.start(now);

    // Gentle flute hum
    const fluteOsc = ctx.createOscillator();
    fluteOsc.type = 'sine';
    fluteOsc.frequency.setValueAtTime(329.63, now); // E4
    const fluteGain = ctx.createGain();
    fluteGain.gain.setValueAtTime(0.03, now);

    fluteOsc.connect(fluteGain);
    fluteGain.connect(trackGain);
    fluteOsc.start(now);

    this.activeSourceNodes.push({
      stop: () => {
        try {
          whiteNoise.stop();
          filterLfo.stop();
          fluteOsc.stop();
        } catch {}
      },
      gain: trackGain,
    } as any);
  }

  // Sunrise Over Stone: Tanpura acoustic resonance
  private startSunriseTrack() {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const trackGain = ctx.createGain();
    trackGain.gain.setValueAtTime(0.001, now);
    trackGain.gain.linearRampToValueAtTime(0.22, now + 1.0);
    trackGain.connect(this.masterGain);

    // D3 (146.83 Hz), A3 (220.00 Hz), D4 (293.66 Hz)
    const notes = [146.83, 220.00, 293.66, 440.00];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.05, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(trackGain);

      osc.start(now);

      this.activeSourceNodes.push({
        stop: () => {
          try {
            osc.stop();
          } catch {}
        },
        gain: gain,
      } as any);
    });
  }
}

class HybridAmbientEngine {
  private audioEl: HTMLAudioElement | null = null;
  private webAudioEngine: WebAudioAmbientEngine = new WebAudioAmbientEngine();
  private volume: number = 0.5;

  public setVolume(vol: number) {
    this.volume = vol;
    if (this.audioEl) {
      this.audioEl.volume = vol;
    }
    this.webAudioEngine.setVolume(vol);
  }

  public async play(track: AmbientTrack) {
    const trackConfig = AMBIENT_TRACKS.find(t => t.id === track);
    const audioPath = trackConfig?.file;
    if (audioPath && typeof window !== 'undefined') {
      try {
        if (!this.audioEl) {
          this.audioEl = new Audio();
          this.audioEl.loop = true;
        }
        this.audioEl.src = audioPath;
        this.audioEl.volume = this.volume;
        await this.audioEl.play();
        this.webAudioEngine.stop(0.3);
        return;
      } catch {
        // Fall back to WebAudio synthesiser if HTML audio play fails
      }
    }
    if (this.audioEl) {
      this.audioEl.pause();
    }
    this.webAudioEngine.play(track);
  }

  public stop(fadeOutDuration: number = 0.5) {
    if (this.audioEl) {
      this.audioEl.pause();
    }
    this.webAudioEngine.stop(fadeOutDuration);
  }
}

const audioEngine = new HybridAmbientEngine();

export function AmbientProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [prefs, setPrefs] = useState<AmbientPreferences>(DEFAULT_PREFERENCES);
  const [isPlaying, setIsPlaying] = useState(false);
  const [manualTrackOverride, setManualTrackOverride] = useState(false);
  const [galleryMode, setGalleryMode] = useState(false);
  const [readingMode, setReadingMode] = useState(false);

  // Time theme calculator
  const calculateTimeTheme = (): TimeTheme => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 19) return 'evening';
    return 'night';
  };

  const [timeTheme, setTimeTheme] = useState<TimeTheme>(calculateTimeTheme);

  // Update time theme every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTheme(calculateTimeTheme());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load saved preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPrefs((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist preferences
  const savePreferences = useCallback((updated: AmbientPreferences) => {
    setPrefs(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, []);

  // Sync volume with audio engine
  useEffect(() => {
    audioEngine.setVolume(prefs.volume);
  }, [prefs.volume]);

  // Handle Play/Pause & Track change
  const playTrack = useCallback((track?: AmbientTrack) => {
    const targetTrack = track || prefs.currentTrack;
    audioEngine.play(targetTrack);
    setIsPlaying(true);
    savePreferences({ ...prefs, ambientEnabled: true, currentTrack: targetTrack });
  }, [prefs, savePreferences]);

  const pauseTrack = useCallback(() => {
    audioEngine.stop(0.5);
    setIsPlaying(false);
    savePreferences({ ...prefs, ambientEnabled: false });
  }, [prefs, savePreferences]);

  const toggleAmbient = useCallback(() => {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack(prefs.currentTrack);
    }
  }, [isPlaying, pauseTrack, playTrack, prefs.currentTrack]);

  const setTrack = useCallback((track: AmbientTrack, isManual = true) => {
    if (isManual) {
      setManualTrackOverride(true);
    }
    setPrefs((prev) => {
      const next = { ...prev, currentTrack: track };
      savePreferences(next);
      return next;
    });
    if (isPlaying) {
      audioEngine.play(track);
    }
  }, [isPlaying, savePreferences]);

  const setVolume = useCallback((volume: number) => {
    setPrefs((prev) => {
      const next = { ...prev, volume };
      savePreferences(next);
      return next;
    });
  }, [savePreferences]);

  const setLoop = useCallback((loop: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, loop };
      savePreferences(next);
      return next;
    });
  }, [savePreferences]);

  const setAutoAmbient = useCallback((autoAmbient: boolean) => {
    if (autoAmbient) {
      setManualTrackOverride(false);
    }
    setPrefs((prev) => {
      const next = { ...prev, autoAmbient };
      savePreferences(next);
      return next;
    });
  }, [savePreferences]);

  const setAutoTheme = useCallback((autoTheme: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, autoTheme };
      savePreferences(next);
      return next;
    });
  }, [savePreferences]);

  const setMicroAnimationsEnabled = useCallback((microAnimationsEnabled: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, microAnimationsEnabled };
      savePreferences(next);
      return next;
    });
  }, [savePreferences]);

  const resetToDefaults = useCallback(() => {
    audioEngine.stop(0.3);
    setIsPlaying(false);
    setManualTrackOverride(false);
    setGalleryMode(false);
    setReadingMode(false);
    savePreferences(DEFAULT_PREFERENCES);
  }, [savePreferences]);

  // Smart Page-Based Music
  useEffect(() => {
    if (!prefs.autoAmbient || !prefs.ambientEnabled || manualTrackOverride || !isPlaying) {
      return;
    }

    let targetTrack: AmbientTrack = 'heritage';
    if (pathname.includes('/stories') || pathname.includes('/story')) {
      targetTrack = 'riverbank';
    } else if (pathname.includes('/artworks') || pathname.includes('/artwork') || pathname.includes('/art/')) {
      targetTrack = 'sunrise';
    } else if (pathname === '/' || pathname === '') {
      targetTrack = 'heritage';
    }

    if (targetTrack !== prefs.currentTrack) {
      setTrack(targetTrack, false);
    }
  }, [pathname, prefs.autoAmbient, prefs.ambientEnabled, manualTrackOverride, isPlaying, prefs.currentTrack, setTrack]);

  const value = useMemo(() => ({
    ...prefs,
    isPlaying,
    timeTheme,
    manualTrackOverride,
    galleryMode,
    readingMode,
    toggleAmbient,
    playTrack,
    pauseTrack,
    setTrack,
    setVolume,
    setLoop,
    setAutoAmbient,
    setAutoTheme,
    setMicroAnimationsEnabled,
    setGalleryMode,
    setReadingMode,
    resetToDefaults,
  }), [
    prefs,
    isPlaying,
    timeTheme,
    manualTrackOverride,
    galleryMode,
    readingMode,
    toggleAmbient,
    playTrack,
    pauseTrack,
    setTrack,
    setVolume,
    setLoop,
    setAutoAmbient,
    setAutoTheme,
    setMicroAnimationsEnabled,
    setGalleryMode,
    setReadingMode,
    resetToDefaults,
  ]);

  return (
    <AmbientContext.Provider value={value}>
      {children}
    </AmbientContext.Provider>
  );
}

export function useAmbient() {
  const context = useContext(AmbientContext);
  if (!context) {
    throw new Error('useAmbient must be used within an AmbientProvider');
  }
  return context;
}
