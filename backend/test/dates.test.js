import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDay, isTime, nowInTz, toMinutes } from '../src/dates.js';

test('nowInTz: dia e minutos no fuso de São Paulo', () => {
  assert.deepEqual(nowInTz(new Date('2026-11-16T02:30:00Z')), { day: '2026-11-15', minutes: 23 * 60 + 30 });
  assert.deepEqual(nowInTz(new Date('2026-11-16T03:00:00Z')), { day: '2026-11-16', minutes: 0 });
});

test('isDay e isTime', () => {
  assert.equal(isDay('2026-11-16'), true);
  assert.equal(isDay('2026-13-01'), false);
  assert.equal(isDay(20261116), false);
  assert.equal(isTime('00:00'), true);
  assert.equal(isTime('23:59'), true);
  assert.equal(isTime('24:00'), false);
  assert.equal(isTime('9:30'), false);
});

test('toMinutes: HH:MM em minutos do dia', () => {
  assert.equal(toMinutes('00:15'), 15);
  assert.equal(toMinutes('14:30'), 870);
});
