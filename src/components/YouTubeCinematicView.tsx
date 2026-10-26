import React, { useState } from 'react';
import { Sliders, RotateCcw, Play, Monitor, Code2 } from 'lucide-react';
import { extractYouTubeId, clampNumber } from '../utils/toolsLogic';

interface FilterState {
  brightness: number;
  contrast: number;
  saturate: number;
  sepia: number;
  hueRotate: number;
  blur: number;
  scale: number;
  aspectRatio: '16/9' | '21/9' | '4/3';
  ambilight: boolean;
  dimSurroundings: boolean;
}

const DEFAULT_FILTERS: FilterState = {
  brightness: 100,
  contrast: 102,
  saturate: 105,
  sepia: 0,
  hueRotate: 0,
  blur: 0,
  scale: 100,
  aspectRatio: '16/9',
  ambilight: true,
  dimSurroundings: false,
};

export const YouTubeCinematicView: React.FC<{
  onOpenInNoteTaker?: (url: string) => void;
}> = ({ onOpenInNoteTaker }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const handleLoadVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = extractYouTubeId(inputUrl);
    if (!parsed) {
      setUrlError(
        'Please paste a valid YouTube link (e.g. https://www.youtube.com/watch?v=...) or 11-character video ID.'
      );
      return;
    }
    setUrlError(null);
    setActiveVideoId(parsed);
  };

  const applyPreset = (preset: 'neutral' | 'kodak' | 'lecture' | 'noir') => {
    if (preset === 'neutral') {
      setFilters(DEFAULT_FILTERS);
    } else if (preset === 'kodak') {
      setFilters({
        ...filters,
        brightness: 104,
        contrast: 114,
        saturate: 118,
        sepia: 18,
        hueRotate: -4,
        blur: 0,
      });
    } else if (preset === 'lecture') {
      setFilters({
        ...filters,
        brightness: 108,
        contrast: 122,
        saturate: 90,
        sepia: 6,
        hueRotate: 0,
        blur: 0,
      });
    } else if (preset === 'noir') {
      setFilters({
        ...filters,
        brightness: 102,
        contrast: 128,
        saturate: 0,
        sepia: 8,
        hueRotate: 0,
        blur: 0,
      });
    }
  };

  const safeBrightness = clampNumber(filters.brightness, 50, 150, 100);
  const safeContrast = clampNumber(filters.contrast, 50, 160, 102);
  const safeSaturate = clampNumber(filters.saturate, 0, 200, 105);
  const safeSepia = clampNumber(filters.sepia, 0, 100, 0);
  const safeHue = clampNumber(filters.hueRotate, -180, 180, 0);
  const safeBlur = clampNumber(filters.blur, 0, 8, 0);
  const safeScale = clampNumber(filters.scale, 85, 120, 100);

  const cssFilterString = `brightness(${safeBrightness}%) contrast(${safeContrast}%) saturate(${safeSaturate}%) sepia(${safeSepia}%) hue-rotate(${safeHue}deg) blur(${safeBlur}px)`;

  return (
    <div className="space-y-12">
      {/* Header & URL Paste Bar */}
      <section className="frosted-panel rounded-2xl p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium mb-2">
            <span>Clean YouTube Videos Cinematic View</span>
            <span aria-hidden="true">·</span>
            <span>Optical Control Room</span>
            <span aria-hidden="true">·</span>
            <span>Polarith Softwares</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif-display font-semibold text-slate-900 tracking-tight text-balance">
            Distraction-Free YouTube Theater & Optical Grading Deck
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
            Paste any YouTube link below to watch without algorithmic sidebars or comment clutter. Fine-tune real-time optical parameters including luminance, contrast, color warmth, and aspect framing from the studio control room.
          </p>
        </div>

        <form onSubmit={handleLoadVideo} className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="cinematic-yt-url" className="sr-only">
              Paste YouTube Video Link
            </label>
            <input
              id="cinematic-yt-url"
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste desired YouTube video link here (e.g., https://www.youtube.com/watch?v=...)"
              className="w-full px-4 py-3 text-sm rounded-xl bg-white border border-slate-200/90 text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Load in Theater</span>
          </button>
          {onOpenInNoteTaker && inputUrl.trim() && (
            <button
              type="button"
              onClick={() => onOpenInNoteTaker(inputUrl)}
              className="px-4 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open in Note Taker
            </button>
          )}
        </form>

        {urlError && <p className="mt-2 text-xs text-red-600">{urlError}</p>}
      </section>

      {/* Main Theater Viewport + Full Control Room */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 8 Columns: Cinema Viewport */}
        <div
          className={`lg:col-span-8 rounded-2xl p-4 sm:p-6 transition-colors duration-300 ${
            filters.dimSurroundings
              ? 'bg-slate-950 text-slate-100 border border-slate-800'
              : 'frosted-panel'
          }`}
        >
          <div className="flex items-center justify-between mb-4 text-xs">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-500" />
              <span className="font-medium">
                {activeVideoId ? (
                  <>
                    Active Stream ID: <span className="font-mono-tabular">{activeVideoId}</span>
                  </>
                ) : (
                  'Theater Standby — Paste a YouTube link above to start'
                )}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.ambilight}
                  onChange={(e) => setFilters({ ...filters, ambilight: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Ambient Refraction</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.dimSurroundings}
                  onChange={(e) => setFilters({ ...filters, dimSurroundings: e.target.checked })}
                  className="rounded text-indigo-600"
                />
                <span>Dark Stage Frame</span>
              </label>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-slate-950 border border-slate-800/60">
            {filters.ambilight && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-6 opacity-40 blur-2xl bg-gradient-to-tr from-indigo-500 via-purple-400 to-sky-400"
              />
            )}
            <div
              className="relative w-full overflow-hidden transition-transform duration-200 flex items-center justify-center"
              style={{
                aspectRatio: filters.aspectRatio,
                filter: cssFilterString,
                transform: `scale(${safeScale / 100})`,
              }}
            >
              {activeVideoId ? (
                <iframe
                  title="Clean YouTube Cinematic Player"
                  src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?rel=0&modestbranding=1`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-8 space-y-2 text-slate-400">
                  <Play className="w-8 h-8 mx-auto text-indigo-400 opacity-80" />
                  <p className="text-sm font-medium text-slate-200">
                    No YouTube Video Loaded
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Paste your desired YouTube video URL in the box above and click "Load in Theater" to watch in distraction-free cinematic mode.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Preset Bar Under Player */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/60">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs opacity-75 mr-1">Optical Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset('neutral')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
              >
                Neutral Studio
              </button>
              <button
                type="button"
                onClick={() => applyPreset('kodak')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/70 transition-colors cursor-pointer"
              >
                35mm Warm Film
              </button>
              <button
                type="button"
                onClick={() => applyPreset('lecture')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/70 transition-colors cursor-pointer"
              >
                High-Clarity Board Lecture
              </button>
              <button
                type="button"
                onClick={() => applyPreset('noir')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              >
                Monochrome Archival
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-slate-700">
              {(['16/9', '21/9', '4/3'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setFilters({ ...filters, aspectRatio: ratio })}
                  className={`px-2.5 py-1 text-xs font-mono-tabular rounded-md transition-colors cursor-pointer ${
                    filters.aspectRatio === ratio
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Optical & Filter Control Room */}
        <div className="lg:col-span-4 frosted-panel rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-900">Video Filter Control Room</h2>
            </div>
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="slider-brightness">Brightness (Luminance)</label>
                <span className="font-mono-tabular text-indigo-700">{filters.brightness}%</span>
              </div>
              <input
                id="slider-brightness"
                type="range"
                min={50}
                max={150}
                value={filters.brightness}
                onChange={(e) => setFilters({ ...filters, brightness: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="slider-contrast">Contrast Ratio</label>
                <span className="font-mono-tabular text-indigo-700">{filters.contrast}%</span>
              </div>
              <input
                id="slider-contrast"
                type="range"
                min={50}
                max={160}
                value={filters.contrast}
                onChange={(e) => setFilters({ ...filters, contrast: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="slider-saturate">Color Saturation</label>
                <span className="font-mono-tabular text-indigo-700">{filters.saturate}%</span>
              </div>
              <input
                id="slider-saturate"
                type="range"
                min={0}
                max={200}
                value={filters.saturate}
                onChange={(e) => setFilters({ ...filters, saturate: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="slider-sepia">Eye-Care Warmth (Sepia)</label>
                <span className="font-mono-tabular text-indigo-700">{filters.sepia}%</span>
              </div>
              <input
                id="slider-sepia"
                type="range"
                min={0}
                max={100}
                value={filters.sepia}
                onChange={(e) => setFilters({ ...filters, sepia: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="slider-hue">Chromatic Hue Shift</label>
                <span className="font-mono-tabular text-indigo-700">{filters.hueRotate}°</span>
              </div>
              <input
                id="slider-hue"
                type="range"
                min={-180}
                max={180}
                value={filters.hueRotate}
                onChange={(e) => setFilters({ ...filters, hueRotate: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="slider-scale">Cinema Frame Zoom</label>
                <span className="font-mono-tabular text-indigo-700">{filters.scale}%</span>
              </div>
              <input
                id="slider-scale"
                type="range"
                min={85}
                max={120}
                value={filters.scale}
                onChange={(e) => setFilters({ ...filters, scale: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="slider-blur">Optical Softening (Blur)</label>
                <span className="font-mono-tabular text-indigo-700">{filters.blur}px</span>
              </div>
              <input
                id="slider-blur"
                type="range"
                min={0}
                max={8}
                step={0.5}
                value={filters.blur}
                onChange={(e) => setFilters({ ...filters, blur: Number(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/80 text-xs text-slate-500 leading-relaxed">
            <p className="font-mono-tabular text-[11px] text-slate-600 break-all">
              Filter CSS: {cssFilterString}
            </p>
          </div>
        </div>
      </section>

      {/* Dedicated Author & Polarith Softwares Description Section (Untouched) */}
      <section className="frosted-panel rounded-2xl p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-700">
              <span>Architect & Founder Profile</span>
              <span aria-hidden="true">·</span>
              <span>Polarith Softwares</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif-display font-semibold text-slate-900">
              Designed & Engineered by Priyam Kesh
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              Hello, I am <span className="font-semibold text-slate-900">Priyam Kesh</span> — a software developer currently in <span className="font-semibold text-slate-900">Class 12</span>, actively building production software systems, and the founder, CEO, and owner of <span className="font-semibold text-indigo-700">Polarith Softwares</span>.
            </p>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              While preparing for my Class 12 board curriculum, I noticed how frequently students, researchers, and everyday viewers get pulled into distracting recommendation loops when they simply want to study a single educational lecture or inspect a technical video. I built the <span className="font-medium text-slate-800">Clean YouTube Cinematic View</span> and the <span className="font-medium text-slate-800">Polarith Softwares</span> ecosystem to restore calm, intentionality, and precision control to web media consumption.
            </p>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              At <span className="font-medium text-slate-800">Polarith Softwares</span>, our engineering philosophy centers on lightweight static-first deployment, 100/100 Google PageSpeed optimization, zero-clutter visual minimalism, real-time cloud synchronization, and tactile utility tools that respect the user's attention.
            </p>
          </div>

          <div className="lg:col-span-4 rounded-xl bg-white/85 border border-slate-200/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Priyam Kesh</h3>
                <p className="text-xs text-slate-500">Founder & Owner, Polarith Softwares</p>
              </div>
              <Code2 className="w-5 h-5 text-indigo-600" />
            </div>
            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Role</dt>
                <dd className="font-medium text-slate-900">Software Developer & CEO</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Academic Stage</dt>
                <dd className="font-medium text-slate-900">Class 12 (Higher Secondary)</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <dt className="text-slate-500">Organization</dt>
                <dd className="font-medium text-indigo-700">Polarith Softwares</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-slate-500">Focus Areas</dt>
                <dd className="font-medium text-slate-900">PriAxom AI, Cleo AI & WebGL</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
};
