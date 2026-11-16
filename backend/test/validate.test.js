import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, COLORS, PRIORITIES, email, password, text } from '../src/validate.js';
import { HttpError } from '../src/errors.js';

const erro = (re) => (e) => e instanceof HttpError && e.status === 400 && re.test(e.message);

test('text: corta espaços, obrigatório e tamanho', () => {
  assert.equal(text('  Comprar pão ', 'Título'), 'Comprar pão');
  assert.throws(() => text('', 'Título', { required: true }), erro(/obrigatório/));
  assert.throws(() => text('abc', 'Título', { max: 2 }), erro(/no máximo 2/));
});

test('email: minúsculo e formato', () => {
  assert.equal(email(' Ana@Mail.COM '), 'ana@mail.com');
  assert.throws(() => email('ana@'), erro(/inválido/));
});

test('password: mínimo de 8 caracteres', () => {
  assert.equal(password('12345678'), '12345678');
  assert.throws(() => password('1234567'), erro(/8 caracteres/));
  assert.throws(() => password(null), erro(/8 caracteres/));
  assert.throws(() => password('x'.repeat(201)), erro(/longa/));
});

test('listas fixas sem repetição', () => {
  for (const l of [CATEGORIES, PRIORITIES, COLORS]) assert.equal(new Set(l).size, l.length);
  assert.deepEqual(PRIORITIES, ['low', 'medium', 'high']);
});
