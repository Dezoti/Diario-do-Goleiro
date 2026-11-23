/*
 * Regras sobre a lista de jogos que não dependem da tela.
 * Funciona no navegador (window.GDAGames) e no Node (module.exports).
 */
(function (root) {
  'use strict';

  // Um jogo é identificado pela data (dia, mês e ano) e pelo horário.
  // Sem data ou sem horário não há como afirmar que é o mesmo jogo: retorna null.
  function slot(g) {
    var d = g && g.date ? String(g.date) : '';
    var t = g && g.time ? String(g.time).slice(0, 5) : '';
    return d && t ? d + ' ' + t : null;
  }

  // Devolve o jogo já cadastrado na mesma data e horário, ou null.
  // ignoreId: jogo que está sendo editado (não conta contra si mesmo).
  function findDuplicate(games, candidate, ignoreId) {
    var key = slot(candidate);
    if (!key) return null;
    for (var i = 0; i < games.length; i++) {
      var g = games[i];
      if (ignoreId && g.id === ignoreId) continue;
      if (slot(g) === key) return g;
    }
    return null;
  }

  // "17/11/2026 às 18:00"
  function describeSlot(g) {
    var p = String(g.date || '').split('-');
    var date = p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : String(g.date || '');
    return g.time ? date + ' às ' + String(g.time).slice(0, 5) : date;
  }

  var api = { findDuplicate: findDuplicate, describeSlot: describeSlot };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.GDAGames = api;
})(typeof window !== 'undefined' ? window : globalThis);
