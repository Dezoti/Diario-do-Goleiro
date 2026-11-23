(function () {
  'use strict';

  var KEY = 'diario-goleiro:v1';
  var TESSERACT_SRC = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  var FIELD_TYPES = ['Society Fut5/Fut7', 'Society', 'Futsal', 'Campo', 'Areia', 'Grama sintética'];
  var MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var RESULT_LABEL = { V: 'Vitória', E: 'Empate', D: 'Derrota' };

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var games = load();
  var filter = 'all';
  var editingId = null;
  var draft = {};

  /* ---------- Dados ---------- */
  function load() {
    try {
      var a = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(games)); }
    catch (e) { toast('Não consegui salvar neste aparelho.'); }
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function toNum(v) { return v === '' || v == null ? null : (isFinite(Number(v)) ? Number(v) : null); }

  /* ---------- Utilidades ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(n) { return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 }); }
  function parseISO(iso) {
    var p = String(iso).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function sortKey(g) { return (g.date || '') + ' ' + (g.time || ''); }

  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3800);
  }

  function busy(text, progress) {
    $('#busy').hidden = false;
    $('#busyText').textContent = text;
    $('#busyBar').style.width = Math.round((progress || 0) * 100) + '%';
  }
  function unbusy() { $('#busy').hidden = true; }

  /* ---------- Resumo ---------- */
  function renderStats() {
    var c = { V: 0, E: 0, D: 0 };
    games.forEach(function (g) { if (g.result) c[g.result]++; });
    var decided = c.V + c.E + c.D;
    var sum = function (k) { return games.reduce(function (a, g) { return a + (isNum(g[k]) ? g[k] : 0); }, 0); };
    var avg = function (k) {
      var v = games.filter(function (g) { return isNum(g[k]); });
      return v.length ? v.reduce(function (a, g) { return a + g[k]; }, 0) / v.length : null;
    };
    var rating = avg('rating'), conc = avg('goalsConceded');
    var pct = function (n) { return decided ? (n / decided) * 100 : 0; };

    $('#stats').innerHTML =
      '<div class="stat hero">' +
        '<div class="record">' +
          '<div class="v"><small>Vitórias</small><strong>' + c.V + '</strong></div>' +
          '<div class="e"><small>Empates</small><strong>' + c.E + '</strong></div>' +
          '<div class="d"><small>Derrotas</small><strong>' + c.D + '</strong></div>' +
        '</div>' +
        '<div class="bar-result" aria-hidden="true">' +
          '<i class="v" style="width:' + pct(c.V) + '%"></i><i class="e" style="width:' + pct(c.E) + '%"></i><i class="d" style="width:' + pct(c.D) + '%"></i>' +
        '</div>' +
      '</div>' +
      tile('Jogos', games.length) +
      tile('Nota média', rating == null ? '–' : fmt(rating) + ' <i>/30</i>') +
      tile('Defesas', sum('saves')) +
      tile('Gols sofridos', sum('goalsConceded')) +
      tile('Sofridos/jogo', conc == null ? '–' : fmt(conc)) +
      tile('Gols marcados', sum('goalsScored'));
  }
  function tile(label, value) {
    return '<div class="stat"><small>' + label + '</small><strong>' + value + '</strong></div>';
  }

  /* ---------- Lista ---------- */
  function matches(g) {
    if (filter === 'all') return true;
    if (filter === 'P') return !g.result;
    return g.result === filter;
  }

  function renderChips() {
    var count = function (f) {
      return games.filter(function (g) { return f === 'all' ? true : f === 'P' ? !g.result : g.result === f; }).length;
    };
    var defs = [['all', 'Todos'], ['V', 'Vitórias'], ['E', 'Empates'], ['D', 'Derrotas'], ['P', 'Pendentes']];
    $('#chips').innerHTML = defs.map(function (d) {
      return '<button class="chip" data-f="' + d[0] + '" aria-pressed="' + (filter === d[0]) + '">' + d[1] + '<b>' + count(d[0]) + '</b></button>';
    }).join('');
  }

  function renderList() {
    var list = games.filter(matches).sort(function (a, b) { return sortKey(b) < sortKey(a) ? -1 : 1; });
    $('#empty').hidden = games.length > 0;
    $('#chips').hidden = games.length === 0;
    $('#list').innerHTML = list.map(card).join('');
    if (games.length && !list.length) {
      $('#list').innerHTML = '<p class="hint" style="text-align:center;padding:30px 0">Nenhum jogo neste filtro.</p>';
    }
  }

  function card(g) {
    var d = g.date ? parseISO(g.date) : null;
    var cls = g.result ? g.result.toLowerCase() : '';
    var sub = [g.time, g.fieldType].filter(Boolean).join(' · ');
    var tags = '';
    if (g.opponentKeeper) tags += '<span class="tag">vs ' + esc(g.opponentKeeper) + '</span>';
    if (isNum(g.saves)) tags += '<span class="tag save">' + g.saves + ' defesa' + (g.saves === 1 ? '' : 's') + '</span>';
    if (isNum(g.goalsConceded)) tags += '<span class="tag conc">' + g.goalsConceded + ' sofrido' + (g.goalsConceded === 1 ? '' : 's') + '</span>';
    if (isNum(g.goalsScored) && g.goalsScored > 0) tags += '<span class="tag">' + g.goalsScored + ' gol' + (g.goalsScored === 1 ? '' : 's') + '</span>';

    var main;
    if (isNum(g.scoreFor) && isNum(g.scoreAgainst)) main = '<span class="score-pill">' + g.scoreFor + '×' + g.scoreAgainst + '</span>';
    else if (g.result) main = '<span class="score-pill">' + g.result + '</span>';
    else main = '<span class="pending">Completar</span>';
    var rating = isNum(g.rating) ? '<span class="rating-pill">' + g.rating + '/30</span>' : '';

    return '<div class="card ' + cls + '" role="button" tabindex="0" data-id="' + esc(g.id) + '">' +
      '<div class="date"><b>' + (d ? d.getDate() : '–') + '</b><small>' + (d ? WEEKDAYS[d.getDay()] + ' ' + MONTHS[d.getMonth()] : '') + '</small></div>' +
      '<div class="info"><h3>' + esc(g.venue || 'Quadra não informada') + '</h3>' + (sub ? '<p>' + esc(sub) + '</p>' : '') +
      (tags ? '<div class="meta">' + tags + '</div>' : '') + '</div>' +
      '<div class="side">' + main + rating + '</div>' + photoStrip(g) + '</div>';
  }

  function photoStrip(g) {
    var ids = Array.isArray(g.photoIds) ? g.photoIds : [];
    if (!ids.length) return '';
    var shown = ids.slice(0, 3).map(function (id) { return '<img data-photo="' + esc(id) + '" alt="">'; }).join('');
    var more = ids.length > 3 ? '<span class="more">+' + (ids.length - 3) + '</span>' : '';
    return '<div class="card-photos">' + shown + more + '</div>';
  }
  // Troca os espaços reservados pelas miniaturas guardadas no IndexedDB.
  function hydratePhotos(root) {
    root.querySelectorAll('img[data-photo]').forEach(function (img) {
      GDAPhotos.url(img.dataset.photo, 'thumb').then(function (u) {
        if (u) img.src = u; else img.remove();
      }).catch(function () { img.remove(); });
    });
  }

  function render() { renderStats(); renderChips(); renderList(); hydratePhotos($('#list')); }

  /* ---------- Formulário ---------- */
  var sheet = $('#sheet');

  function setResult(v) {
    draft.result = v || null;
    document.querySelectorAll('#fResult button').forEach(function (b) {
      b.setAttribute('aria-checked', String(b.dataset.v === draft.result));
    });
  }
  function setStepper(key, v) {
    draft[key] = v;
    document.querySelector('.stepper[data-key="' + key + '"] output').textContent = v == null ? '–' : v;
  }

  // Quadras já usadas viram sugestões; escolher (ou digitar igual) mantém o nome já salvo e traz o tipo de campo.
  function refreshVenueList() {
    $('#venueList').innerHTML = GDAGames.venueList(games).map(function (v) { return '<option value="' + esc(v.name) + '">'; }).join('');
  }
  function applyVenue() {
    var input = $('#fVenue'), m = GDAGames.matchVenue(games, input.value);
    input.value = m.name;
    if (m.known && m.fieldType && !$('#fField').value.trim()) $('#fField').value = m.fieldType;
  }
  $('#fVenue').addEventListener('change', applyVenue);

  function openForm(id) {
    editingId = id || null;
    var g = id ? games.filter(function (x) { return x.id === id; })[0] : null;
    g = g || {};
    $('#sheetTitle').textContent = id ? 'Editar jogo' : 'Novo jogo';
    $('#btnDelete').hidden = !id;
    $('#fDate').value = g.date || '';
    $('#fTime').value = g.time || '';
    $('#fVenue').value = g.venue || '';
    $('#fField').value = g.fieldType || '';
    $('#fOpp').value = g.opponentKeeper || '';
    $('#fScoreFor').value = isNum(g.scoreFor) ? g.scoreFor : '';
    $('#fScoreAgainst').value = isNum(g.scoreAgainst) ? g.scoreAgainst : '';
    $('#fRating').value = isNum(g.rating) ? g.rating : '';
    $('#fNotes').value = g.notes || '';
    var photoIds = Array.isArray(g.photoIds) ? g.photoIds.slice() : [];
    draft = { concededAuto: !isNum(g.goalsConceded), photoIds: photoIds, originalPhotoIds: photoIds.slice(), newPhotoIds: [], finished: false };
    renderPhotoGrid();
    updateInstagramField(id ? g : null);
    refreshVenueList();
    setResult(g.result);
    ['goalsScored', 'goalsConceded', 'saves'].forEach(function (k) { setStepper(k, isNum(g[k]) ? g[k] : null); });
    hideDup();
    document.body.style.overflow = 'hidden';
    sheet.showModal();
    sheet.scrollTop = 0;
  }

  // Fotos adicionadas e não salvas são apagadas ao sair do formulário sem salvar.
  function finishForm(saved) {
    if (draft.finished) return;
    draft.finished = true;
    if (!saved) draft.newPhotoIds.forEach(function (id) { GDAPhotos.remove(id); });
  }
  function closeForm(saved) {
    finishForm(saved === true);
    if (sheet.open) sheet.close();
  }
  sheet.addEventListener('close', function () {
    document.body.style.overflow = '';
    if (!sheet.open) finishForm(false); // fechado pela tecla Esc ou pelo botão voltar
  });
  sheet.addEventListener('click', function (e) { if (e.target === sheet) closeForm(); });

  function onScoreInput() {
    var a = toNum($('#fScoreFor').value), b = toNum($('#fScoreAgainst').value);
    if (a != null && b != null) setResult(a > b ? 'V' : a < b ? 'D' : 'E');
    if (b != null && draft.concededAuto) setStepper('goalsConceded', b);
  }

  function readForm() {
    var rating = toNum($('#fRating').value);
    if (rating != null) rating = Math.max(0, Math.min(30, Math.round(rating)));
    return {
      date: $('#fDate').value,
      time: $('#fTime').value || null,
      venue: $('#fVenue').value.trim() || null,
      fieldType: $('#fField').value.trim() || null,
      opponentKeeper: $('#fOpp').value.trim() || null,
      scoreFor: toNum($('#fScoreFor').value),
      scoreAgainst: toNum($('#fScoreAgainst').value),
      result: draft.result || null,
      goalsScored: draft.goalsScored,
      goalsConceded: draft.goalsConceded,
      saves: draft.saves,
      rating: rating,
      notes: $('#fNotes').value.trim() || null,
      photoIds: draft.photoIds.slice()
    };
  }

  /* Jogo duplicado: mesma data e mesmo horário (sem horário, não bloqueia). */
  var dupId = null;

  function currentDuplicate() {
    var data = readForm();
    if (editingId) {
      var original = games.filter(function (g) { return g.id === editingId; })[0];
      // Só confere se a data ou o horário mudaram em relação ao que já estava salvo.
      if (original && original.date === data.date && (original.time || '') === (data.time || '')) return null;
    }
    return GDAGames.findDuplicate(games, data, editingId);
  }
  function showDup(dup, scroll) {
    dupId = dup.id;
    $('#dupText').textContent = 'Já existe um jogo em ' + GDAGames.describeSlot(dup) +
      (dup.venue ? ' (' + dup.venue + ')' : '') + '. Não dá para cadastrar dois jogos na mesma data e horário.';
    var box = $('#dupAlert');
    box.hidden = false;
    if (scroll) {
      box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
      box.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }
  function hideDup() { dupId = null; $('#dupAlert').hidden = true; }
  function liveDupCheck(scroll) {
    var dup = currentDuplicate();
    if (dup) showDup(dup, scroll); else hideDup();
  }
  $('#fDate').addEventListener('input', function () { liveDupCheck(false); });
  $('#fTime').addEventListener('input', function () { liveDupCheck(false); });
  $('#dupOpen').addEventListener('click', function () {
    var id = dupId; closeForm(); if (id) openForm(id);
  });

  $('#form').addEventListener('submit', function (e) {
    e.preventDefault();
    var data = readForm();
    if (!data.date) { toast('Informe a data do jogo.'); return; }
    var dup = currentDuplicate();
    if (dup) { showDup(dup, true); return; }
    if (editingId) {
      games = games.map(function (g) { return g.id === editingId ? Object.assign({}, g, data) : g; });
    } else {
      data.id = uid();
      games.push(data);
    }
    persist();
    draft.originalPhotoIds.filter(function (id) { return draft.photoIds.indexOf(id) < 0; })
      .forEach(function (id) { GDAPhotos.remove(id); });
    closeForm(true);
    render();
    toast(editingId ? 'Jogo atualizado.' : 'Jogo salvo.');
  });

  $('#btnDelete').addEventListener('click', function () {
    if (!editingId || !confirm('Excluir este jogo?')) return;
    var gone = games.filter(function (g) { return g.id === editingId; })[0];
    ((gone && gone.photoIds) || []).forEach(function (id) { GDAPhotos.remove(id); });
    games = games.filter(function (g) { return g.id !== editingId; });
    persist(); closeForm(); render(); toast('Jogo excluído.');
  });

  $('#btnClose').addEventListener('click', function () { closeForm(); });
  $('#fScoreFor').addEventListener('input', onScoreInput);
  $('#fScoreAgainst').addEventListener('input', onScoreInput);
  $('#fResult').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    setResult(draft.result === b.dataset.v ? null : b.dataset.v);
  });
  document.querySelectorAll('.stepper').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var key = el.dataset.key, cur = draft[key], d = +b.dataset.d;
      if (cur == null && d < 0) return;
      if (key === 'goalsConceded') draft.concededAuto = false;
      setStepper(key, Math.max(0, (cur == null ? 0 : cur) + d));
    });
  });
  $('#fieldTypes').innerHTML = FIELD_TYPES.map(function (t) { return '<option value="' + esc(t) + '">'; }).join('');

  /* ---------- Lista: cliques ---------- */
  $('#list').addEventListener('click', function (e) {
    var c = e.target.closest('.card'); if (c) openForm(c.dataset.id);
  });
  $('#list').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var c = e.target.closest('.card'); if (c) { e.preventDefault(); openForm(c.dataset.id); }
  });
  $('#chips').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    filter = b.dataset.f; renderChips(); renderList();
  });
  $('#fab').addEventListener('click', function () { openForm(); });

  /* ---------- Imagem para o Instagram ---------- */
  var shareSheet = $('#shareSheet'), share = { game: null, format: 'story', picked: [], canvas: null, seq: 0 };

  function updateInstagramField(g) {
    var field = $('#igField');
    field.hidden = !g;
    if (!g) return;
    var ready = isNum(g.scoreFor) && isNum(g.scoreAgainst);
    $('#btnStory').disabled = !ready; $('#btnFeed').disabled = !ready;
    $('#igHint').textContent = ready ? 'Usa o jogo como está salvo. Salve antes para incluir mudanças.'
                                     : 'Preencha o placar e salve o jogo para gerar a imagem.';
  }

  function openShare(format) {
    var g = games.filter(function (x) { return x.id === editingId; })[0];
    if (!g) return;
    share.game = g; share.format = format;
    share.picked = (g.photoIds || []).slice(0, 1); // começa com a capa
    paintShare(true);
    shareSheet.showModal();
  }

  async function paintShare(rebuildPicker) {
    var ids = share.game.photoIds || [], my = ++share.seq;
    $$('#shFormat button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.f === share.format ? 'true' : 'false'); });
    $('#shPhotosField').hidden = !ids.length;
    if (rebuildPicker) {
      $('#shPhotos').innerHTML = ids.map(function (id) {
        return '<button type="button" class="ph pick" data-id="' + esc(id) + '" aria-pressed="false"><img data-photo="' + esc(id) + '" alt=""><span class="ph-num" hidden></span></button>';
      }).join('');
      hydratePhotos($('#shPhotos'));
    }
    $$('#shPhotos .ph').forEach(function (b) {
      var n = share.picked.indexOf(b.dataset.id), tag = b.querySelector('.ph-num');
      b.setAttribute('aria-pressed', n >= 0 ? 'true' : 'false');
      tag.hidden = n < 0; tag.textContent = n + 1;
    });
    $('#shCount').textContent = ids.length ? '(' + share.picked.length + ' de ' + GDAShareImage.MAX_PHOTOS + ')' : '';

    var bitmaps = [];
    for (var i = 0; i < share.picked.length; i++) {
      try {
        var rec = await GDAPhotos.get(share.picked[i]);
        if (rec) bitmaps.push(await GDAPhotos.decodeImage(rec.blob));
      } catch (e) { console.warn('Foto fora da imagem:', e && (e.message || e)); }
    }
    var canvas = await GDAShareImage.render(share.game, { format: share.format, bitmaps: bitmaps });
    if (my !== share.seq) return; // escolha mudou enquanto desenhava
    share.canvas = canvas;
    var view = $('#shPreview'); view.width = canvas.width; view.height = canvas.height;
    view.getContext('2d').drawImage(canvas, 0, 0);
  }

  $('#btnStory').addEventListener('click', function () { openShare('story'); });
  $('#btnFeed').addEventListener('click', function () { openShare('feed'); });
  $('#shClose').addEventListener('click', function () { shareSheet.close(); });
  $('#shFormat').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.dataset.f === share.format) return;
    share.format = b.dataset.f; paintShare(false);
  });
  $('#shPhotos').addEventListener('click', function (e) {
    var b = e.target.closest('.ph'); if (!b) return;
    var id = b.dataset.id, at = share.picked.indexOf(id);
    if (at >= 0) share.picked.splice(at, 1);
    else if (share.picked.length >= GDAShareImage.MAX_PHOTOS) { toast('No máximo ' + GDAShareImage.MAX_PHOTOS + ' fotos na imagem.'); return; }
    else share.picked.push(id);
    paintShare(false);
  });

  async function currentFile() {
    if (!share.canvas) await paintShare(false);
    var blob = await GDAShareImage.toBlob(share.canvas);
    return new File([blob], GDAShareImage.fileName(share.game, share.format), { type: 'image/png' });
  }
  function saveFile(file) {
    var a = document.createElement('a'), u = URL.createObjectURL(file);
    a.href = u; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }
  $('#shDownload').addEventListener('click', async function () {
    try { saveFile(await currentFile()); toast('Imagem baixada.'); } catch (e) { toast('Não consegui gerar a imagem.'); }
  });
  $('#shShare').addEventListener('click', async function () {
    try {
      var file = await currentFile();
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file] }); }
        catch (e) { if (e && e.name === 'AbortError') return; throw e; }
      } else { saveFile(file); toast('Este aparelho não abre o menu de compartilhar. A imagem foi baixada.'); }
    } catch (e) { toast('Não consegui compartilhar. Tente "Baixar".'); }
  });

  /* ---------- Fotos do jogo ---------- */
  var viewer = $('#viewer'), viewerIdx = 0;

  function renderPhotoGrid() {
    var ids = draft.photoIds;
    $('#photoCount').textContent = ids.length ? '(' + ids.length + ')' : '';
    $('#photoGrid').innerHTML = ids.map(function (id, i) {
      return '<button type="button" class="ph" data-i="' + i + '" aria-label="Foto ' + (i + 1) + '">' +
        '<img data-photo="' + esc(id) + '" alt="">' + (i === 0 ? '<span class="ph-badge">Capa</span>' : '') + '</button>';
    }).join('');
    hydratePhotos($('#photoGrid'));
  }

  async function addPhotos(files) {
    files = Array.prototype.slice.call(files);
    if (!files.length) return;
    if (!GDAPhotos.available) { toast('Este navegador não consegue guardar fotos.'); return; }
    var ok = 0, failed = 0;
    try {
      for (var i = 0; i < files.length; i++) {
        busy('Preparando foto ' + (i + 1) + ' de ' + files.length + '…', i / files.length);
        try {
          var id = await GDAPhotos.add(files[i]);
          draft.photoIds.push(id); draft.newPhotoIds.push(id); ok++;
        } catch (err) { console.warn('Foto não adicionada:', err && (err.message || err)); failed++; }
      }
    } finally { unbusy(); }
    renderPhotoGrid();
    if (ok && navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
    toast(failed ? ok + ' foto(s) adicionada(s) · ' + failed + ' não deu para ler.' : ok + (ok === 1 ? ' foto adicionada.' : ' fotos adicionadas.'));
  }

  $('#btnShoot').addEventListener('click', function () { $('#fileShoot').click(); });
  $('#btnGallery').addEventListener('click', function () { $('#fileGallery').click(); });
  ['#fileShoot', '#fileGallery'].forEach(function (sel) {
    $(sel).addEventListener('change', function (e) {
      var files = e.target.files; var list = Array.prototype.slice.call(files); e.target.value = '';
      addPhotos(list);
    });
  });
  $('#photoGrid').addEventListener('click', function (e) {
    var b = e.target.closest('.ph'); if (!b) return;
    viewerIdx = +b.dataset.i; paintViewer(); viewer.showModal();
  });

  async function paintViewer() {
    var ids = draft.photoIds;
    if (!ids.length) { if (viewer.open) viewer.close(); return; }
    viewerIdx = Math.max(0, Math.min(viewerIdx, ids.length - 1));
    $('#vCount').textContent = (viewerIdx + 1) + ' de ' + ids.length + (viewerIdx === 0 ? ' · capa' : '');
    $('#vBefore').disabled = viewerIdx === 0;
    $('#vAfter').disabled = viewerIdx === ids.length - 1;
    var u = await GDAPhotos.url(ids[viewerIdx], 'blob');
    if (u) $('#vImg').src = u;
  }
  function moveViewer(d) {
    var ids = draft.photoIds, j = viewerIdx + d;
    if (j < 0 || j >= ids.length) return;
    var t = ids[viewerIdx]; ids[viewerIdx] = ids[j]; ids[j] = t;
    viewerIdx = j; paintViewer(); renderPhotoGrid();
  }
  $('#vBefore').addEventListener('click', function () { moveViewer(-1); });
  $('#vAfter').addEventListener('click', function () { moveViewer(1); });
  $('#vClose').addEventListener('click', function () { viewer.close(); });
  $('#vRemove').addEventListener('click', function () {
    var id = draft.photoIds[viewerIdx];
    if (!id || !confirm('Remover esta foto?')) return;
    draft.photoIds.splice(viewerIdx, 1);
    var n = draft.newPhotoIds.indexOf(id);
    if (n >= 0) { draft.newPhotoIds.splice(n, 1); GDAPhotos.remove(id); } // nunca foi salva: apaga já
    // Se já estava salva, só some do jogo ao tocar em Salvar.
    paintViewer(); renderPhotoGrid();
  });

  /* ---------- Leitura de prints (OCR no próprio aparelho) ---------- */
  var worker = null, onProgress = function () {};

  function loadTesseract() {
    return new Promise(function (resolve, reject) {
      if (window.Tesseract) return resolve();
      var s = document.createElement('script');
      s.src = TESSERACT_SRC;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('offline')); };
      document.head.appendChild(s);
    });
  }

  async function getWorker() {
    if (worker) return worker;
    await loadTesseract();
    worker = await Tesseract.createWorker('por', 1, {
      logger: function (m) { if (m.status === 'recognizing text') onProgress(m.progress); }
    });
    await worker.setParameters({ tessedit_pageseg_mode: '6' });
    return worker;
  }

  async function closeWorker() {
    if (!worker) return;
    try { await worker.terminate(); } catch (e) { /* ignora */ }
    worker = null;
  }

  var decodeImage = GDAPhotos.decodeImage;

  // Prints do app são escuros: converte para cinza e inverte, o que melhora muito a leitura.
  async function prepareImage(file) {
    var bmp = await decodeImage(file);
    var bw = bmp.naturalWidth || bmp.width, bh = bmp.naturalHeight || bmp.height;
    var scale = Math.max(1, Math.min(3, 2000 / bw));
    var w = Math.round(bw * scale), h = Math.round(bh * scale);
    var canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0, w, h);
    var img = ctx.getImageData(0, 0, w, h), d = img.data, sum = 0, i;
    for (i = 0; i < d.length; i += 4) {
      var l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = d[i + 1] = d[i + 2] = l; sum += l;
    }
    if (sum / (d.length / 4) < 128) {
      for (i = 0; i < d.length; i += 4) d[i] = d[i + 1] = d[i + 2] = 255 - d[i];
    }
    ctx.putImageData(img, 0, 0);
    return canvas;
  }

  async function readPrint(file) {
    var canvas = await prepareImage(file);
    var w = await getWorker();
    var res = await w.recognize(canvas);
    return GDAParser.parsePrintText(res.data.text);
  }

  function ocrError(e) {
    console.warn('Leitura do print falhou:', e && (e.message || e));
    toast(e && e.message === 'offline'
      ? 'Preciso de internet para carregar o leitor de prints (só na primeira vez).'
      : 'Não consegui ler esse print.');
  }

  // Um print dentro do formulário
  $('#btnScan').addEventListener('click', function () { $('#filePrint').click(); });
  $('#filePrint').addEventListener('change', async function (e) {
    var file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    busy('Lendo print…', 0);
    onProgress = function (p) { busy('Lendo print…', p); };
    try {
      var r = await readPrint(file);
      var found = [];
      if (r.date) { $('#fDate').value = r.date; found.push('data'); }
      if (r.time) { $('#fTime').value = r.time; found.push('horário'); }
      if (r.venue) { $('#fVenue').value = r.venue; found.push('quadra'); }
      if (r.fieldType) { $('#fField').value = r.fieldType; found.push('tipo de campo'); }
      if (r.venue) applyVenue();
      if (r.rating != null) { $('#fRating').value = r.rating; found.push('nota'); }
      toast(found.length ? 'Li: ' + found.join(', ') + '. Confira os dados.' : 'Não achei dados nesse print. Preencha manualmente.');
      liveDupCheck(true);
    } catch (err) { ocrError(err); }
    finally { unbusy(); closeWorker(); }
  });

  // Vários prints de uma vez: cria os jogos como "pendentes" para completar depois
  $('#btnImport').addEventListener('click', function () { $('#filePrints').click(); });
  $('#filePrints').addEventListener('change', async function (e) {
    var files = Array.prototype.slice.call(e.target.files); e.target.value = '';
    if (!files.length) return;
    var added = 0, dup = 0, failed = 0;
    try {
      for (var i = 0; i < files.length; i++) {
        var label = 'Lendo print ' + (i + 1) + ' de ' + files.length + '…';
        busy(label, i / files.length);
        onProgress = function (p) { busy(label, (i + p) / files.length); };
        var r;
        try { r = await readPrint(files[i]); } catch (err) { if (err && err.message === 'offline') throw err; failed++; continue; }
        if (!r.date) { failed++; continue; }
        var vm = r.venue ? GDAGames.matchVenue(games, r.venue) : null;
        var g = { id: uid(), date: r.date, time: r.time, venue: vm ? vm.name : r.venue, fieldType: r.fieldType || (vm && vm.fieldType) || null, rating: r.rating,
                  opponentKeeper: null, scoreFor: null, scoreAgainst: null, result: null,
                  goalsScored: null, goalsConceded: null, saves: null, notes: null };
        if (GDAGames.findDuplicate(games, g)) { dup++; continue; }
        games.push(g); added++;
      }
      persist(); render();
      var parts = [added + (added === 1 ? ' jogo adicionado' : ' jogos adicionados')];
      if (dup) parts.push(dup + ' já existia' + (dup === 1 ? '' : 'm'));
      if (failed) parts.push(failed + ' não deu para ler');
      toast(parts.join(' · ') + (added ? '. Toque para completar.' : '.'));
      if (added) { filter = 'P'; render(); }
    } catch (err) { persist(); render(); ocrError(err); }
    finally { unbusy(); closeWorker(); }
  });

  /* ---------- Menu: backup e exportação ---------- */
  var menu = $('#menu');
  $('#btnMenu').addEventListener('click', function () { menu.showModal(); });
  $('#btnMenuClose').addEventListener('click', function () { menu.close(); });
  menu.addEventListener('click', function (e) { if (e.target === menu) menu.close(); });

  function download(name, text, type) {
    var url = URL.createObjectURL(new Blob([text], { type: type }));
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }
  function stamp() { return new Date().toISOString().slice(0, 10); }

  $('#mExportJson').addEventListener('click', function () {
    download('diario-do-goleiro-' + stamp() + '.json', JSON.stringify(games, null, 2), 'application/json');
    menu.close();
    var hasPhotos = games.some(function (g) { return g.photoIds && g.photoIds.length; });
    toast(hasPhotos ? 'Backup exportado, sem as fotos. Use "com fotos" para incluí-las.' : 'Backup exportado.');
  });
  $('#mExportJsonPhotos').addEventListener('click', async function () {
    menu.close();
    var ids = [];
    games.forEach(function (g) { (g.photoIds || []).forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); }); });
    try {
      var fotos = [];
      for (var i = 0; i < ids.length; i++) {
        busy('Preparando foto ' + (i + 1) + ' de ' + ids.length + '…', i / Math.max(1, ids.length));
        var dados = await GDAPhotos.toDataURL(ids[i]);
        if (dados) fotos.push({ id: ids[i], dados: dados });
      }
      var text = JSON.stringify({ formato: 'diario-do-goleiro', versao: 2, jogos: games, fotos: fotos });
      download('diario-do-goleiro-com-fotos-' + stamp() + '.json', text, 'application/json');
      toast('Backup com ' + fotos.length + ' foto(s) exportado (' + (text.length / 1048576).toFixed(1).replace('.', ',') + ' MB).');
    } catch (err) { toast('Não consegui preparar o backup com fotos.'); }
    finally { unbusy(); }
  });
  $('#mExportCsv').addEventListener('click', function () {
    var head = ['Data', 'Horário', 'Quadra', 'Tipo de campo', 'Goleiro adversário', 'Placar', 'Resultado', 'Gols marcados', 'Gols sofridos', 'Defesas', 'Nota do jogo', 'Observações'];
    var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
    var rows = games.slice().sort(function (a, b) { return sortKey(a) < sortKey(b) ? -1 : 1; }).map(function (g) {
      var d = g.date ? g.date.split('-').reverse().join('/') : '';
      var score = isNum(g.scoreFor) && isNum(g.scoreAgainst) ? g.scoreFor + 'x' + g.scoreAgainst : '';
      return [d, g.time, g.venue, g.fieldType, g.opponentKeeper, score, g.result ? RESULT_LABEL[g.result] : '',
              g.goalsScored, g.goalsConceded, g.saves, g.rating, g.notes].map(q).join(';');
    });
    download('diario-do-goleiro-' + stamp() + '.csv', '﻿' + [head.map(q).join(';')].concat(rows).join('\r\n'), 'text/csv');
    menu.close(); toast('Planilha exportada.');
  });
  $('#mImportJson').addEventListener('click', function () { $('#fileBackup').click(); });
  $('#fileBackup').addEventListener('change', async function (e) {
    var file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    try {
      var data = JSON.parse(await file.text());
      var list = Array.isArray(data) ? data : (data && Array.isArray(data.jogos) ? data.jogos : null);
      if (!list) throw new Error('formato');
      var fotos = data && Array.isArray(data.fotos) ? data.fotos : [];
      list = list.filter(function (g) { return g && typeof g.date === 'string'; });
      if (!list.length) throw new Error('vazio');
      if (!confirm('Importar ' + list.length + ' jogo(s)' + (fotos.length ? ' e ' + fotos.length + ' foto(s)' : '') +
                   '? Jogos de uma data e horário que já existem serão pulados.')) return;

      var working = games.slice(), imported = [], skipped = 0;
      list.forEach(function (g) {
        g.id = g.id || uid();
        if (GDAGames.findDuplicate(working, g, g.id)) { skipped++; return; }
        var at = working.findIndex(function (x) { return x.id === g.id; });
        if (at >= 0) working[at] = g; else working.push(g);
        imported.push(g);
      });

      // Fotos: só as dos jogos importados; as que já existem neste aparelho são mantidas.
      var dadosPorId = {};
      fotos.forEach(function (f) { if (f && f.id && f.dados) dadosPorId[f.id] = f.dados; });
      var photoCount = 0;
      busy('Importando…', 0);
      for (var i = 0; i < imported.length; i++) {
        var ids = Array.isArray(imported[i].photoIds) ? imported[i].photoIds : [], keep = [];
        for (var k = 0; k < ids.length; k++) {
          if (GDAPhotos.available && await GDAPhotos.exists(ids[k])) { keep.push(ids[k]); continue; }
          if (GDAPhotos.available && dadosPorId[ids[k]]) {
            try { await GDAPhotos.addDataUrl(dadosPorId[ids[k]], ids[k]); keep.push(ids[k]); photoCount++; }
            catch (err) { console.warn('Foto do backup não importada:', err && (err.message || err)); }
          }
        }
        imported[i].photoIds = keep;
        busy('Importando…', (i + 1) / imported.length);
      }
      games = working;
      persist(); menu.close(); render();
      toast(imported.length + ' jogo(s) importado(s)' + (photoCount ? ' com ' + photoCount + ' foto(s)' : '') +
            (skipped ? ' · ' + skipped + ' já existia' + (skipped === 1 ? '' : 'm') : '') + '.');
    } catch (err) { toast('Esse arquivo não parece um backup válido.'); }
    finally { unbusy(); }
  });

  /* ---------- Instalação e compartilhamento ---------- */
  var DISMISS_KEY = 'diario-goleiro:install-dismissed';
  var deferredPrompt = null;
  var installSheet = $('#installSheet');

  function isStandalone() {
    return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  }
  function platform() {
    var ua = navigator.userAgent || '';
    if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
    if (/android/i.test(ua)) return 'android';
    return 'desktop';
  }
  function dismissed() { try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return false; } }

  function updateInstallBanner() {
    $('#installBanner').hidden = isStandalone() || dismissed() || platform() === 'desktop';
  }

  function fillInstallSheet() {
    var p = platform(), steps, intro, note = '';
    if (isStandalone()) {
      intro = 'O app já está instalado neste aparelho. 🎉';
      steps = [];
    } else if (p === 'ios') {
      intro = 'No iPhone, a instalação é feita pelo Safari.';
      steps = ['Abra este endereço no <b>Safari</b>.',
               'Toque no botão <b>Compartilhar</b> (o quadrado com a seta para cima).',
               'Role a lista e toque em <b>Adicionar à Tela de Início</b>.',
               'Toque em <b>Adicionar</b>. O ícone aparece na tela inicial.'];
      note = 'Se o botão Compartilhar não mostrar essa opção, você provavelmente está em outro navegador. Abra o endereço no Safari.';
    } else if (p === 'android') {
      intro = 'Funciona no Chrome, Brave, Edge e Samsung Internet.';
      steps = ['Toque no menu <b>⋮</b> do navegador (três pontinhos).',
               'Escolha <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>.',
               'Confirme. O ícone aparece na tela inicial.'];
      note = 'Dica: se você usa o Brave, desligue o Shields neste site caso a leitura de print não funcione.';
    } else {
      intro = 'O app foi feito para o celular. Abra este endereço no seu celular para instalar.';
      steps = ['No celular, abra: <b>' + esc(location.href.split('#')[0]) + '</b>',
               'Siga o passo a passo que aparece lá (menu do navegador → Instalar aplicativo).'];
      note = 'No computador, o Chrome também oferece um ícone de instalar na barra de endereço.';
    }
    $('#installIntro').textContent = intro;
    $('#installSteps').innerHTML = steps.map(function (t) { return '<li><span>' + t + '</span></li>'; }).join('');
    $('#installNote').textContent = note;
    $('#installNote').hidden = !note;
    $('#installNow').hidden = !deferredPrompt || isStandalone();
  }

  function openInstall() {
    fillInstallSheet();
    var menuEl = $('#menu'); if (menuEl.open) menuEl.close();
    installSheet.showModal();
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferredPrompt = e;
    if (installSheet.open) fillInstallSheet();
  });
  window.addEventListener('appinstalled', function () {
    deferredPrompt = null; updateInstallBanner();
    if (installSheet.open) installSheet.close();
    toast('App instalado! Abra pelo ícone na tela inicial.');
  });

  $('#installGo').addEventListener('click', openInstall);
  $('#mInstall').addEventListener('click', openInstall);
  $('#installClose').addEventListener('click', function () { installSheet.close(); });
  installSheet.addEventListener('click', function (e) { if (e.target === installSheet) installSheet.close(); });
  $('#installX').addEventListener('click', function () {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) { /* ignora */ }
    updateInstallBanner();
    toast('Você pode instalar depois pelo menu ⋯.');
  });
  $('#installNow').addEventListener('click', async function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (e) { /* ignora */ }
    deferredPrompt = null; fillInstallSheet();
  });
  $('#shareApp').addEventListener('click', async function () {
    var url = location.href.split('#')[0];
    var data = { title: 'Diário do Goleiro', text: 'Registre os resultados dos seus jogos de goleiro:', url: url };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(url);
      toast('Link copiado!');
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      toast('Copie o endereço na barra do navegador: ' + url);
    }
  });

  /* ---------- Início ---------- */
  render();
  updateInstallBanner();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
