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
  if (typeof hash !== 'string') {
    return { route: 'dashboard' };
  }
  const cleaned = hash
    .replace(/^#\/?/, '')
    .split('?')[0]
    .replace(/\/+$/, '')
    .trim()
    .toLowerCase();

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

/**
 * Generates a collision-resistant, Firestore-rule-compliant ID (`^[a-zA-Z0-9_-]{1,128}$`).
 */
export function generateSecureId(prefix: string): string {
  const safePrefix = (prefix || 'id').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'id';
  const timestamp = Date.now().toString(36);
  let randomPart = '';

  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    const bytes = new Uint8Array(8);
    globalThis.crypto.getRandomValues(bytes);
    randomPart = Array.from(bytes, (b) => b.toString(36).padStart(2, '0'))
      .join('')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 12);
  } else {
    randomPart = Math.random().toString(36).slice(2, 12);
  }

  return `${safePrefix}_${timestamp}_${randomPart}`.slice(0, 96);
}

/**
 * Sanitizes external links (e.g. Cinema Machine movie links) to strictly allow HTTP/HTTPS protocols.
 * Blocks `javascript:`, `data:`, `vbscript:`, `file:`, and malformed URLs.
 */
export function sanitizeSafeExternalUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 1000) return '';

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return '';
    }
    return parsed.toString().slice(0, 1000);
  } catch {
    return '';
  }
}

/**
 * Sanitizes image URLs to strictly allow `https:`, `http:`, or safe `data:image/...` URIs within Firestore size bounds.
 */
export function sanitizeSafeImageUrl(rawUrl: unknown, fallbackUrl = ''): string {
  if (typeof rawUrl !== 'string') return fallbackUrl;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length > 350000) return fallbackUrl;

  if (/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);(base64,[a-zA-Z0-9+/=]+|utf8,.*)$/i.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString().slice(0, 2048);
    }
  } catch {
    // fall through to fallback
  }

  return fallbackUrl;
}

/**
 * Validates and normalizes a WhatsApp phone number (`^\+?[0-9]{7,15}$`).
 * Strips spaces, hyphens, and parentheses. Returns null if invalid.
 */
export function sanitizeWhatsappNumber(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.replace(/[\s\-()]/g, '').trim();
  if (!/^\+?[0-9]{7,15}$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/**
 * Neutralizes CSV Formula Injection (CWE-1236) and escapes double quotes for RFC 4180 compliance.
 */
export function sanitizeCsvCell(raw: unknown): string {
  const str = typeof raw === 'string' ? raw : String(raw ?? '');
  const cleaned = str.replace(/[\r\n]+/g, ' ').trim();
  const formulaNeutralized = /^[=+\-@\t\r]/.test(cleaned) ? `'${cleaned}` : cleaned;
  return `"${formulaNeutralized.replace(/"/g, '""')}"`;
}

/**
 * Clamps a numeric value between [min, max], returning fallback if NaN or infinite.
 */
export function clampNumber(val: unknown, min: number, max: number, fallback: number): number {
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

export function extractYouTubeId(input: string): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 1000) return null;

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
        (segments[0] === 'embed' ||
          segments[0] === 'shorts' ||
          segments[0] === 'live' ||
          segments[0] === 'v')
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
  if (!Number.isFinite(amount) || amount < 0 || amount > 1e15) {
    return { converted: 0, unitRate: 0 };
  }
  const fromEntry = Object.prototype.hasOwnProperty.call(customRates, fromCode)
    ? customRates[fromCode]
    : undefined;
  const toEntry = Object.prototype.hasOwnProperty.call(customRates, toCode)
    ? customRates[toCode]
    : undefined;
  if (!fromEntry || !toEntry || !Number.isFinite(fromEntry.rate) || fromEntry.rate <= 0) {
    return { converted: 0, unitRate: 0 };
  }
  const unitRate = toEntry.rate / fromEntry.rate;
  const converted = amount * unitRate;
  if (!Number.isFinite(converted)) {
    return { converted: 0, unitRate: 0 };
  }
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
  if (typeof birthDateStr !== 'string' || typeof referenceDateStr !== 'string') {
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
  const birth = new Date(`${birthDateStr}T00:00:00Z`);
  const ref = new Date(`${referenceDateStr}T00:00:00Z`);

  if (
    Number.isNaN(birth.getTime()) ||
    Number.isNaN(ref.getTime()) ||
    birth > ref ||
    birth.getUTCFullYear() < 1900 ||
    ref.getUTCFullYear() > 2200
  ) {
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
  if (
    !Number.isFinite(diagonalInches) ||
    !Number.isFinite(screenWidthPx) ||
    !Number.isFinite(screenHeightPx) ||
    diagonalInches <= 0 ||
    screenWidthPx <= 0 ||
    screenHeightPx <= 0
  ) {
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
  if (!Number.isFinite(value)) return NaN;
  const rad = angleMode === 'DEG' ? (value * Math.PI) / 180 : value;
  switch (op) {
    case 'sin':
      return Number(Math.sin(rad).toFixed(10));
    case 'cos':
      return Number(Math.cos(rad).toFixed(10));
    case 'tan': {
      // Guard asymptotes in DEG mode (e.g. 90, 270 degrees)
      if (angleMode === 'DEG' && Math.abs(((value % 180) + 180) % 180 - 90) < 1e-9) {
        return NaN;
      }
      return Number(Math.tan(rad).toFixed(10));
    }
    case 'sqrt':
      return value < 0 ? NaN : Number(Math.sqrt(value).toFixed(10));
    case 'log':
      return value <= 0 ? NaN : Number(Math.log10(value).toFixed(10));
    case 'ln':
      return value <= 0 ? NaN : Number(Math.log(value).toFixed(10));
    case 'inv':
      return value === 0 ? NaN : Number((1 / value).toFixed(10));
    case 'sq': {
      const sq = value * value;
      return Number.isFinite(sq) ? Number(sq.toFixed(10)) : Infinity;
    }
    case 'fact':
      return factorial(value);
  }
}
