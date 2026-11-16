import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, category, dayKey, dayLabel, firstName, initials, isOverdue, longDate, parseDay, priority, projectColor, taskWhen } from '../src/util.ts';

test('dayKey, parseDay e addDays (data local)', () => {
  assert.equal(dayKey(new Date(2026, 10, 16, 23, 59)), '2026-11-16');
  assert.equal(parseDay('2026-11-16').getDate(), 16);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2024-03-01', -1), '2024-02-29');
});

test('dayLabel: hoje, amanhã, ontem e data curta', () => {
  const hoje = dayKey();
  assert.equal(dayLabel(hoje), 'Hoje');
  assert.equal(dayLabel(addDays(hoje, 1)), 'Amanhã');
  assert.equal(dayLabel(addDays(hoje, -1)), 'Ontem');
  assert.match(dayLabel('2020-03-05'), /^05 mar 2020$/);
});

test('longDate e taskWhen', () => {
  assert.equal(longDate('2026-11-16'), 'Segunda, 16 de novembro de 2026');
  assert.equal(taskWhen({ date: null, startTime: null, endTime: null } as never), 'Sem data');
  assert.equal(taskWhen({ date: '2020-03-05', startTime: '09:00', endTime: '10:00' } as never, false), '09:00 - 10:00');
  assert.equal(taskWhen({ date: '2020-03-05', startTime: null, endTime: null } as never, false), 'Dia todo');
  assert.equal(taskWhen({ date: '2020-03-05', startTime: '09:00', endTime: null } as never), '05 mar 2020 • 09:00');
});

test('isOverdue: só tarefa aberta com data passada', () => {
  assert.equal(isOverdue({ done: false, date: '2020-01-01' } as never), true);
  assert.equal(isOverdue({ done: true, date: '2020-01-01' } as never), false);
  assert.equal(isOverdue({ done: false, date: null } as never), false);
  assert.equal(isOverdue({ done: false, date: addDays(dayKey(), 1) } as never), false);
});

test('categoria, prioridade e cor com padrão', () => {
  assert.equal(category('design').label, 'Design');
  assert.equal(category('nada').id, 'geral');
  assert.equal(priority('high').label, 'Alta');
  assert.equal(priority('x').id, 'medium');
  assert.equal(projectColor('x'), projectColor('blue'));
});

test('initials e firstName', () => {
  assert.equal(initials('Ana Paula Souza'), 'AS');
  assert.equal(initials('  '), '?');
  assert.equal(firstName(' Ana Paula'), 'Ana');
});
