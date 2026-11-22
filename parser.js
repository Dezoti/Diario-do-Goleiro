/*
 * Lê o texto bruto (OCR) de um print de jogo do app Goleiro de Aluguel
 * e extrai data, horário, quadra, tipo de campo e nota.
 * Funciona no navegador (window.GDAParser) e no Node (module.exports).
 */
(function (root) {
  'use strict';

  var WEEKDAYS = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
  var ADDRESS_RE = /^(rua|r\.|av\.?|avenida|travessa|tv\.?|rodovia|estrada|alameda|al\.|pra[cç]a|largo)\s/i;

  function plain(s) {
    return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function toISO(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }

  // O print só mostra dia/mês e o dia da semana; descobre o ano que bate com os dois.
  function inferYear(day, month, weekday, today) {
    var limit = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    var fallback = null;
    for (var y = today.getFullYear(); y >= today.getFullYear() - 6; y--) {
      var dt = new Date(y, month - 1, day);
      if (dt.getMonth() !== month - 1 || dt > limit) continue;
      if (fallback === null) fallback = y;
      if (weekday === null || dt.getDay() === weekday) return y;
    }
    return fallback === null ? today.getFullYear() : fallback;
  }

  function cleanVenue(raw) {
    var name = raw.split('|')[0].split(/\s[-–—]\s/)[0].trim();
    var tokens = name.split(/\s+/);
    while (tokens.length > 1 && tokens[0].length <= 3 &&
           (/[^A-Za-zÀ-ÿ0-9]/.test(tokens[0]) || tokens[0] === tokens[0].toLowerCase())) {
      tokens.shift();
    }
    return tokens.join(' ').replace(/[^A-Za-zÀ-ÿ0-9)]+$/, '').trim();
  }

  function cleanFieldType(line) {
    return line
      .replace(/^[^A-Za-zÀ-ÿ]+/, '')
      .replace(/Fut[bBsS5]\b/g, 'Fut5')
      .replace(/Fut[tTlI1]\b/g, 'Fut7')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function parsePrintText(text, today) {
    today = today || new Date();
    var lines = String(text).split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var out = { date: null, time: null, venue: null, fieldType: null, rating: null };

    // Nota: o número logo antes de "Pontualidade".
    var ratingIdx = -1;
    for (var i = 0; i < lines.length; i++) {
      if (/pontualidade/i.test(lines[i])) {
        ratingIdx = i;
        var m = lines[i].split(/pontualidade/i)[0].match(/(\d{1,2})/);
        if (m && +m[1] <= 30) out.rating = +m[1];
        break;
      }
    }

    // Data (dd/mm + dia da semana) e horário logo depois.
    var full = lines.join('\n');
    var dm = full.match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*\(\s*([A-Za-zÀ-ÿ]+)/) ||
             full.match(/(\d{1,2})\s*\/\s*(\d{1,2})()/);
    if (dm) {
      var day = +dm[1], month = +dm[2];
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        var wd = dm[3] && WEEKDAYS.hasOwnProperty(plain(dm[3])) ? WEEKDAYS[plain(dm[3])] : null;
        out.date = toISO(inferYear(day, month, wd, today), month, day);
        var rest = full.slice(dm.index + dm[0].length);
        var tm = rest.match(/(\d{1,2})\s*[:.hH]\s*(\d{2})\b|\b(\d{3,4})\b/);
        if (tm) {
          var hh, mm;
          if (tm[3]) { hh = +tm[3].slice(0, -2); mm = +tm[3].slice(-2); }
          else { hh = +tm[1]; mm = +tm[2]; }
          if (hh <= 23 && mm <= 59) out.time = pad(hh) + ':' + pad(mm);
        }
      }
    }

    // Quadra: linhas entre a nota e o endereço.
    var addrIdx = -1;
    for (var j = 0; j < lines.length; j++) {
      var candidate = lines[j].replace(/^[^A-Za-zÀ-ÿ]+/, '');
      if (j > ratingIdx && ADDRESS_RE.test(candidate)) { addrIdx = j; break; }
    }
    if (addrIdx > 0) {
      var venue = cleanVenue(lines.slice(ratingIdx + 1, addrIdx).join(' '));
      if (venue) out.venue = venue;
      // Tipo de campo: primeira linha com palavra-chave depois do endereço (pula a cidade).
      for (var k = addrIdx + 1; k < lines.length; k++) {
        if (/fut|society|quadra|campo|areia|grama|sal[aã]o/i.test(lines[k])) {
          out.fieldType = cleanFieldType(lines[k]);
          break;
        }
      }
    }
    return out;
  }

  var api = { parsePrintText: parsePrintText };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.GDAParser = api;
})(typeof window !== 'undefined' ? window : globalThis);
