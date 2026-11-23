/*
 * Fotos dos jogos. Ficam no IndexedDB (o localStorage não comporta imagens).
 * Cada foto é reduzida antes de salvar: a versão "grande" tem o lado maior de 1600 px
 * e há uma miniatura de 360 px para as listas.
 * No Node só expõe scaleToFit (para os testes); o resto roda no navegador (window.GDAPhotos).
 */
(function (root) {
  'use strict';

  var DB_NAME = 'diario-goleiro-fotos', STORE = 'photos';
  var MAX_SIDE = 1600, THUMB_SIDE = 360, QUALITY = 0.82, THUMB_QUALITY = 0.75;

  // Reduz mantendo a proporção; nunca aumenta.
  function scaleToFit(width, height, max) {
    var longest = Math.max(width, height);
    if (!longest || longest <= max) return { width: width, height: height };
    var k = max / longest;
    return { width: Math.round(width * k), height: Math.round(height * k) };
  }

  var api = { scaleToFit: scaleToFit, MAX_SIDE: MAX_SIDE, THUMB_SIDE: THUMB_SIDE };
  if (typeof document === 'undefined') { // Node: só o que os testes usam
    api.available = false;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.GDAPhotos = api;
    return;
  }
  var hasDb = typeof indexedDB !== 'undefined';

  /* ---------- IndexedDB ---------- */
  var dbPromise = null;
  function openDb() {
    if (!hasDb) return Promise.reject(new Error('sem IndexedDB'));
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(STORE, { keyPath: 'id' }); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { dbPromise = null; reject(req.error); };
    });
    return dbPromise;
  }
  function run(mode, fn) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, mode);
        var req = fn(tx.objectStore(STORE));
        tx.oncomplete = function () { resolve(req ? req.result : undefined); };
        tx.onerror = tx.onabort = function () { reject(tx.error); };
      });
    });
  }
  function put(rec) { return run('readwrite', function (s) { return s.put(rec); }); }
  function get(id) { return run('readonly', function (s) { return s.get(id); }); }
  function exists(id) { return run('readonly', function (s) { return s.count(id); }).then(function (n) { return n > 0; }); }

  /* ---------- Imagem ---------- */
  // createImageBitmap é rígido com arquivos levemente corrompidos; o <img> aceita mais casos.
  async function decodeImage(file) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (e1) {
      return new Promise(function (resolve, reject) {
        var url = URL.createObjectURL(file), img = new Image();
        img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('imagem')); };
        img.src = url;
      });
    }
  }
  function draw(bmp, w, h, quality) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); // PNG com transparência vira fundo branco
    x.drawImage(bmp, 0, 0, w, h);
    return new Promise(function (resolve, reject) {
      c.toBlob(function (b) { b ? resolve(b) : reject(new Error('imagem')); }, 'image/jpeg', quality);
    });
  }
  function newId() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  // Reduz, gera a miniatura e guarda. keepOriginal: mantém o arquivo se já estiver dentro do limite (usado no backup).
  async function addBlob(file, id, keepOriginal) {
    var bmp = await decodeImage(file);
    var bw = bmp.naturalWidth || bmp.width, bh = bmp.naturalHeight || bmp.height;
    var big = scaleToFit(bw, bh, MAX_SIDE), small = scaleToFit(bw, bh, THUMB_SIDE);
    var blob = (keepOriginal && big.width === bw && big.height === bh && file.type === 'image/jpeg')
      ? file : await draw(bmp, big.width, big.height, QUALITY);
    var thumb = await draw(bmp, small.width, small.height, THUMB_QUALITY);
    id = id || newId();
    await put({ id: id, blob: blob, thumb: thumb, width: big.width, height: big.height, createdAt: Date.now() });
    return id;
  }

  /* ---------- Endereços temporários (blob:) ---------- */
  var urls = {};
  async function url(id, kind) {
    var key = id + ':' + kind;
    if (urls[key]) return urls[key];
    var rec = await get(id);
    if (!rec) return null;
    urls[key] = URL.createObjectURL(kind === 'thumb' ? rec.thumb : rec.blob);
    return urls[key];
  }
  function forget(id) {
    ['thumb', 'blob'].forEach(function (k) {
      if (urls[id + ':' + k]) { URL.revokeObjectURL(urls[id + ':' + k]); delete urls[id + ':' + k]; }
    });
  }
  function remove(id) {
    forget(id);
    return run('readwrite', function (s) { return s.delete(id); }).catch(function () {});
  }

  /* ---------- Backup ---------- */
  function toDataURL(id) {
    return get(id).then(function (rec) {
      if (!rec) return null;
      return new Promise(function (resolve, reject) {
        var r = new FileReader();
        r.onload = function () { resolve(r.result); };
        r.onerror = function () { reject(r.error); };
        r.readAsDataURL(rec.blob);
      });
    });
  }
  async function addDataUrl(dataUrl, id) {
    var blob = await (await fetch(dataUrl)).blob();
    return addBlob(blob, id, true);
  }

  api.available = hasDb;
  api.decodeImage = decodeImage;
  api.add = function (file) { return addBlob(file); };
  api.addDataUrl = addDataUrl;
  api.get = get;
  api.exists = exists;
  api.url = url;
  api.forget = forget;
  api.remove = remove;
  api.toDataURL = toDataURL;
  root.GDAPhotos = api;
})(typeof window !== 'undefined' ? window : globalThis);
