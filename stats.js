/*
 * Estatísticas dos jogos: cálculos que não dependem da tela.
 * Funciona no navegador (window.GDAStats) e no Node (module.exports).
 * Médias consideram só os jogos que têm aquele dado preenchido.
 */
(function (root) {
  'use strict';

  var MAX_RATING = 30;
  var MIN_GAMES = 3; // abaixo disso não vale desenhar gráfico

  function isNum(n) { return typeof n === 'number' && isFinite(n); }

  // Resultado do jogo: o marcado (V/E/D) ou, na falta dele, o que o placar mostra.
  function resultOf(g) {
    if (!g) return null;
    if (g.result === 'V' || g.result === 'E' || g.result === 'D') return g.result;
    if (isNum(g.scoreFor) && isNum(g.scoreAgainst)) return g.scoreFor > g.scoreAgainst ? 'V' : g.scoreFor < g.scoreAgainst ? 'D' : 'E';
    return null;
  }

  // today: 'AAAA-MM-DD'. mode: 'month' | 'year' | 'all'.
  function inPeriod(g, mode, today) {
    if (mode === 'all') return true;
    var d = g && g.date ? String(g.date) : '';
    if (!d) return false;
    return mode === 'month' ? d.slice(0, 7) === String(today).slice(0, 7) : d.slice(0, 4) === String(today).slice(0, 4);
  }
  function filterPeriod(games, mode, today) {
    return (games || []).filter(function (g) { return inPeriod(g, mode, today); });
  }

  function average(games, field) {
    var sum = 0, n = 0;
    games.forEach(function (g) { if (isNum(g[field])) { sum += g[field]; n++; } });
    return n ? { value: sum / n, n: n } : null;
  }

  function total(games, field) {
    var sum = 0;
    games.forEach(function (g) { if (isNum(g[field])) sum += g[field]; });
    return sum;
  }

  function summarize(games) {
    games = games || [];
    var c = { V: 0, E: 0, D: 0 };
    games.forEach(function (g) { var r = resultOf(g); if (r) c[r]++; });
    var decided = c.V + c.E + c.D;
    return {
      total: games.length, wins: c.V, draws: c.E, losses: c.D, decided: decided,
      winRate: decided ? c.V / decided : null,
      totalSaves: total(games, 'saves'),
      avgSaves: average(games, 'saves'),
      avgConceded: average(games, 'goalsConceded'),
      avgScored: average(games, 'goalsScored'),
      avgRating: average(games, 'rating')
    };
  }

  function byDate(a, b) { return ((a.date || '') + ' ' + (a.time || '')).localeCompare((b.date || '') + ' ' + (b.time || '')); }

  // Notas em ordem de data (só jogos com nota).
  function ratingSeries(games) {
    return (games || []).filter(function (g) { return isNum(g.rating) && g.date; }).sort(byDate)
      .map(function (g) { return { date: g.date, rating: g.rating }; });
  }

  // Pontos do gráfico de linha em uma área w×h com margens pad. Eixo vertical fixo de 0 a 30.
  function chartPoints(series, w, h, pad) {
    var iw = w - pad.left - pad.right, ih = h - pad.top - pad.bottom, n = series.length;
    return series.map(function (p, i) {
      var x = n === 1 ? pad.left + iw / 2 : pad.left + (iw * i) / (n - 1);
      var y = pad.top + ih * (1 - Math.max(0, Math.min(MAX_RATING, p.rating)) / MAX_RATING);
      return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, rating: p.rating, date: p.date };
    });
  }

  // Desempenho por quadra (nomes iguais em maiúsculas/acentos contam como uma). Mais jogadas primeiro.
  // venueKey: função de comparação de nomes (GDAGames.venueKey).
  function byVenue(games, venueKey) {
    var by = {};
    (games || []).forEach(function (g) {
      var name = String(g.venue == null ? '' : g.venue).replace(/\s+/g, ' ').trim();
      if (!name) return;
      var key = venueKey(name), e = by[key] || (by[key] = { name: name, games: [], at: '' });
      e.games.push(g);
      var at = (g.date || '') + ' ' + (g.time || '');
      if (at >= e.at) { e.at = at; e.name = name; }
    });
    return Object.keys(by).map(function (k) {
      var e = by[k], s = summarize(e.games);
      return { name: e.name, games: s.total, wins: s.wins, avgRating: s.avgRating };
    }).sort(function (a, b) { return b.games - a.games || a.name.localeCompare(b.name); });
  }

  var api = { MAX_RATING: MAX_RATING, MIN_GAMES: MIN_GAMES, resultOf: resultOf, inPeriod: inPeriod, filterPeriod: filterPeriod,
              summarize: summarize, ratingSeries: ratingSeries, chartPoints: chartPoints, byVenue: byVenue };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.GDAStats = api;
})(typeof window !== 'undefined' ? window : globalThis);
