const test = require('node:test');
const assert = require('node:assert');
const { findDuplicate, describeSlot } = require('../games.js');

const base = [
  { id: 'a', date: '2026-11-17', time: '18:00', venue: 'ARENA P10' },
  { id: 'b', date: '2026-11-16', time: '21:00', venue: 'Golden Soccer' },
  { id: 'c', date: '2026-11-20', time: null, venue: 'Sem horário' },
];

test('mesma data e mesmo horário é duplicado', () => {
  assert.strictEqual(findDuplicate(base, { date: '2026-11-17', time: '18:00' }).id, 'a');
});

test('a quadra não importa para a comparação', () => {
  assert.strictEqual(findDuplicate(base, { date: '2026-11-17', time: '18:00', venue: 'Outra quadra' }).id, 'a');
});

test('mesma data com horário diferente não é duplicado', () => {
  assert.strictEqual(findDuplicate(base, { date: '2026-11-17', time: '19:00' }), null);
});

test('mesmo horário em outro dia, mês ou ano não é duplicado', () => {
  assert.strictEqual(findDuplicate(base, { date: '2026-11-18', time: '18:00' }), null);
  assert.strictEqual(findDuplicate(base, { date: '2026-12-17', time: '18:00' }), null);
  assert.strictEqual(findDuplicate(base, { date: '2025-11-17', time: '18:00' }), null);
});

test('sem horário não bloqueia, nem é bloqueado', () => {
  assert.strictEqual(findDuplicate(base, { date: '2026-11-20', time: '' }), null);
  assert.strictEqual(findDuplicate(base, { date: '2026-11-20', time: null }), null);
  assert.strictEqual(findDuplicate(base, { date: '2026-11-20', time: '10:00' }), null);
  assert.strictEqual(findDuplicate([{ id: 'x', date: '2026-11-20', time: null }], { date: '2026-11-20', time: '10:00' }), null);
});

test('sem data não bloqueia', () => {
  assert.strictEqual(findDuplicate(base, { date: '', time: '18:00' }), null);
});

test('ao editar, o jogo não conta contra si mesmo', () => {
  assert.strictEqual(findDuplicate(base, { date: '2026-11-17', time: '18:00' }, 'a'), null);
  assert.strictEqual(findDuplicate(base, { date: '2026-11-16', time: '21:00' }, 'a').id, 'b');
});

test('horário com segundos é tratado como horário sem segundos', () => {
  assert.strictEqual(findDuplicate(base, { date: '2026-11-17', time: '18:00:00' }).id, 'a');
});

test('descreve data e horário em português', () => {
  assert.strictEqual(describeSlot(base[0]), '17/11/2026 às 18:00');
  assert.strictEqual(describeSlot(base[2]), '20/11/2026');
});

/* ---------- Quadras: sugestões e nomes iguais ---------- */
const G = require('../games.js');

test('venueKey ignora maiúsculas, acentos, pontuação e espaços', () => {
  assert.strictEqual(G.venueKey('Arena P10'), G.venueKey('  ARENA   p10 '));
  assert.strictEqual(G.venueKey('Quadra Pelé'), G.venueKey('quadra pele'));
  assert.strictEqual(G.venueKey('Arena, P10!'), G.venueKey('arena p10'));
  assert.notStrictEqual(G.venueKey('Arena P10'), G.venueKey('Arena P11'));
  assert.strictEqual(G.venueKey(null), '');
});

test('venueList: mais usadas primeiro, nome do jogo mais recente, último tipo de campo', () => {
  const games = [
    { date: '2026-10-01', time: '19:00', venue: 'ARENA P10', fieldType: 'Fut5' },
    { date: '2026-11-01', time: '19:00', venue: 'Arena P10 ', fieldType: '' },
    { date: '2026-09-01', time: '20:00', venue: 'Quadra Sul', fieldType: 'Society' },
    { date: '2026-11-10', time: '20:00', venue: 'arena p10', fieldType: 'Fut7' },
    { date: '2026-11-11', time: '20:00', venue: null }
  ];
  const l = G.venueList(games);
  assert.strictEqual(l.length, 2);
  assert.strictEqual(l[0].name, 'arena p10');   // grafia do mais recente
  assert.strictEqual(l[0].count, 3);
  assert.strictEqual(l[0].fieldType, 'Fut7');   // último tipo preenchido
  assert.strictEqual(l[1].name, 'Quadra Sul');
});

test('matchVenue devolve a grafia já salva e o tipo de campo', () => {
  const games = [{ date: '2026-10-01', time: '19:00', venue: 'Arena P10', fieldType: 'Fut5' }];
  assert.deepStrictEqual(G.matchVenue(games, 'ARENA  p10'), { name: 'Arena P10', fieldType: 'Fut5', known: true });
  const novo = G.matchVenue(games, '  Quadra   Nova ');
  assert.deepStrictEqual(novo, { name: 'Quadra Nova', fieldType: null, known: false });
  assert.deepStrictEqual(G.matchVenue(games, ''), { name: '', fieldType: null, known: false });
  assert.deepStrictEqual(G.matchVenue([], 'Qualquer'), { name: 'Qualquer', fieldType: null, known: false });
});
