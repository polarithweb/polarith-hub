import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseHashRoute,
  extractYouTubeId,
  convertCurrency,
  calculateExactAge,
  calculatePixelsPerMm,
  evaluateScientificOperation,
} from './toolsLogic';

test('parseHashRoute resolves secret /#/admin and standalone feature routes accurately', () => {
  assert.deepEqual(parseHashRoute('#/admin'), { route: 'admin' });
  assert.deepEqual(parseHashRoute('#/ai-news'), { route: 'ai-news' });
  assert.deepEqual(parseHashRoute('#/currency-calculator'), {
    route: 'currency-calculator',
    toolTab: 'currency',
  });
  assert.deepEqual(parseHashRoute('#/digital-ruler'), {
    route: 'digital-ruler',
    toolTab: 'ruler',
  });
  assert.deepEqual(parseHashRoute('#/tools/ruler'), {
    route: 'digital-ruler',
    toolTab: 'ruler',
  });
  assert.deepEqual(parseHashRoute(''), { route: 'dashboard' });
});

test('extractYouTubeId parses standard, short, embed, and raw IDs', () => {
  assert.equal(extractYouTubeId('https://www.youtube.com/watch?v=M7lc1UVf-VE'), 'M7lc1UVf-VE');
  assert.equal(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ?si=123'), 'dQw4w9WgXcQ');
  assert.equal(extractYouTubeId('https://www.youtube.com/embed/aqz-KE-bpKQ'), 'aqz-KE-bpKQ');
  assert.equal(extractYouTubeId('M7lc1UVf-VE'), 'M7lc1UVf-VE');
  assert.equal(extractYouTubeId('not-a-valid-url'), null);
});

test('convertCurrency converts accurately between currencies', () => {
  const res = convertCurrency(100, 'USD', 'INR');
  assert.equal(res.converted, 8415);
  const same = convertCurrency(250, 'EUR', 'EUR');
  assert.equal(same.converted, 250);
  assert.equal(same.unitRate, 1);
});

test('calculateExactAge computes exact chronological age and next birthday', () => {
  const age = calculateExactAge('2008-05-15', '2026-10-25');
  assert.equal(age.isValid, true);
  assert.equal(age.years, 18);
  assert.equal(age.months, 5);
  assert.equal(age.days, 10);
  assert.ok(age.totalDays > 6700);
});

test('calculatePixelsPerMm calibrates digital ruler density', () => {
  const ppmm = calculatePixelsPerMm(15.6, 1920, 1080);
  assert.ok(ppmm > 5.5 && ppmm < 5.6);
});

test('evaluateScientificOperation handles DEG/RAD trigonometry and factorials', () => {
  assert.equal(evaluateScientificOperation('sin', 30, 'DEG'), 0.5);
  assert.equal(evaluateScientificOperation('cos', 0, 'RAD'), 1);
  assert.equal(evaluateScientificOperation('sqrt', 81), 9);
  assert.equal(evaluateScientificOperation('fact', 5), 120);
});
