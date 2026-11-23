const test = require('node:test');
const assert = require('node:assert');
const { scaleToFit } = require('../photos.js');

test('reduz foto grande mantendo a proporção', () => {
  assert.deepStrictEqual(scaleToFit(4000, 3000, 1600), { width: 1600, height: 1200 });
});

test('reduz foto em pé pelo lado maior', () => {
  assert.deepStrictEqual(scaleToFit(3000, 4000, 1600), { width: 1200, height: 1600 });
});

test('não aumenta foto pequena', () => {
  assert.deepStrictEqual(scaleToFit(800, 600, 1600), { width: 800, height: 600 });
  assert.deepStrictEqual(scaleToFit(1600, 1600, 1600), { width: 1600, height: 1600 });
});

test('arredonda para números inteiros', () => {
  const r = scaleToFit(4001, 3001, 1600);
  assert.ok(Number.isInteger(r.width) && Number.isInteger(r.height));
  assert.strictEqual(r.width, 1600);
});

test('tamanho zero não quebra', () => {
  assert.deepStrictEqual(scaleToFit(0, 0, 1600), { width: 0, height: 0 });
});
