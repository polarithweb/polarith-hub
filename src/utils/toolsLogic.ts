export type AppRoute =
  | 'dashboard'
  | 'vlogs'
  | 'ai-news'
  | 'wb-board'
  | 'cinema-machine'
  | 'motor-news'
  | 'national-news'
  | 'youtube-cinematic'
  | 'youtube-notes'
  | 'tools'
  | 'currency-calculator'
  | 'age-calculator'
  | 'digital-ruler'
  | 'normal-calculator'
  | 'scientific-calculator'
  | 'about'
  | 'privacy'
  | 'terms'
  | 'admin';

export interface ParsedRoute {
  route: AppRoute;
  toolTab?: 'currency' | 'age' | 'ruler' | 'normal-calc' | 'scientific-calc';
}

export function parseHashRoute(hash: string): ParsedRoute {
  const cleaned = hash.replace(/^#\/?/, '').trim().toLowerCase();
  if (!cleaned || cleaned === 'dashboard' || cleaned === 'home') {
    return { route: 'dashboard' };
  }
  if (cleaned === 'admin') {
    return { route: 'admin' };
  }
  if (cleaned === 'currency-calculator' || cleaned === 'tools/currency') {
    return { route: 'currency-calculator', toolTab: 'currency' };
  }
  if (cleaned === 'age-calculator' || cleaned === 'tools/age') {
    return { route: 'age-calculator', toolTab: 'age' };
  }
  if (cleaned === 'digital-ruler' || cleaned === 'tools/ruler') {
    return { route: 'digital-ruler', toolTab: 'ruler' };
  }
  if (cleaned === 'normal-calculator' || cleaned === 'tools/normal-calc') {
    return { route: 'normal-calculator', toolTab: 'normal-calc' };
  }
  if (cleaned === 'scientific-calculator' || cleaned === 'tools/scientific-calc') {
    return { route: 'scientific-calculator', toolTab: 'scientific-calc' };
  }

  const validRoutes: AppRoute[] = [
    'vlogs',
    'ai-news',
    'wb-board',
    'cinema-machine',
    'motor-news',
    'national-news',
    'youtube-cinematic',
    'youtube-notes',
    'tools',
    'about',
    'privacy',
    'terms',
  ];

  if (validRoutes.includes(cleaned as AppRoute)) {
    return { route: cleaned as AppRoute };
  }

  return { route: 'dashboard' };
}

export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const vParam = url.searchParams.get('v');
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
        return vParam;
      }
      const segments = url.pathname.split('/').filter(Boolean);
      if (
        segments.length >= 2 &&
        (segments[0] === 'embed' || segments[0] === 'shorts' || segments[0] === 'live' || segments[0] === 'v')
      ) {
        const candidate = segments[1];
        return /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : null;
      }
    }
  } catch {
    const match = trimmed.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) return match[1];
  }

  return null;
}

export const CURRENCY_RATES_USD_BASE: Record<string, { name: string; symbol: string; rate: number }> = {
  INR: { name: 'Indian Rupee', symbol: '₹', rate: 84.15 },
  USD: { name: 'US Dollar', symbol: '$', rate: 1.0 },
  EUR: { name: 'Euro', symbol: '€', rate: 0.92 },
  GBP: { name: 'British Pound', symbol: '£', rate: 0.78 },
  JPY: { name: 'Japanese Yen', symbol: '¥', rate: 153.4 },
  AUD: { name: 'Australian Dollar', symbol: 'A$', rate: 1.52 },
  CAD: { name: 'Canadian Dollar', symbol: 'C$', rate: 1.39 },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', rate: 1.33 },
  AED: { name: 'UAE Dirham', symbol: 'د.إ', rate: 3.6725 },
  CHF: { name: 'Swiss Franc', symbol: 'CHF', rate: 0.87 },
};

export function convertCurrency(
  amount: number,
  fromCode: string,
  toCode: string,
  customRates: Record<string, { name: string; symbol: string; rate: number }> = CURRENCY_RATES_USD_BASE
): { converted: number; unitRate: number } {
  if (!Number.isFinite(amount) || amount < 0) {
    return { converted: 0, unitRate: 0 };
  }
  const fromEntry = customRates[fromCode];
  const toEntry = customRates[toCode];
  if (!fromEntry || !toEntry || fromEntry.rate <= 0) {
    return { converted: 0, unitRate: 0 };
  }
  const unitRate = toEntry.rate / fromEntry.rate;
  const converted = amount * unitRate;
  return {
    converted: Number(converted.toFixed(4)),
    unitRate: Number(unitRate.toFixed(6)),
  };
}

export interface AgeBreakdown {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  totalHours: number;
  nextBirthdayDays: number;
  isValid: boolean;
}

export function calculateExactAge(birthDateStr: string, referenceDateStr: string): AgeBreakdown {
  const birth = new Date(`${birthDateStr}T00:00:00Z`);
  const ref = new Date(`${referenceDateStr}T00:00:00Z`);

  if (Number.isNaN(birth.getTime()) || Number.isNaN(ref.getTime()) || birth > ref) {
    return {
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      totalWeeks: 0,
      totalHours: 0,
      nextBirthdayDays: 0,
      isValid: false,
    };
  }

  let years = ref.getUTCFullYear() - birth.getUTCFullYear();
  let months = ref.getUTCMonth() - birth.getUTCMonth();
  let days = ref.getUTCDate() - birth.getUTCDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 0));
    days += prevMonth.getUTCDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const diffMs = ref.getTime() - birth.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(totalDays / 7);
  const totalHours = totalDays * 24;

  let nextBday = new Date(Date.UTC(ref.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate()));
  if (nextBday < ref) {
    nextBday = new Date(Date.UTC(ref.getUTCFullYear() + 1, birth.getUTCMonth(), birth.getUTCDate()));
  }
  const nextBirthdayDays = Math.round((nextBday.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));

  return {
    years,
    months,
    days,
    totalDays,
    totalWeeks,
    totalHours,
    nextBirthdayDays,
    isValid: true,
  };
}

export function calculatePixelsPerMm(
  diagonalInches: number,
  screenWidthPx: number,
  screenHeightPx: number
): number {
  if (diagonalInches <= 0 || screenWidthPx <= 0 || screenHeightPx <= 0) {
    return 3.7795;
  }
  const diagonalPx = Math.hypot(screenWidthPx, screenHeightPx);
  const ppi = diagonalPx / diagonalInches;
  const ppmm = ppi / 25.4;
  return Number(ppmm.toFixed(4));
}

export function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) return NaN;
  if (n > 170) return Infinity;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

export function evaluateScientificOperation(
  op: 'sin' | 'cos' | 'tan' | 'sqrt' | 'log' | 'ln' | 'inv' | 'sq' | 'fact',
  value: number,
  angleMode: 'DEG' | 'RAD' = 'DEG'
): number {
  const rad = angleMode === 'DEG' ? (value * Math.PI) / 180 : value;
  switch (op) {
    case 'sin':
      return Number(Math.sin(rad).toFixed(10));
    case 'cos':
      return Number(Math.cos(rad).toFixed(10));
    case 'tan':
      return Number(Math.tan(rad).toFixed(10));
    case 'sqrt':
      return value < 0 ? NaN : Number(Math.sqrt(value).toFixed(10));
    case 'log':
      return value <= 0 ? NaN : Number(Math.log10(value).toFixed(10));
    case 'ln':
      return value <= 0 ? NaN : Number(Math.log(value).toFixed(10));
    case 'inv':
      return value === 0 ? NaN : Number((1 / value).toFixed(10));
    case 'sq':
      return Number((value * value).toFixed(10));
    case 'fact':
      return factorial(value);
  }
}
