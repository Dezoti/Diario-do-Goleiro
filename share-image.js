/*
 * Imagem para o Instagram: story (1080×1920) e feed (1080×1350), desenhadas em <canvas>.
 * Na imagem entram só: foto(s) escolhida(s), placar, nome da quadra, resultado e os dois logotipos.
 * As funções de layout são puras (testadas no Node); o desenho roda no navegador (window.GDAShareImage).
 */
(function (root) {
  'use strict';

  var FORMATS = {
    story: { w: 1080, h: 1920, label: 'Story', safeTop: 290, safeBottom: 380 }, // faixas cobertas pela interface do Instagram
    feed: { w: 1080, h: 1350, label: 'Feed', safeTop: 60, safeBottom: 80 }
  };
  var MAX_PHOTOS = 4;
  var COLORS = { V: '#3ddc84', E: '#ffc233', D: '#ff5d5d' };
  var LABELS = { V: 'VITÓRIA', E: 'EMPATE', D: 'DERROTA' };
  var FONT = '"GDOswald", "Arial Narrow", Impact, sans-serif';

  function isNum(n) { return typeof n === 'number' && isFinite(n); }

  // O resultado segue o placar. Sem placar completo, não há selo.
  function resultFromScore(g) {
    if (!g || !isNum(g.scoreFor) || !isNum(g.scoreAgainst)) return null;
    var k = g.scoreFor > g.scoreAgainst ? 'V' : g.scoreFor < g.scoreAgainst ? 'D' : 'E';
    return { key: k, label: LABELS[k], color: COLORS[k] };
  }

  // Recorte "cover": preenche a caixa inteira sem deformar a foto.
  function coverRect(iw, ih, bx, by, bw, bh) {
    var k = Math.max(bw / iw, bh / ih);
    var sw = bw / k, sh = bh / k;
    return { sx: (iw - sw) / 2, sy: (ih - sh) / 2, sw: sw, sh: sh, dx: bx, dy: by, dw: bw, dh: bh };
  }

  // Divide a tela para 1 a 4 fotos (com 2 px de respiro entre elas).
  function photoSlots(n, W, H) {
    var g = 4, hw = Math.floor((W - g) / 2), hh = Math.floor((H - g) / 2);
    n = Math.max(0, Math.min(MAX_PHOTOS, n | 0));
    if (n === 0) return [];
    if (n === 1) return [{ x: 0, y: 0, w: W, h: H }];
    if (n === 2) return [{ x: 0, y: 0, w: W, h: hh }, { x: 0, y: hh + g, w: W, h: H - hh - g }];
    if (n === 3) return [{ x: 0, y: 0, w: W, h: hh }, { x: 0, y: hh + g, w: hw, h: H - hh - g }, { x: hw + g, y: hh + g, w: W - hw - g, h: H - hh - g }];
    return [{ x: 0, y: 0, w: hw, h: hh }, { x: hw + g, y: 0, w: W - hw - g, h: hh },
            { x: 0, y: hh + g, w: hw, h: H - hh - g }, { x: hw + g, y: hh + g, w: W - hw - g, h: H - hh - g }];
  }

  // Caixa de um logotipo dentro de uma área, mantendo a proporção.
  function fitBox(iw, ih, maxW, maxH) {
    var k = Math.min(maxW / iw, maxH / ih);
    return { w: Math.round(iw * k), h: Math.round(ih * k) };
  }

  function fileName(g, format) {
    return 'jogo-' + (g && g.date ? g.date : 'sem-data') + '-' + format + '.png';
  }

  var api = { FORMATS: FORMATS, MAX_PHOTOS: MAX_PHOTOS, resultFromScore: resultFromScore, coverRect: coverRect,
              photoSlots: photoSlots, fitBox: fitBox, fileName: fileName };
  if (typeof document === 'undefined') {
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GDAShareImage = api;
    return;
  }

  /* ---------- Recursos (fonte e logotipos) ---------- */
  var fontReady = null;
  function loadFont() {
    if (fontReady) return fontReady;
    fontReady = Promise.all([
      new FontFace('GDOswald', 'url(assets/fonts/oswald-700.woff2)', { weight: '700' }).load(),
      new FontFace('GDOswald', 'url(assets/fonts/oswald-500.woff2)', { weight: '500' }).load()
    ]).then(function (fs) { fs.forEach(function (f) { document.fonts.add(f); }); }).catch(function () {});
    return fontReady;
  }

  var logoCache = {};
  function loadImage(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }
  // Procura o logotipo em PNG e depois em SVG. Sem arquivo, devolve null (e o texto entra no lugar).
  function loadLogo(name) {
    if (!logoCache[name]) {
      logoCache[name] = loadImage('assets/logos/' + name + '.png').then(function (img) {
        return img || loadImage('assets/logos/' + name + '.svg');
      });
    }
    return logoCache[name];
  }

  /* ---------- Desenho ---------- */
  function shrinkFont(ctx, text, weight, size, maxW) {
    while (size > 24) {
      ctx.font = weight + ' ' + size + 'px ' + FONT;
      if (ctx.measureText(text).width <= maxW) break;
      size -= 4;
    }
    return size;
  }
  function wrapLines(ctx, text, maxW, maxLines) {
    var words = String(text).split(/\s+/), lines = [], cur = '';
    words.forEach(function (w) {
      var t = cur ? cur + ' ' + w : w;
      if (cur && ctx.measureText(t).width > maxW) { lines.push(cur); cur = w; } else cur = t;
    });
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      var last = lines[maxLines - 1];
      while (last.length > 1 && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1);
      lines[maxLines - 1] = last.replace(/\s+$/, '') + '…';
    }
    return lines;
  }

  function drawBackground(ctx, W, H) {
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#0f3d22'); g.addColorStop(1, '#04140b');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, W * 0.26, 0, Math.PI * 2); ctx.stroke();
  }
  function drawPhotos(ctx, W, H, bitmaps) {
    var slots = photoSlots(bitmaps.length, W, H);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    slots.forEach(function (s, i) {
      var b = bitmaps[i], r = coverRect(b.width, b.height, s.x, s.y, s.w, s.h);
      ctx.drawImage(b, r.sx, r.sy, r.sw, r.sh, r.dx, r.dy, r.dw, r.dh);
    });
  }
  function drawShade(ctx, W, H, fmt) {
    var top = ctx.createLinearGradient(0, 0, 0, fmt.safeTop + 260);
    top.addColorStop(0, 'rgba(0,0,0,.72)'); top.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = top; ctx.fillRect(0, 0, W, fmt.safeTop + 260);
    var from = H * 0.38, bot = ctx.createLinearGradient(0, from, 0, H);
    bot.addColorStop(0, 'rgba(0,0,0,0)'); bot.addColorStop(0.62, 'rgba(0,0,0,.78)'); bot.addColorStop(1, 'rgba(0,0,0,.92)');
    ctx.fillStyle = bot; ctx.fillRect(0, from, W, H - from);
  }
  function drawLogo(ctx, img, fallbackText, cx, cy, maxW, maxH) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 18;
    if (img) {
      var b = fitBox(img.naturalWidth || img.width, img.naturalHeight || img.height, maxW, maxH);
      ctx.drawImage(img, cx - b.w / 2, cy - b.h / 2, b.w, b.h);
    } else {
      var size = shrinkFont(ctx, fallbackText, 700, 44, maxW);
      ctx.font = '700 ' + size + 'px ' + FONT; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(fallbackText, cx, cy);
    }
    ctx.restore();
  }

  // game: jogo salvo. opts: { format: 'story'|'feed', bitmaps: [ImageBitmap|HTMLImageElement] }
  async function render(game, opts) {
    var fmt = FORMATS[opts.format] || FORMATS.story, W = fmt.w, H = fmt.h;
    var bitmaps = (opts.bitmaps || []).slice(0, MAX_PHOTOS);
    var res = await Promise.all([loadFont(), loadLogo('goleiro-de-aluguel'), loadLogo('diario-do-goleiro')]);
    var logoA = res[1], logoB = res[2];

    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var ctx = c.getContext('2d');
    if (bitmaps.length) drawPhotos(ctx, W, H, bitmaps); else drawBackground(ctx, W, H);
    drawShade(ctx, W, H, fmt);

    // Logotipos no topo, dentro da área livre do Instagram.
    var logoY = fmt.safeTop + 70;
    drawLogo(ctx, logoA, 'GOLEIRO DE ALUGUEL', W * 0.28, logoY, 400, 120);
    drawLogo(ctx, logoB, 'DIÁRIO DO GOLEIRO', W * 0.72, logoY, 400, 120);

    // Bloco inferior: resultado, placar e quadra, terminando acima da faixa do rodapé.
    var res2 = resultFromScore(game), bottom = H - fmt.safeBottom;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 24;

    var venue = (game.venue || '').toUpperCase();
    var y = bottom;
    if (venue) {
      ctx.font = '500 56px ' + FONT;
      var lines = wrapLines(ctx, venue, W - 160, 2);
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      for (var i = lines.length - 1; i >= 0; i--) { ctx.fillText(lines[i], W / 2, y); y -= 70; }
      y -= 24;
    }
    var score = (isNum(game.scoreFor) && isNum(game.scoreAgainst)) ? game.scoreFor + ' × ' + game.scoreAgainst : '';
    if (score) {
      var ss = shrinkFont(ctx, score, 700, 330, W - 120);
      ctx.font = '700 ' + ss + 'px ' + FONT; ctx.fillStyle = '#fff';
      ctx.fillText(score, W / 2, y); y -= ss * 0.86 + 30;
    }
    if (res2) {
      var ls = 96;
      ctx.font = '700 ' + ls + 'px ' + FONT; ctx.fillStyle = res2.color;
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '12px';
      ctx.fillText(res2.label, W / 2, y);
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px';
    }
    ctx.shadowBlur = 0;
    return c;
  }

  function toBlob(canvas) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error('imagem')); }, 'image/png');
    });
  }

  api.render = render;
  api.toBlob = toBlob;
  api.loadFont = loadFont;
  root.GDAShareImage = api;
})(typeof window !== 'undefined' ? window : globalThis);
