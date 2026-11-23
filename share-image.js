/*
 * Imagem para o Instagram: story (1080×1920) e feed (1080×1350), desenhadas em <canvas>.
 * Na imagem entram só: foto(s) escolhida(s), placar, nome da quadra, resultado e os dois logotipos.
 * As funções de layout são puras (testadas no Node); o desenho roda no navegador (window.GDAShareImage).
 */
(function (root) {
  'use strict';

  var FORMATS = {
    story: { w: 1080, h: 1920, label: 'Story', safeTop: 250, safeBottom: 250, pad: 0 }, // margem de 250 px em cima e embaixo (interface do Instagram)
    feed: { w: 1080, h: 1350, label: 'Feed', safeTop: 60, safeBottom: 80, pad: 30 }
  };
  var MAX_PHOTOS = 4;
  var COLORS = { V: '#3ddc84', E: '#ffc233', D: '#ff5d5d' };
  var LABELS = { V: 'VITÓRIA', E: 'EMPATE', D: 'DERROTA' };
  var FONT = '"GDOswald", "Arial Narrow", Impact, sans-serif';
  var MARKER = '"GDMarker", "Marker Felt", "Comic Sans MS", cursive';

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
      new FontFace('GDOswald', 'url(assets/fonts/oswald-500.woff2)', { weight: '500' }).load(),
      new FontFace('GDMarker', 'url(assets/fonts/permanent-marker.woff2)', { weight: '400' }).load()
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
      }).then(function (img) { return img && { img: img, box: opaqueBounds(img) }; });
    }
    return logoCache[name];
  }
  // Os arquivos de logo costumam ter margem transparente; mede só a parte desenhada para o tamanho sair certo.
  function opaqueBounds(img) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height, full = { x: 0, y: 0, w: w, h: h };
    try {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var x = c.getContext('2d'); x.drawImage(img, 0, 0);
      var d = x.getImageData(0, 0, w, h).data, x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
        if (d[(yy * w + xx) * 4 + 3] > 16) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
      }
      return x1 < 0 ? full : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    } catch (e) { return full; }
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
  // Sombras só onde há texto ou logo: topo (placar) e canto inferior esquerdo (logotipos).
  function drawShade(ctx, W, H, topEnd, logoTop) {
    var top = ctx.createLinearGradient(0, 0, 0, topEnd);
    top.addColorStop(0, 'rgba(0,0,0,.6)'); top.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = top; ctx.fillRect(0, 0, W, topEnd);
    var from = logoTop - 140, bot = ctx.createLinearGradient(0, from, 0, H);
    bot.addColorStop(0, 'rgba(0,0,0,0)'); bot.addColorStop(1, 'rgba(0,0,0,.7)');
    ctx.fillStyle = bot; ctx.fillRect(0, from, W, H - from);
  }

  // Desenha o logo encostado na esquerda (x) com a base em yBottom. Devolve a altura usada.
  function drawLogoLeft(ctx, logo, fallbackText, x, yBottom, maxW, maxH) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 16;
    var used;
    if (logo) {
      var r = logo.box, b = fitBox(r.w, r.h, maxW, maxH);
      ctx.drawImage(logo.img, r.x, r.y, r.w, r.h, x, yBottom - b.h, b.w, b.h);
      used = b.h;
    } else {
      var size = shrinkFont(ctx, fallbackText, 700, 40, maxW);
      ctx.font = '700 ' + size + 'px ' + FONT; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(fallbackText, x, yBottom - 8);
      used = size + 8;
    }
    ctx.restore();
    return used;
  }

  // game: jogo salvo. opts: { format: 'story'|'feed', bitmaps: [ImageBitmap|HTMLImageElement] }
  async function render(game, opts) {
    var fmt = FORMATS[opts.format] || FORMATS.story, W = fmt.w, H = fmt.h, M = 72; // M: margem esquerda
    var bitmaps = (opts.bitmaps || []).slice(0, MAX_PHOTOS);
    var res = await Promise.all([loadFont(), loadLogo('goleiro-de-aluguel'), loadLogo('diario-do-goleiro')]);
    var logoA = res[1], logoB = res[2];

    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var ctx = c.getContext('2d');
    if (bitmaps.length) drawPhotos(ctx, W, H, bitmaps); else drawBackground(ctx, W, H);

    // Logotipos empilhados no canto inferior esquerdo, acima da faixa do rodapé.
    // O primeiro desenhado é o de baixo; assim a conta começa pela base.
    var base = H - fmt.safeBottom, gap = 26, LW = 380, LH = 170;
    var hB = (logoB ? fitBox(logoB.box.w, logoB.box.h, LW, LH).h : 48);
    var hA = (logoA ? fitBox(logoA.box.w, logoA.box.h, LW, LH).h : 48);
    var logosTop = base - hB - gap - hA;
    drawShade(ctx, W, H, fmt.safeTop + 330, logosTop);
    drawLogoLeft(ctx, logoA, 'GOLEIRO DE ALUGUEL', M, logosTop + hA, LW, LH);
    drawLogoLeft(ctx, logoB, 'DIÁRIO DO GOLEIRO', M, base, LW, LH);

    // Placar no topo, alinhado à esquerda e levemente inclinado, como um adesivo.
    var r2 = resultFromScore(game);
    var score = (isNum(game.scoreFor) && isNum(game.scoreAgainst)) ? game.scoreFor + ' × ' + game.scoreAgainst : '';
    ctx.save();
    ctx.translate(M, fmt.safeTop + fmt.pad); ctx.rotate(-0.045);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 18;
    var y = 0;
    if (r2) {
      ctx.font = '400 62px ' + MARKER; ctx.fillStyle = r2.color;
      ctx.fillText(r2.label.charAt(0) + r2.label.slice(1).toLowerCase() + '!', 0, y + 56); y += 84;
    }
    if (score) {
      var ss = shrinkFont(ctx, score, 700, 170, W - 2 * M);
      ctx.font = '700 ' + ss + 'px ' + FONT; ctx.fillStyle = '#fff';
      ctx.fillText(score, -4, y + ss * 0.84); y += ss * 0.84 + 30;
    }
    var venue = (game.venue || '').trim();
    if (venue) {
      ctx.font = '500 52px ' + FONT; ctx.fillStyle = 'rgba(255,255,255,.95)';
      var lines = wrapLines(ctx, venue, W - 2 * M - 40, 2);
      lines.forEach(function (ln, i) { ctx.fillText(ln, 0, y + 50 + i * 62); });
    }
    ctx.restore();
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
