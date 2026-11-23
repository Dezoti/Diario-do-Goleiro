const test = require('node:test');
const assert = require('node:assert');
const S = require('../share-image.js');

test('tamanhos dos formatos', () => {
  assert.deepStrictEqual([S.FORMATS.story.w, S.FORMATS.story.h], [1080, 1920]);
  assert.deepStrictEqual([S.FORMATS.feed.w, S.FORMATS.feed.h], [1080, 1350]);
});

test('resultado segue o placar', () => {
  assert.strictEqual(S.resultFromScore({ scoreFor: 3, scoreAgainst: 1 }).label, 'VITÓRIA');
  assert.strictEqual(S.resultFromScore({ scoreFor: 2, scoreAgainst: 2 }).label, 'EMPATE');
  assert.strictEqual(S.resultFromScore({ scoreFor: 0, scoreAgainst: 4 }).label, 'DERROTA');
  assert.strictEqual(S.resultFromScore({ scoreFor: 0, scoreAgainst: 0 }).key, 'E');
});

test('sem placar completo não há selo', () => {
  assert.strictEqual(S.resultFromScore({ scoreFor: 1 }), null);
  assert.strictEqual(S.resultFromScore({}), null);
  assert.strictEqual(S.resultFromScore(null), null);
});

test('recorte cover preenche a caixa sem deformar', () => {
  const r = S.coverRect(4000, 3000, 0, 0, 1080, 1920);
  assert.ok(Math.abs(r.sw / r.sh - 1080 / 1920) < 1e-9);
  assert.ok(r.sx >= 0 && r.sy >= 0 && r.sx + r.sw <= 4000 + 1e-6 && r.sy + r.sh <= 3000 + 1e-6);
  const w = S.coverRect(1000, 3000, 10, 20, 500, 500);
  assert.ok(Math.abs(w.sw / w.sh - 1) < 1e-9);
  assert.strictEqual(w.dx, 10);
});

test('divisão de fotos cobre a tela sem sair dela', () => {
  for (let n = 1; n <= 4; n++) {
    const slots = S.photoSlots(n, 1080, 1350);
    assert.strictEqual(slots.length, n);
    slots.forEach(s => assert.ok(s.x >= 0 && s.y >= 0 && s.x + s.w <= 1080 && s.y + s.h <= 1350 && s.w > 0 && s.h > 0));
  }
  assert.strictEqual(S.photoSlots(0, 1080, 1350).length, 0);
  assert.strictEqual(S.photoSlots(9, 1080, 1350).length, 4);
});

test('fitBox mantém a proporção dentro do limite', () => {
  const b = S.fitBox(1000, 500, 400, 120);
  assert.ok(b.w <= 400 && b.h <= 120);
  assert.ok(Math.abs(b.w / b.h - 2) < 0.05);
});

test('nome do arquivo', () => {
  assert.strictEqual(S.fileName({ date: '2026-11-22' }, 'story'), 'jogo-2026-11-22-story.png');
});
