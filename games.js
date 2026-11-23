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

  // Chave para comparar nomes de quadra: sem maiúsculas, acentos, pontuação nem espaços sobrando.
  function venueKey(name) {
    var s = String(name == null ? '' : name);
    if (s.normalize) s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function cleanName(name) { return String(name == null ? '' : name).replace(/\s+/g, ' ').trim(); }

  // Quadras já usadas, as mais frequentes primeiro. O nome escrito é o do jogo mais recente
  // e o tipo de campo é o último preenchido naquela quadra.
  function venueList(games) {
    var by = {};
    (games || []).forEach(function (g) {
      var name = cleanName(g && g.venue), key = venueKey(name);
      if (!key) return;
      var e = by[key] || (by[key] = { key: key, name: name, count: 0, fieldType: null, _at: '', _ftAt: '' });
      e.count++;
      var at = (g.date || '') + ' ' + (g.time || '');
      if (at >= e._at) { e._at = at; e.name = name; }
      var ft = cleanName(g.fieldType);
      if (ft && at >= e._ftAt) { e._ftAt = at; e.fieldType = ft; }
    });
    return Object.keys(by).map(function (k) { var e = by[k]; return { key: e.key, name: e.name, count: e.count, fieldType: e.fieldType }; })
      .sort(function (a, b) { return b.count - a.count || a.name.localeCompare(b.name); });
  }

  // Se o nome é o de uma quadra já usada (ignorando maiúsculas, acentos e espaços), devolve o jeito
  // que ela já está escrita. Quadra nova só tem os espaços arrumados.
  function matchVenue(games, name) {
    var clean = cleanName(name), key = venueKey(clean);
    if (!key) return { name: clean, fieldType: null, known: false };
    var list = venueList(games);
    for (var i = 0; i < list.length; i++) {
      if (list[i].key === key) return { name: list[i].name, fieldType: list[i].fieldType, known: true };
    }
    return { name: clean, fieldType: null, known: false };
  }

  var api = { findDuplicate: findDuplicate, describeSlot: describeSlot, venueKey: venueKey, venueList: venueList, matchVenue: matchVenue };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.GDAGames = api;
})(typeof window !== 'undefined' ? window : globalThis);
