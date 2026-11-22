const test = require('node:test');
const assert = require('node:assert');
const { parsePrintText } = require('../parser.js');

const today = new Date(2026, 10, 21); // 21/11/2026

// Saídas reais de OCR (com os ruídos típicos: ícones lidos como letras, "21:00" lido como "2100").
test('print da Arena P10', () => {
  const text = '30 Pontualidade Uniforme\npó d ARENA P10 - Beach Tennis | Futevólei!\nSociety FUT 5 | Vôlei\nRua Felipe Reiser, 703, São João\nItajaí\n>> Society Futb/Fut7\n17/11 (terça) (O 18:00 (9 1h 00min\n';
  assert.deepStrictEqual(parsePrintText(text, today), {
    date: '2026-11-17', time: '18:00', venue: 'ARENA P10', fieldType: 'Society Fut5/Fut7', rating: 30,
  });
});

test('print da Golden Soccer', () => {
  const text = '30) Pontualidade Uniforme\nf$y Golden Soccer | Quadra de Futebol\nRua Blumenau, 609, São João\nItajaí\n>> Society Futb/Fut7\n(5 16/11 (segunda) (O 2100 (9 1h 00min\n';
  assert.deepStrictEqual(parsePrintText(text, today), {
    date: '2026-11-16', time: '21:00', venue: 'Golden Soccer', fieldType: 'Society Fut5/Fut7', rating: 30,
  });
});

test('usa o dia da semana para achar o ano certo', () => {
  const text = '28 Pontualidade\nQuadra Central\nAv. Brasil, 10\nCuritiba\nFutsal\n03/03 (sexta) 20:30 1h';
  assert.strictEqual(parsePrintText(text, today).date, '2023-03-03');
});

test('texto sem nada reconhecível não quebra', () => {
  assert.deepStrictEqual(parsePrintText('lixo', today), {
    date: null, time: null, venue: null, fieldType: null, rating: null,
  });
});
