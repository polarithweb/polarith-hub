import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Calendar,
  Ruler,
  Calculator,
  Sigma,
  RotateCcw,
} from 'lucide-react';
import {
  CURRENCY_RATES_USD_BASE,
  convertCurrency,
  calculateExactAge,
  calculatePixelsPerMm,
  evaluateScientificOperation,
} from '../utils/toolsLogic';

export type ToolKey = 'currency' | 'age' | 'ruler' | 'normal-calc' | 'scientific-calc';

interface ToolsHubViewProps {
  initialTab?: ToolKey;
}

export const ToolsHubView: React.FC<ToolsHubViewProps> = ({ initialTab = 'currency' }) => {
  const [activeTab, setActiveTab] = useState<ToolKey>(initialTab);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // 1. Currency Calculator State
  const [currencyAmount, setCurrencyAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('INR');

  const currencyResult = convertCurrency(
    parseFloat(currencyAmount) || 0,
    fromCurrency,
    toCurrency
  );

  // 2. Age Calculator State
  const [birthDate, setBirthDate] = useState<string>('2008-05-15');
  const [targetDate, setTargetDate] = useState<string>('2026-10-25');
  const ageResult = calculateExactAge(birthDate, targetDate);

  // 3. Digital Ruler State
  const [diagonalInches, setDiagonalInches] = useState<number>(15.6);
  const [caliperMm, setCaliperMm] = useState<number>(85);
  const screenWidth = typeof window !== 'undefined' ? window.screen.width || 1440 : 1440;
  const screenHeight = typeof window !== 'undefined' ? window.screen.height || 900 : 900;
  const pixelsPerMm = calculatePixelsPerMm(diagonalInches, screenWidth, screenHeight);
  const totalRulerMm = 150; // 15 cm ruler bar

  // 4. Normal Calculator State
  const [normDisplay, setNormDisplay] = useState<string>('0');
  const [normPrev, setNormPrev] = useState<number | null>(null);
  const [normOp, setNormOp] = useState<'+' | '-' | '×' | '÷' | null>(null);
  const [normResetNext, setNormResetNext] = useState<boolean>(false);
  const [normHistory, setNormHistory] = useState<string[]>([]);

  const handleNormDigit = (digit: string) => {
    if (normResetNext || normDisplay.startsWith('Error') || normDisplay === 'NaN' || normDisplay === 'Infinity') {
      setNormDisplay(digit === '.' ? '0.' : digit);
      setNormResetNext(false);
      return;
    }
    if (normDisplay.length >= 16) return;
    if (digit === '.' && normDisplay.includes('.')) return;
    setNormDisplay(normDisplay === '0' && digit !== '.' ? digit : normDisplay + digit);
  };

  const handleNormOperator = (nextOp: '+' | '-' | '×' | '÷') => {
    const rawVal = parseFloat(normDisplay);
    const currentVal = Number.isFinite(rawVal) ? rawVal : 0;
    if (normPrev === null || !Number.isFinite(normPrev)) {
      setNormPrev(currentVal);
    } else if (normOp && !normResetNext) {
      const computed = computeBasic(normPrev, currentVal, normOp);
      if (!Number.isFinite(computed)) {
        setNormDisplay('Error (Div by 0)');
        setNormPrev(null);
        setNormOp(null);
        setNormResetNext(true);
        return;
      }
      setNormPrev(computed);
      setNormDisplay(String(computed));
    }
    setNormOp(nextOp);
    setNormResetNext(true);
  };

  const computeBasic = (a: number, b: number, op: '+' | '-' | '×' | '÷'): number => {
    if (!Number.isFinite(a) || !Number.isFinite(b)) return NaN;
    switch (op) {
      case '+':
        return Number((a + b).toFixed(8));
      case '-':
        return Number((a - b).toFixed(8));
      case '×':
        return Number((a * b).toFixed(8));
      case '÷':
        return b === 0 ? NaN : Number((a / b).toFixed(8));
    }
  };

  const handleNormEquals = () => {
    if (normPrev === null || !normOp) return;
    const rawVal = parseFloat(normDisplay);
    const currentVal = Number.isFinite(rawVal) ? rawVal : 0;
    const result = computeBasic(normPrev, currentVal, normOp);
    const formatted = !Number.isFinite(result) ? 'Error (Div by 0)' : String(result);
    setNormHistory((prev) => [`${normPrev} ${normOp} ${currentVal} = ${formatted}`, ...prev.slice(0, 6)]);
    setNormDisplay(formatted);
    setNormPrev(null);
    setNormOp(null);
    setNormResetNext(true);
  };

  // 5. Scientific Calculator State
  const [sciDisplay, setSciDisplay] = useState<string>('30');
  const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('DEG');
  const [sciPrev, setSciPrev] = useState<number | null>(null);
  const [sciBinaryOp, setSciBinaryOp] = useState<'+' | '-' | '×' | '÷' | '^' | null>(null);
  const [sciResetNext, setSciResetNext] = useState<boolean>(false);
  const [sciLog, setSciLog] = useState<string>('Ready');

  const handleSciUnary = (
    fn: 'sin' | 'cos' | 'tan' | 'sqrt' | 'log' | 'ln' | 'inv' | 'sq' | 'fact'
  ) => {
    const rawVal = parseFloat(sciDisplay);
    const val = Number.isFinite(rawVal) ? rawVal : 0;
    const out = evaluateScientificOperation(fn, val, angleMode);
    const textOut = !Number.isFinite(out) ? 'Domain Error' : String(out);
    setSciLog(`${fn}${fn === 'sin' || fn === 'cos' || fn === 'tan' ? `_${angleMode}` : ''}(${val}) = ${textOut}`);
    setSciDisplay(textOut);
    setSciResetNext(true);
  };

  const handleSciDigit = (d: string) => {
    if (sciResetNext || sciDisplay.includes('Error') || sciDisplay === 'NaN' || sciDisplay === 'Infinity') {
      setSciDisplay(d === '.' ? '0.' : d);
      setSciResetNext(false);
      return;
    }
    if (sciDisplay.length >= 16) return;
    if (d === '.' && sciDisplay.includes('.')) return;
    setSciDisplay(sciDisplay === '0' && d !== '.' ? d : sciDisplay + d);
  };

  const handleSciBinary = (op: '+' | '-' | '×' | '÷' | '^') => {
    const rawVal = parseFloat(sciDisplay);
    setSciPrev(Number.isFinite(rawVal) ? rawVal : 0);
    setSciBinaryOp(op);
    setSciResetNext(true);
  };

  const handleSciEquals = () => {
    if (sciPrev === null || !sciBinaryOp) return;
    const rawB = parseFloat(sciDisplay);
    const b = Number.isFinite(rawB) ? rawB : 0;
    let res = 0;
    if (sciBinaryOp === '^') {
      const powVal = Math.pow(sciPrev, b);
      res = Number.isFinite(powVal) ? Number(powVal.toFixed(8)) : NaN;
    } else {
      res = computeBasic(sciPrev, b, sciBinaryOp);
    }
    const formatted = !Number.isFinite(res) ? 'Domain Error' : String(res);
    setSciLog(`${sciPrev} ${sciBinaryOp} ${b} = ${formatted}`);
    setSciDisplay(formatted);
    setSciPrev(null);
    setSciBinaryOp(null);
    setSciResetNext(true);
  };

  return (
    <div className="space-y-10">
      {/* Header & Centralized Tool Switcher */}
      <section className="frosted-panel rounded-2xl p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs text-indigo-700 font-medium mb-2">
            <span>Precision Utility Suite</span>
            <span aria-hidden="true">·</span>
            <span>5 Calibrated Instruments</span>
            <span aria-hidden="true">·</span>
            <span>Polarith Softwares</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-serif-display font-semibold text-slate-900 tracking-tight">
            Centralized Calculation & Measurement Workbench
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
            Switch seamlessly between the Currency Calculator, Exact Chronological Age Calculator, Screen-Calibrated Digital Ruler, Everyday Normal Calculator, and Trigonometric Scientific Calculator.
          </p>
        </div>

        {/* Interactive Filter Tabs (Functional Buttons) */}
        <div
          role="tablist"
          aria-label="Precision Tools Selection"
          className="mt-6 flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-xl border border-slate-200/70"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'currency'}
            onClick={() => setActiveTab('currency')}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'currency'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
            <span>Currency Calculator</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'age'}
            onClick={() => setActiveTab('age')}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'age'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Age Calculator</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ruler'}
            onClick={() => setActiveTab('ruler')}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'ruler'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ruler className="w-4 h-4 text-indigo-600" />
            <span>Digital Ruler</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'normal-calc'}
            onClick={() => setActiveTab('normal-calc')}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'normal-calc'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-4 h-4 text-indigo-600" />
            <span>Normal Calculator</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'scientific-calc'}
            onClick={() => setActiveTab('scientific-calc')}
            className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'scientific-calc'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sigma className="w-4 h-4 text-indigo-600" />
            <span>Scientific Calculator</span>
          </button>
        </div>
      </section>

      {/* Active Tool Workspace */}
      {activeTab === 'currency' && (
        <section className="frosted-panel rounded-2xl p-6 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-serif-display font-semibold text-slate-900">
                Global Currency Exchange Calculator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Instant cross-currency conversion with reference mid-market exchange rates.
              </p>
            </div>
            <span className="text-xs font-mono-tabular text-indigo-700">
              1 {fromCurrency} = {currencyResult.unitRate} {toCurrency}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-end">
            <div className="md:col-span-4">
              <label htmlFor="curr-amount" className="block text-xs font-medium text-slate-700 mb-1.5">
                Amount to Convert
              </label>
              <input
                id="curr-amount"
                type="number"
                min="0"
                step="any"
                value={currencyAmount}
                onChange={(e) => setCurrencyAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 font-mono-tabular text-base text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-3">
              <label htmlFor="curr-from" className="block text-xs font-medium text-slate-700 mb-1.5">
                From Currency
              </label>
              <select
                id="curr-from"
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                {Object.entries(CURRENCY_RATES_USD_BASE).map(([code, meta]) => (
                  <option key={code} value={code}>
                    {code} — {meta.name} ({meta.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1 flex justify-center">
              <button
                type="button"
                aria-label="Swap currencies"
                onClick={() => {
                  setFromCurrency(toCurrency);
                  setToCurrency(fromCurrency);
                }}
                className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            <div className="md:col-span-3">
              <label htmlFor="curr-to" className="block text-xs font-medium text-slate-700 mb-1.5">
                To Currency
              </label>
              <select
                id="curr-to"
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                {Object.entries(CURRENCY_RATES_USD_BASE).map(([code, meta]) => (
                  <option key={code} value={code}>
                    {code} — {meta.name} ({meta.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-white/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500">Converted Equivalent</p>
              <p className="text-3xl sm:text-4xl font-mono-tabular font-semibold text-slate-900 mt-1">
                <span className="font-sans mr-1.5">
                  {CURRENCY_RATES_USD_BASE[toCurrency]?.symbol}
                </span>
                {currencyResult.converted.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}{' '}
                <span className="text-lg font-sans font-normal text-slate-500">{toCurrency}</span>
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono-tabular space-y-1 sm:text-right">
              <p>
                Input:{' '}
                <span className="font-sans">
                  {CURRENCY_RATES_USD_BASE[fromCurrency]?.symbol}
                </span>{' '}
                {currencyAmount || '0'} {fromCurrency}
              </p>
              <p>Cross Factor: {currencyResult.unitRate}</p>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'age' && (
        <section className="frosted-panel rounded-2xl p-6 sm:p-8 space-y-8">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-serif-display font-semibold text-slate-900">
              Chronological Age & Milestone Calculator
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Computes exact calendar years, months, days, total elapsed hours, and days remaining until your next birthday.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="age-birth-date" className="block text-xs font-medium text-slate-700 mb-1.5">
                Date of Birth
              </label>
              <input
                id="age-birth-date"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 font-mono-tabular text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="age-ref-date" className="block text-xs font-medium text-slate-700 mb-1.5">
                Calculate Age As Of Date
              </label>
              <input
                id="age-ref-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 font-mono-tabular text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {!ageResult.isValid ? (
            <p className="text-sm text-red-600">
              Please ensure the Date of Birth is earlier than or equal to the Reference Date.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-white/90 border border-slate-200/80">
                <p className="text-xs text-slate-500">Exact Age</p>
                <p className="text-2xl font-mono-tabular font-semibold text-slate-900 mt-1">
                  {ageResult.years}y {ageResult.months}m {ageResult.days}d
                </p>
              </div>
              <div className="p-5 rounded-xl bg-white/90 border border-slate-200/80">
                <p className="text-xs text-slate-500">Total Days Lived</p>
                <p className="text-2xl font-mono-tabular font-semibold text-slate-900 mt-1">
                  {ageResult.totalDays.toLocaleString()}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-white/90 border border-slate-200/80">
                <p className="text-xs text-slate-500">Total Hours</p>
                <p className="text-2xl font-mono-tabular font-semibold text-slate-900 mt-1">
                  {ageResult.totalHours.toLocaleString()}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-white/90 border border-slate-200/80">
                <p className="text-xs text-slate-500">Next Birthday In</p>
                <p className="text-2xl font-mono-tabular font-semibold text-indigo-700 mt-1">
                  {ageResult.nextBirthdayDays} days
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'ruler' && (
        <section className="frosted-panel rounded-2xl p-6 sm:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-serif-display font-semibold text-slate-900">
                Screen-Calibrated Digital Ruler (CM & Inches)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Adjust your display diagonal size in inches for 1:1 physical millimeter accuracy, then slide the optical caliper.
              </p>
            </div>
            <div className="text-xs font-mono-tabular text-indigo-700">
              Density: {pixelsPerMm} px/mm
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                <label htmlFor="ruler-diag">Screen Diagonal Size (Inches)</label>
                <span className="font-mono-tabular text-indigo-700">{diagonalInches}"</span>
              </div>
              <input
                id="ruler-diag"
                type="range"
                min={6.0}
                max={32.0}
                step={0.1}
                value={diagonalInches}
                onChange={(e) => setDiagonalInches(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex gap-2 mt-2 text-[11px]">
                {[6.1, 13.3, 14.0, 15.6, 24.0, 27.0].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDiagonalInches(preset)}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 text-slate-700 font-mono-tabular cursor-pointer"
                  >
                    {preset}"
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                <label htmlFor="ruler-caliper">Measurement Caliper Position</label>
                <span className="font-mono-tabular font-semibold text-slate-900">
                  {caliperMm} mm ({(caliperMm / 10).toFixed(1)} cm / {(caliperMm / 25.4).toFixed(2)} in)
                </span>
              </div>
              <input
                id="ruler-caliper"
                type="range"
                min={1}
                max={totalRulerMm}
                value={caliperMm}
                onChange={(e) => setCaliperMm(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Visual Calibrated Ruler Surface */}
          <div className="overflow-x-auto pb-4">
            <div
              className="relative h-32 rounded-xl bg-white border border-slate-300 shadow-2xs select-none"
              style={{ width: `${Math.round(totalRulerMm * pixelsPerMm) + 40}px` }}
            >
              {/* Active Caliper Highlight */}
              <div
                className="absolute top-0 bottom-0 left-0 bg-indigo-500/15 border-r-2 border-indigo-600 transition-all duration-75"
                style={{ width: `${Math.round(caliperMm * pixelsPerMm)}px` }}
              />

              {/* Millimeter & Centimeter Ticks */}
              {Array.from({ length: totalRulerMm + 1 }).map((_, mm) => {
                const isCm = mm % 10 === 0;
                const isHalfCm = mm % 5 === 0 && !isCm;
                const leftPx = Math.round(mm * pixelsPerMm);
                return (
                  <div
                    key={mm}
                    className="absolute top-0"
                    style={{ left: `${leftPx}px` }}
                  >
                    <div
                      className={`bg-slate-800 ${
                        isCm ? 'h-8 w-[1.5px]' : isHalfCm ? 'h-5 w-px' : 'h-3 w-px opacity-60'
                      }`}
                    />
                    {isCm && (
                      <span className="absolute top-9 -translate-x-1/2 text-[11px] font-mono-tabular font-semibold text-slate-800">
                        {mm / 10}
                      </span>
                    )}
                  </div>
                );
              })}

              <div className="absolute bottom-3 left-4 text-[11px] font-mono-tabular text-slate-500">
                CENTIMETERS (TOP) · CALIBRATED AT {diagonalInches}" DISPLAY ({screenWidth}×{screenHeight})
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'normal-calc' && (
        <section className="frosted-panel rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif-display font-semibold text-slate-900">
                  Normal Calculator
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setNormDisplay('0');
                    setNormPrev(null);
                    setNormOp(null);
                    setNormResetNext(false);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 text-white text-right space-y-1">
                <div className="text-xs font-mono-tabular text-slate-400 h-4">
                  {normPrev !== null && normOp ? `${normPrev} ${normOp}` : ''}
                </div>
                <div
                  data-testid="normal-calc-display"
                  className="text-3xl font-mono-tabular font-semibold tracking-tight truncate"
                >
                  {normDisplay}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setNormDisplay('0');
                    setNormPrev(null);
                    setNormOp(null);
                  }}
                  className="py-3.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold text-sm cursor-pointer"
                >
                  AC
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setNormDisplay(String((parseFloat(normDisplay) || 0) * -1))
                  }
                  className="py-3.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold text-sm cursor-pointer"
                >
                  ±
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setNormDisplay(String((parseFloat(normDisplay) || 0) / 100))
                  }
                  className="py-3.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold text-sm cursor-pointer"
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => handleNormOperator('÷')}
                  className="py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm cursor-pointer"
                >
                  ÷
                </button>

                {['7', '8', '9'].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleNormDigit(n)}
                    className="py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-mono-tabular font-semibold text-base cursor-pointer"
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleNormOperator('×')}
                  className="py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm cursor-pointer"
                >
                  ×
                </button>

                {['4', '5', '6'].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleNormDigit(n)}
                    className="py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-mono-tabular font-semibold text-base cursor-pointer"
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleNormOperator('-')}
                  className="py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm cursor-pointer"
                >
                  −
                </button>

                {['1', '2', '3'].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleNormDigit(n)}
                    className="py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-mono-tabular font-semibold text-base cursor-pointer"
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleNormOperator('+')}
                  className="py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm cursor-pointer"
                >
                  +
                </button>

                <button
                  type="button"
                  onClick={() => handleNormDigit('0')}
                  className="col-span-2 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-mono-tabular font-semibold text-base cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleNormDigit('.')}
                  className="py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-mono-tabular font-semibold text-base cursor-pointer"
                >
                  .
                </button>
                <button
                  type="button"
                  onClick={handleNormEquals}
                  className="py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base cursor-pointer"
                >
                  =
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 p-6 rounded-2xl bg-white/85 border border-slate-200/80 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Calculation Tape History</h3>
              {normHistory.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Perform any arithmetic operation to record entries on the calculation tape.
                </p>
              ) : (
                <ul className="space-y-2 text-xs font-mono-tabular text-slate-700">
                  {normHistory.map((item, idx) => (
                    <li key={idx} className="py-1.5 border-b border-slate-100">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'scientific-calc' && (
        <section className="frosted-panel rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-serif-display font-semibold text-slate-900">
                Scientific & Trigonometric Calculator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Supports sine, cosine, tangent, logarithms, factorials, powers, and constants.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {(['DEG', 'RAD'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAngleMode(mode)}
                  className={`px-3 py-1 text-xs font-mono-tabular rounded-md transition-colors cursor-pointer ${
                    angleMode === mode
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 text-white text-right space-y-1">
            <div className="text-xs font-mono-tabular text-indigo-300">{sciLog}</div>
            <div
              data-testid="scientific-calc-display"
              className="text-3xl font-mono-tabular font-semibold tracking-tight truncate"
            >
              {sciDisplay}
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
            <button
              type="button"
              onClick={() => handleSciUnary('sin')}
              className="py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-mono-tabular text-xs font-semibold cursor-pointer"
            >
              sin
            </button>
            <button
              type="button"
              onClick={() => handleSciUnary('cos')}
              className="py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-mono-tabular text-xs font-semibold cursor-pointer"
            >
              cos
            </button>
            <button
              type="button"
              onClick={() => handleSciUnary('tan')}
              className="py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-mono-tabular text-xs font-semibold cursor-pointer"
            >
              tan
            </button>
            <button
              type="button"
              onClick={() => handleSciUnary('sqrt')}
              className="py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-mono-tabular text-xs font-semibold cursor-pointer"
            >
              √x
            </button>
            <button
              type="button"
              onClick={() => handleSciUnary('log')}
              className="py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-mono-tabular text-xs font-semibold cursor-pointer"
            >
              log₁₀
            </button>
            <button
              type="button"
              onClick={() => handleSciUnary('ln')}
              className="py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-mono-tabular text-xs font-semibold cursor-pointer"
            >
              ln
            </button>

            <button
              type="button"
              onClick={() => handleSciUnary('sq')}
              className="py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-mono-tabular text-xs font-semibold cursor-pointer"
            >
              x²
            </button>
            <button
              type="button"
              onClick={() => handleSciBinary('^')}
              className="py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-mono-tabular text-xs font-semibold cursor-pointer"
            >
              xʸ
            </button>
            <button
              type="button"
              onClick={() => handleSciUnary('fact')}
              className="py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-mono-tabular text-xs font-semibold cursor-pointer"
            >
              n!
            </button>
            <button
              type="button"
              onClick={() => handleSciUnary('inv')}
              className="py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-mono-tabular text-xs font-semibold cursor-pointer"
            >
              1/x
            </button>
            <button
              type="button"
              onClick={() => {
                setSciDisplay(String(Number(Math.PI.toFixed(8))));
                setSciResetNext(true);
              }}
              className="py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-mono-tabular text-xs font-semibold cursor-pointer"
            >
              π
            </button>
            <button
              type="button"
              onClick={() => {
                setSciDisplay(String(Number(Math.E.toFixed(8))));
                setSciResetNext(true);
              }}
              className="py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-mono-tabular text-xs font-semibold cursor-pointer"
            >
              e
            </button>

            {['7', '8', '9'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleSciDigit(d)}
                className="py-3 rounded-xl bg-white border border-slate-200 font-mono-tabular font-semibold text-sm cursor-pointer"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleSciBinary('+')}
              className="py-3 rounded-xl bg-slate-800 text-white font-mono-tabular text-sm cursor-pointer"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => handleSciBinary('-')}
              className="py-3 rounded-xl bg-slate-800 text-white font-mono-tabular text-sm cursor-pointer"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => {
                setSciDisplay('0');
                setSciPrev(null);
                setSciBinaryOp(null);
                setSciLog('Cleared');
              }}
              className="py-3 rounded-xl bg-red-50 text-red-700 font-semibold text-xs cursor-pointer"
            >
              AC
            </button>

            {['4', '5', '6'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleSciDigit(d)}
                className="py-3 rounded-xl bg-white border border-slate-200 font-mono-tabular font-semibold text-sm cursor-pointer"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleSciBinary('×')}
              className="py-3 rounded-xl bg-slate-800 text-white font-mono-tabular text-sm cursor-pointer"
            >
              ×
            </button>
            <button
              type="button"
              onClick={() => handleSciBinary('÷')}
              className="py-3 rounded-xl bg-slate-800 text-white font-mono-tabular text-sm cursor-pointer"
            >
              ÷
            </button>
            <button
              type="button"
              onClick={() => handleSciDigit('.')}
              className="py-3 rounded-xl bg-white border border-slate-200 font-mono-tabular font-semibold text-sm cursor-pointer"
            >
              .
            </button>

            {['1', '2', '3', '0'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleSciDigit(d)}
                className="py-3 rounded-xl bg-white border border-slate-200 font-mono-tabular font-semibold text-sm cursor-pointer"
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              onClick={handleSciEquals}
              className="col-span-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm cursor-pointer"
            >
              = Evaluate
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
