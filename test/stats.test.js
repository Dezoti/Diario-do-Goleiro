const test = require('node:test');
const assert = require('node:assert');
const S = require('../stats.js');
const { venueKey } = require('../games.js');

const jogos = [
  { id: 1, date: '2026-11-02', time: '19:00', venue: 'Arena P10', result: 'V', scoreFor: 3, scoreAgainst: 1, saves: 8, goalsConceded: 1, goalsScored: 0, rating: 28 },
  { id: 2, date: '2026-11-09', time: '19:00', venue: 'ARENA P10 ', result: 'D', scoreFor: 1, scoreAgainst: 4, saves: 12, goalsConceded: 4, rating: 20 },
  { id: 3, date: '2026-10-20', time: '21:00', venue: 'Quadra Sul', scoreFor: 2, scoreAgainst: 2, rating: 25 },
  { id: 4, date: '2025-12-01', time: '20:00', venue: 'Quadra Sul' },
];

test('resultado: o marcado manda, senão vem do placar, senão nada', () => {
  assert.strictEqual(S.resultOf({ result: 'D', scoreFor: 5, scoreAgainst: 0 }), 'D');
  assert.strictEqual(S.resultOf({ scoreFor: 2, scoreAgainst: 1 }), 'V');
  assert.strictEqual(S.resultOf({ scoreFor: 1, scoreAgainst: 1 }), 'E');
  assert.strictEqual(S.resultOf({ scoreFor: 1 }), null);
  assert.strictEqual(S.resultOf(null), null);
});

test('período: mês, ano e tudo', () => {
  assert.deepStrictEqual(S.filterPeriod(jogos, 'month', '2026-11-23').map(g => g.id), [1, 2]);
  assert.deepStrictEqual(S.filterPeriod(jogos, 'year', '2026-11-23').map(g => g.id), [1, 2, 3]);
  assert.strictEqual(S.filterPeriod(jogos, 'all', '2026-11-23').length, 4);
  assert.strictEqual(S.filterPeriod([{ id: 9 }], 'month', '2026-11-23').length, 0); // sem data
});

test('resumo: totais, percentual e médias só de quem tem o dado', () => {
  const r = S.summarize(jogos);
  assert.strictEqual(r.total, 4);
  assert.deepStrictEqual([r.wins, r.draws, r.losses, r.decided], [1, 1, 1, 3]);
  assert.ok(Math.abs(r.winRate - 1 / 3) < 1e-9);
  assert.deepStrictEqual(r.avgSaves, { value: 10, n: 2 });            // (8+12)/2, jogos sem defesas não puxam para zero
  assert.deepStrictEqual(r.avgConceded, { value: 2.5, n: 2 });
  assert.deepStrictEqual(r.avgScored, { value: 0, n: 1 });             // zero informado conta
  assert.ok(Math.abs(r.avgRating.value - 73 / 3) < 1e-9 && r.avgRating.n === 3);
});

test('resumo vazio não quebra', () => {
  const r = S.summarize([]);
  assert.strictEqual(r.total, 0);
  assert.strictEqual(r.winRate, null);
  assert.strictEqual(r.avgRating, null);
});

test('série de notas em ordem de data, só jogos com nota', () => {
  assert.deepStrictEqual(S.ratingSeries(jogos).map(p => p.rating), [25, 28, 20]);
});

test('pontos do gráfico: 0 embaixo, 30 em cima, espaçados igualmente', () => {
  const pad = { left: 10, right: 10, top: 10, bottom: 10 };
  const p = S.chartPoints([{ date: 'a', rating: 0 }, { date: 'b', rating: 15 }, { date: 'c', rating: 30 }], 110, 110, pad);
  assert.deepStrictEqual(p.map(q => q.x), [10, 55, 100]);
  assert.deepStrictEqual(p.map(q => q.y), [100, 55, 10]);
  assert.strictEqual(S.chartPoints([{ date: 'a', rating: 15 }], 110, 110, pad)[0].x, 55); // um ponto só fica no centro
  assert.strictEqual(S.chartPoints([{ date: 'a', rating: 99 }], 110, 110, pad)[0].y, 10);   // nota fora da escala não sai do gráfico
});

test('por quadra: junta grafias iguais, mais jogadas primeiro, nota média', () => {
  const v = S.byVenue(jogos, venueKey);
  assert.strictEqual(v.length, 2);
  assert.strictEqual(v[0].name, 'ARENA P10'); // grafia do jogo mais recente, sem espaço sobrando
  assert.deepStrictEqual([v[0].games, v[0].wins], [2, 1]);
  assert.strictEqual(v[0].avgRating.value, 24);
  assert.strictEqual(v[1].name, 'Quadra Sul');
  assert.strictEqual(v[1].games, 2);
  assert.strictEqual(v[1].wins, 0);
  assert.strictEqual(S.byVenue([{ date: '2026-01-01' }], venueKey).length, 0); // sem quadra não entra
});
