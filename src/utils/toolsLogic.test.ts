import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseHashRoute,
  extractYouTubeId,
  convertCurrency,
  calculateExactAge,
  calculatePixelsPerMm,
  evaluateScientificOperation,
  sanitizeSafeExternalUrl,
  sanitizeSafeImageUrl,
  sanitizeWhatsappNumber,
  sanitizeCsvCell,
  generateSecureId,
  clampNumber,
  getLocalCycleDateKey,
  getSecondsUntilNextMidnight,
  formatScreenTimeDuration,
} from './toolsLogic';

test('sanitizeWhatsappNumber normalizes valid phone numbers and rejects invalid strings', () => {
  assert.equal(sanitizeWhatsappNumber('+91 98765 43210'), '+919876543210');
  assert.equal(sanitizeWhatsappNumber('98765-43210'), '9876543210');
  assert.equal(sanitizeWhatsappNumber('123'), null);
  assert.equal(sanitizeWhatsappNumber('abc12345678'), null);
});

test('parseHashRoute resolves secret /#/admin and standalone feature routes accurately', () => {
  assert.deepEqual(parseHashRoute('#/admin'), { route: 'admin' });
  assert.deepEqual(parseHashRoute('#/admin/?foo=1'), { route: 'admin' });
  assert.deepEqual(parseHashRoute('#/ai-news'), { route: 'ai-news' });
  assert.deepEqual(parseHashRoute('#/cinema-machine'), { route: 'cinema-machine' });
  assert.deepEqual(parseHashRoute('#/currency-calculator'), {
    route: 'currency-calculator',
    toolTab: 'currency',
  });
  assert.deepEqual(parseHashRoute('#/unknown-route'), { route: 'dashboard' });
});

test('extractYouTubeId parses standard, short, embed, and raw IDs and rejects malicious payloads', () => {
  assert.equal(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(extractYouTubeId('https://youtu.be/M7lc1UVf-VE?t=12'), 'M7lc1UVf-VE');
  assert.equal(extractYouTubeId('https://www.youtube.com/embed/aqz-KE-bpKQ'), 'aqz-KE-bpKQ');
  assert.equal(extractYouTubeId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(extractYouTubeId('javascript:alert(1)'), null);
  assert.equal(extractYouTubeId('https://example.com/video'), null);
});

test('sanitizeSafeExternalUrl blocks javascript:, data:, and vbscript: URIs', () => {
  assert.equal(sanitizeSafeExternalUrl('javascript:alert(document.cookie)'), '');
  assert.equal(sanitizeSafeExternalUrl('  JaVaScRiPt:alert(1) '), '');
  assert.equal(sanitizeSafeExternalUrl('data:text/html,<script>alert(1)</script>'), '');
  assert.equal(sanitizeSafeExternalUrl('https://archive.org/details/movie'), 'https://archive.org/details/movie');
});

test('sanitizeSafeImageUrl allows valid https and data:image URIs while blocking SVG script injection', () => {
  assert.equal(sanitizeSafeImageUrl('javascript:alert(1)', 'fallback.png'), 'fallback.png');
  assert.equal(
    sanitizeSafeImageUrl('https://images.example.com/photo.jpg', 'fallback.png'),
    'https://images.example.com/photo.jpg'
  );
  assert.equal(
    sanitizeSafeImageUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA', 'fallback.png'),
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA'
  );
});

test('sanitizeCsvCell neutralizes DDE / spreadsheet formula injection payloads', () => {
  assert.equal(sanitizeCsvCell('=CMD|\' /C calc\'!A0'), '"\'=CMD|\' /C calc\'!A0"');
  assert.equal(sanitizeCsvCell('+SUM(A1:A10)'), '"\'+SUM(A1:A10)"');
  assert.equal(sanitizeCsvCell('@IMPORTXML()'), '"\'@IMPORTXML()"');
  assert.equal(sanitizeCsvCell('Priyam "Admin" Kesh'), '"Priyam ""Admin"" Kesh"');
});

test('generateSecureId produces Firestore-compliant IDs with high entropy', () => {
  const id1 = generateSecureId('post');
  const id2 = generateSecureId('post');
  assert.notEqual(id1, id2);
  assert.match(id1, /^[a-zA-Z0-9_-]{1,96}$/);
});

test('convertCurrency converts accurately and guards against prototype pollution keys', () => {
  const res = convertCurrency(100, 'USD', 'INR');
  assert.equal(res.converted, 8415);
  assert.equal(convertCurrency(100, '__proto__', 'INR').converted, 0);
  assert.equal(convertCurrency(-50, 'USD', 'INR').converted, 0);
});

test('calculateExactAge computes exact chronological age and rejects out-of-range dates', () => {
  const res = calculateExactAge('2008-05-15', '2026-10-25');
  assert.equal(res.isValid, true);
  assert.equal(res.years, 18);
  assert.equal(res.months, 5);
  assert.equal(res.days, 10);
  assert.equal(calculateExactAge('1800-01-01', '2026-10-25').isValid, false);
});

test('calculatePixelsPerMm calibrates digital ruler density and guards NaN', () => {
  const ppmm = calculatePixelsPerMm(15.6, 1920, 1080);
  assert.ok(ppmm > 5.5 && ppmm < 5.6);
  assert.equal(calculatePixelsPerMm(NaN, 1920, 1080), 3.7795);
});

test('evaluateScientificOperation handles DEG/RAD trigonometry, asymptotes, and factorials', () => {
  assert.equal(evaluateScientificOperation('sin', 30, 'DEG'), 0.5);
  assert.equal(evaluateScientificOperation('cos', 0, 'RAD'), 1);
  assert.ok(Number.isNaN(evaluateScientificOperation('tan', 90, 'DEG')));
  assert.equal(evaluateScientificOperation('fact', 5), 120);
  assert.ok(Number.isNaN(evaluateScientificOperation('sqrt', -4)));
  assert.equal(clampNumber(999, 0, 100, 50), 100);
});

test('getLocalCycleDateKey, getSecondsUntilNextMidnight, and formatScreenTimeDuration compute 12 AM - 12 AM cycle metrics', () => {
  const sampleDate = new Date(2026, 9, 27, 23, 59, 30); // Oct 27, 2026 23:59:30
  assert.equal(getLocalCycleDateKey(sampleDate), '2026-10-27');
  assert.equal(getSecondsUntilNextMidnight(sampleDate), 30);

  const formatted = formatScreenTimeDuration(3665);
  assert.equal(formatted.hhmmss, '01:01:05');
  assert.equal(formatted.readable, '1h 1m 5s');
  assert.equal(formatted.clampedSeconds, 3665);

  const clampedMax = formatScreenTimeDuration(999999);
  assert.equal(clampedMax.clampedSeconds, 86400);
  assert.equal(clampedMax.hhmmss, '24:00:00');
});

