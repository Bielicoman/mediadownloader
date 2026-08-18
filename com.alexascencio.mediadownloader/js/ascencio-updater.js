/**
 * Ascencio Updater — motor de atualização automática da suíte
 * Alex Ascencio · Adobe Premiere Pro CEP
 *
 * Instala uma vez, fica atualizado sozinho.
 *
 * O que ele faz de verdade:
 *   1. lê a versão instalada do version.json da própria extensão
 *   2. busca o manifesto remoto (com redirecionamento e timeout)
 *   3. compara em SemVer
 *   4. baixa o pacote para uma pasta temporária, com progresso real
 *   5. extrai com a ferramenta do sistema (PowerShell no Windows, unzip no macOS)
 *   6. copia por cima da extensão instalada
 *   7. RELÊ o version.json instalado para confirmar que a troca aconteceu
 *
 * Só diz "atualizado" depois do passo 7. Se qualquer passo falhar, mostra o erro
 * real, revela o arquivo baixado e abre a página de download.
 *
 * Uso:
 *   <script src="lib/CSInterface.js"></script>
 *   <script src="js/ascencio-updater.js"></script>
 *   <script>AscencioUpdater.init({
 *     pluginId: 'com.alexascencio.safezones',
 *     pluginName: 'Safe Zones',
 *     accent: '#2f7bff',
 *     manifestUrl: 'https://raw.githubusercontent.com/Bielicoman/safezones/main/version.json',
 *     fallbackUrl: 'https://github.com/Bielicoman/safezones/releases/latest'
 *   });</script>
 */
(function (root) {
  'use strict';

  /* ═══════════════ ambiente ═══════════════ */
  var hasRequire = typeof root.require === 'function';
  function req(m) { try { return hasRequire ? root.require(m) : null; } catch (e) { return null; } }

  var fs = req('fs'), pathM = req('path'), os = req('os'),
      https = req('https'), http = req('http'), cp = req('child_process');
  var nodeOk = !!(fs && pathM && os && https && cp);

  /* ═══════════════ utilidades puras (testáveis) ═══════════════ */

  /** Compara duas versões SemVer. Pré-lançamento perde para o estável. */
  function cmpVersion(a, b) {
    function parse(v) {
      var s = String(v == null ? '0.0.0' : v).trim().replace(/^v/i, '');
      var parts = s.split('-');
      var nums = parts[0].split('.').map(function (n) {
        var x = parseInt(n, 10); return isNaN(x) ? 0 : x;
      });
      while (nums.length < 3) nums.push(0);
      return { nums: nums, pre: parts.length > 1 ? parts.slice(1).join('-') : null };
    }
    var A = parse(a), B = parse(b);
    for (var i = 0; i < 3; i++) {
      if (A.nums[i] > B.nums[i]) return 1;
      if (A.nums[i] < B.nums[i]) return -1;
    }
    if (A.pre && !B.pre) return -1;   // 1.0.0-beta < 1.0.0
    if (!A.pre && B.pre) return 1;
    if (A.pre && B.pre) return A.pre < B.pre ? -1 : A.pre > B.pre ? 1 : 0;
    return 0;
  }

  /**
   * Aceita changelog em objeto {versao: texto}, array ou string.
   * Devolve sempre um array de linhas, da versão mais nova para a mais velha.
   */
  function normalizeChangelog(cl) {
    if (!cl) return [];
    if (typeof cl === 'string') return [cl];
    if (Array.isArray(cl)) return cl.filter(Boolean).map(String);
    if (typeof cl === 'object') {
      return Object.keys(cl)
        .sort(function (x, y) { return cmpVersion(y, x); })
        .map(function (k) { return 'v' + k + ' — ' + cl[k]; });
    }
    return [];
  }

  /** Um manifesto só é utilizável se tiver versão e um destino de download. */
  function validateManifest(m) {
    if (!m || typeof m !== 'object') return 'manifesto vazio';
    if (!m.version || !/^\d+\.\d+\.\d+/.test(String(m.version).replace(/^v/i, ''))) {
      return 'versão ausente ou inválida';
    }
    if (!m.downloadUrl && !m.zipUrl) return 'sem downloadUrl nem zipUrl';
    return null;
  }

  root.AscencioUpdaterCore = {
    cmpVersion: cmpVersion,
    normalizeChangelog: normalizeChangelog,
    validateManifest: validateManifest
  };

  /* ═══════════════ caminhos ═══════════════ */

  /** Pasta raiz da extensão instalada. Tenta CSInterface, depois a própria URL. */
  function extensionDir() {
    try {
      if (typeof root.CSInterface === 'function') {
        var cs = new root.CSInterface();
        var p = cs.getSystemPath('extension');
        if (p) return decodeURIComponent(p);
      }
    } catch (e) {}
    try {
      // file:///C:/.../com.alexascencio.x/src/index.html  ->  .../com.alexascencio.x
      var href = decodeURIComponent(root.location.href.split('?')[0].split('#')[0]);
      var f = href.replace(/^file:\/{2,}/, '').replace(/\/[^/]*$/, '');
      if (/^[a-zA-Z]:/.test(f) === false && /^\/[A-Za-z]:/.test(f)) f = f.slice(1);
      if (!pathM) return f;
      // sobe até achar o CSXS/manifest.xml
      var dir = f;
      for (var i = 0; i < 4; i++) {
        if (fs && fs.existsSync(pathM.join(dir, 'CSXS', 'manifest.xml'))) return dir;
        var up = pathM.dirname(dir);
        if (up === dir) break;
        dir = up;
      }
      return f;
    } catch (e) { return null; }
  }

  /** Lê a versão instalada a partir do version.json da extensão. */
  function localVersion(fallback) {
    if (!nodeOk) return fallback;
    try {
      var dir = extensionDir();
      if (!dir) return fallback;
      var p = pathM.join(dir, 'version.json');
      if (!fs.existsSync(p)) return fallback;
      var j = JSON.parse(fs.readFileSync(p, 'utf8'));
      return (j && j.version) ? String(j.version) : fallback;
    } catch (e) { return fallback; }
  }

  /* ═══════════════ rede ═══════════════ */

  function getJSON(url, cb) {
    var full = url + (url.indexOf('?') >= 0 ? '&' : '?') + '_t=' + Date.now();
    if (nodeOk) {
      httpGet(full, 0, function (err, res, body) {
        if (err) return cb(err);
        try { cb(null, JSON.parse(body)); } catch (e) { cb(new Error('JSON inválido')); }
      });
    } else if (typeof root.fetch === 'function') {
      root.fetch(full, { cache: 'no-store' })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (j) { cb(null, j); })
        .catch(cb);
    } else {
      cb(new Error('sem rede disponível'));
    }
  }

  /** GET com redirecionamento (até 5) e timeout de 20 s. Devolve o corpo como texto. */
  function httpGet(url, depth, cb) {
    if (depth > 5) return cb(new Error('redirecionamentos demais'));
    var mod = url.indexOf('https:') === 0 ? https : http;
    var reqO;
    try {
      reqO = mod.get(url, { headers: { 'User-Agent': 'AscencioUpdater' } }, function (res) {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return httpGet(absolute(res.headers.location, url), depth + 1, cb);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return cb(new Error('HTTP ' + res.statusCode));
        }
        var data = '';
        res.setEncoding('utf8');
        res.on('data', function (c) { data += c; });
        res.on('end', function () { cb(null, res, data); });
      });
    } catch (e) { return cb(e); }
    reqO.setTimeout(20000, function () { reqO.destroy(new Error('tempo esgotado')); });
    reqO.on('error', cb);
  }

  function absolute(loc, base) {
    if (/^https?:/i.test(loc)) return loc;
    try { return new URL(loc, base).href; } catch (e) { return loc; }
  }

  /** Baixa para um arquivo, com progresso real em bytes. */
  function download(url, dest, onProgress, cb, depth) {
    depth = depth || 0;
    if (depth > 5) return cb(new Error('redirecionamentos demais'));
    var mod = url.indexOf('https:') === 0 ? https : http;
    var file = null, reqO;
    try {
      reqO = mod.get(url, { headers: { 'User-Agent': 'AscencioUpdater' } }, function (res) {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return download(absolute(res.headers.location, url), dest, onProgress, cb, depth + 1);
        }
        if (res.statusCode !== 200) {
          res.resume();
          return cb(new Error('HTTP ' + res.statusCode));
        }
        var total = parseInt(res.headers['content-length'] || '0', 10);
        var got = 0;
        file = fs.createWriteStream(dest);
        res.on('data', function (c) {
          got += c.length;
          if (onProgress) onProgress(got, total);
        });
        res.pipe(file);
        file.on('finish', function () {
          file.close(function () {
            try {
              var size = fs.statSync(dest).size;
              if (size < 1024) return cb(new Error('arquivo baixado vazio (' + size + ' B)'));
              cb(null, dest, size);
            } catch (e) { cb(e); }
          });
        });
        file.on('error', cb);
      });
    } catch (e) { return cb(e); }
    reqO.setTimeout(60000, function () { reqO.destroy(new Error('tempo esgotado no download')); });
    reqO.on('error', function (e) {
      if (file) { try { file.destroy(); fs.unlinkSync(dest); } catch (x) {} }
      cb(e);
    });
  }

  /* ═══════════════ arquivos ═══════════════ */

  function isWin() {
    try { return os.platform() === 'win32'; } catch (e) { return /win/i.test(navigator.platform); }
  }

  function rmrf(p) {
    try {
      if (!fs.existsSync(p)) return;
      if (fs.rmSync) fs.rmSync(p, { recursive: true, force: true });
      else if (fs.rmdirSync) fs.rmdirSync(p, { recursive: true });
    } catch (e) {}
  }

  /** Extrai um zip usando a ferramenta nativa do sistema. Sem dependências. */
  function extract(zipPath, destDir, cb) {
    try { fs.mkdirSync(destDir, { recursive: true }); } catch (e) {}
    var cmd;
    if (isWin()) {
      // Expand-Archive exige extensão .zip
      var zipCopy = zipPath.replace(/\.zxp$/i, '') + '.zip';
      try { if (zipCopy !== zipPath) fs.copyFileSync(zipPath, zipCopy); } catch (e) { return cb(e); }
      cmd = 'powershell -NoProfile -NonInteractive -Command "' +
            'Expand-Archive -LiteralPath \'' + zipCopy.replace(/'/g, "''") + '\' ' +
            '-DestinationPath \'' + destDir.replace(/'/g, "''") + '\' -Force"';
    } else {
      cmd = 'unzip -o ' + shq(zipPath) + ' -d ' + shq(destDir);
    }
    cp.exec(cmd, { timeout: 120000, maxBuffer: 8 * 1024 * 1024 }, function (err, so, se) {
      if (err) return cb(new Error('falha ao extrair: ' + (se || err.message).toString().slice(0, 200)));
      cb(null, destDir);
    });
  }

  function shq(s) { return "'" + String(s).replace(/'/g, "'\\''") + "'"; }

  /** Acha, dentro do extraído, a pasta que contém CSXS/manifest.xml. */
  function findExtensionRoot(dir, depth) {
    depth = depth || 0;
    if (depth > 4) return null;
    try {
      if (fs.existsSync(pathM.join(dir, 'CSXS', 'manifest.xml'))) return dir;
      var kids = fs.readdirSync(dir, { withFileTypes: true });
      for (var i = 0; i < kids.length; i++) {
        if (!kids[i].isDirectory()) continue;
        var found = findExtensionRoot(pathM.join(dir, kids[i].name), depth + 1);
        if (found) return found;
      }
    } catch (e) {}
    return null;
  }

  /** Cópia recursiva com sobrescrita. */
  function copyDir(from, to) {
    try { fs.mkdirSync(to, { recursive: true }); } catch (e) {}
    var kids = fs.readdirSync(from, { withFileTypes: true });
    for (var i = 0; i < kids.length; i++) {
      var s = pathM.join(from, kids[i].name), d = pathM.join(to, kids[i].name);
      if (kids[i].isDirectory()) copyDir(s, d);
      else fs.copyFileSync(s, d);
    }
  }

  function reveal(p) {
    try {
      if (isWin()) cp.exec('explorer /select,"' + p + '"');
      else cp.exec('open -R ' + shq(p));
    } catch (e) {}
  }

  function openExternal(url) {
    try {
      if (root.cep && root.cep.util && root.cep.util.openURLInDefaultBrowser) {
        return root.cep.util.openURLInDefaultBrowser(url);
      }
    } catch (e) {}
    try {
      if (cp) return cp.exec((isWin() ? 'start ""' : 'open') + ' "' + url + '"');
    } catch (e) {}
    try { root.open(url, '_blank'); } catch (e) {}
  }

  /* ═══════════════ interface ═══════════════ */

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function Updater(cfg) {
    this.cfg = cfg;
    this.current = localVersion(cfg.currentVersion || '0.0.0');
    this.remote = null;
    this.busy = false;
    this.autoKey = 'ascencio_auto_' + cfg.pluginId;
    this.seenKey = 'ascencio_seen_' + cfg.pluginId;
    this.buildUI();
    this.syncVersionLabels();
    this.announceIfUpdated();
    var self = this;
    setTimeout(function () { self.check(true); }, cfg.checkDelayMs || 3000);
  }

  Updater.prototype.auto = function () {
    try { return localStorage.getItem(this.autoKey) !== 'off'; } catch (e) { return true; }
  };
  Updater.prototype.setAuto = function (on) {
    try { localStorage.setItem(this.autoKey, on ? 'on' : 'off'); } catch (e) {}
  };

  /** Se a versão instalada mudou desde a última abertura, avisa uma vez. */
  Updater.prototype.announceIfUpdated = function () {
    try {
      var prev = localStorage.getItem(this.seenKey);
      if (prev && cmpVersion(this.current, prev) > 0) {
        this.toast('Atualizado para a v' + this.current + '.', 'ok');
      }
      localStorage.setItem(this.seenKey, this.current);
    } catch (e) {}
  };

  Updater.prototype.syncVersionLabels = function () {
    var v = 'v' + this.current, self = this;
    ['#pluginVersionTag', '.brand-version-badge', '.version-tag'].forEach(function (sel) {
      [].forEach.call(document.querySelectorAll(sel), function (e) { e.textContent = v; });
    });
    [].forEach.call(document.querySelectorAll('[data-ascencio-version]'), function (e) {
      e.textContent = self.current;
    });
  };

  Updater.prototype.buildUI = function () {
    if (document.getElementById('ascUpd')) return;
    var a = this.cfg.accent || '#7aa2ff';
    var css = el('style', null,
      '#ascUpd,#ascUpdSheet{font-family:inherit;-webkit-font-smoothing:antialiased}' +
      '#ascUpdBadge{position:fixed;right:8px;bottom:16px;z-index:99998;display:none;align-items:center;gap:6px;' +
        'padding:5px 9px;background:' + a + ';color:#08080a;border:0;cursor:pointer;font-size:10px;' +
        'letter-spacing:.08em;text-transform:uppercase;font-weight:700}' +
      '#ascUpdBadge i{width:5px;height:5px;border-radius:50%;background:#08080a;animation:ascPulse 1.8s infinite}' +
      '@keyframes ascPulse{0%,100%{opacity:1}50%{opacity:.3}}' +
      '#ascUpdSheet{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;' +
        'background:rgba(0,0,0,.72);backdrop-filter:blur(3px)}' +
      '#ascUpdSheet.on{display:flex}' +
      '.asc-box{width:min(380px,92vw);background:#15151a;border:1px solid rgba(255,255,255,.14);' +
        'color:#e9e9ee;font-size:12px}' +
      '.asc-hd{padding:13px 15px;border-bottom:1px solid rgba(255,255,255,.09);display:flex;align-items:center;gap:8px}' +
      '.asc-hd b{font-size:13px}' +
      '.asc-hd span{margin-left:auto;font-size:10px;color:#8b8b95;letter-spacing:.08em}' +
      '.asc-bd{padding:14px 15px;max-height:46vh;overflow:auto}' +
      '.asc-bd ul{margin:8px 0 0;padding-left:16px;color:#a9a9b4;line-height:1.7}' +
      '.asc-bd li{font-size:11.5px}' +
      '.asc-ft{padding:11px 15px;border-top:1px solid rgba(255,255,255,.09);display:flex;gap:7px;align-items:center}' +
      '.asc-b{padding:7px 12px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#e9e9ee;' +
        'cursor:pointer;font-size:11px;font-family:inherit}' +
      '.asc-b:hover{border-color:#fff}' +
      '.asc-b.p{background:' + a + ';border-color:' + a + ';color:#08080a;font-weight:700}' +
      '.asc-b:disabled{opacity:.45;cursor:not-allowed}' +
      '.asc-bar{height:3px;background:rgba(255,255,255,.1);margin:12px 0 6px;display:none}' +
      '.asc-bar i{display:block;height:100%;width:0;background:' + a + ';transition:width .2s}' +
      '.asc-st{font-size:10.5px;color:#8b8b95;min-height:14px;word-break:break-word}' +
      '.asc-auto{margin-right:auto;display:flex;align-items:center;gap:6px;font-size:10.5px;color:#8b8b95;cursor:pointer}' +
      '#ascUpdToast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:99999;display:none;' +
        'padding:9px 14px;background:#15151a;border:1px solid rgba(255,255,255,.16);color:#e9e9ee;font-size:11.5px;max-width:88vw}' +
      '#ascUpdToast.ok{border-color:' + a + '}' +
      '#ascUpdToast.err{border-color:#ff5a3c}'
    );
    document.head.appendChild(css);

    var badge = el('button', null, '<i></i><span id="ascUpdBadgeTxt">Atualizar</span>');
    badge.id = 'ascUpdBadge'; badge.type = 'button';

    var sheet = el('div');
    sheet.id = 'ascUpdSheet';
    sheet.innerHTML =
      '<div class="asc-box">' +
        '<div class="asc-hd"><b>' + esc(this.cfg.pluginName) + '</b><span id="ascVerLine"></span></div>' +
        '<div class="asc-bd">' +
          '<div id="ascNote">Uma versão nova está disponível.</div>' +
          '<ul id="ascLog"></ul>' +
          '<div class="asc-bar" id="ascBar"><i id="ascBarFill"></i></div>' +
          '<div class="asc-st" id="ascSt"></div>' +
        '</div>' +
        '<div class="asc-ft">' +
          '<label class="asc-auto"><input type="checkbox" id="ascAuto"> atualizar sozinho</label>' +
          '<button class="asc-b" id="ascLater" type="button">Depois</button>' +
          '<button class="asc-b p" id="ascGo" type="button">Atualizar agora</button>' +
        '</div>' +
      '</div>';

    var toast = el('div'); toast.id = 'ascUpdToast';

    document.body.appendChild(badge);
    document.body.appendChild(sheet);
    document.body.appendChild(toast);

    var self = this;
    badge.onclick = function () { self.open(); };
    document.getElementById('ascLater').onclick = function () { self.close(); };
    document.getElementById('ascGo').onclick = function () { self.run(); };
    document.getElementById('ascAuto').checked = this.auto();
    document.getElementById('ascAuto').onchange = function () { self.setAuto(this.checked); };
    sheet.addEventListener('click', function (e) { if (e.target === sheet) self.close(); });
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  Updater.prototype.toast = function (msg, kind) {
    var t = document.getElementById('ascUpdToast');
    if (!t) return;
    t.textContent = msg;
    t.className = kind || '';
    t.style.display = 'block';
    clearTimeout(this._tt);
    this._tt = setTimeout(function () { t.style.display = 'none'; }, 5200);
  };

  Updater.prototype.open = function () {
    if (!this.remote) return;
    document.getElementById('ascVerLine').textContent = 'v' + this.current + ' → v' + this.remote.version;
    var ul = document.getElementById('ascLog');
    ul.innerHTML = '';
    normalizeChangelog(this.remote.changelog).slice(0, 6).forEach(function (line) {
      ul.appendChild(el('li', null, esc(line)));
    });
    document.getElementById('ascUpdSheet').classList.add('on');
  };
  Updater.prototype.close = function () {
    document.getElementById('ascUpdSheet').classList.remove('on');
  };

  Updater.prototype.check = function (silent) {
    var self = this;
    getJSON(this.cfg.manifestUrl, function (err, m) {
      if (err) {
        if (!silent) self.toast('Não deu para verificar: ' + err.message, 'err');
        return;
      }
      var bad = validateManifest(m);
      if (bad) {
        if (!silent) self.toast('Manifesto inválido: ' + bad, 'err');
        return;
      }
      self.remote = m;
      if (cmpVersion(m.version, self.current) <= 0) {
        if (!silent) self.toast('Você já está na v' + self.current + '.', 'ok');
        return;
      }
      var badge = document.getElementById('ascUpdBadge');
      document.getElementById('ascUpdBadgeTxt').textContent = 'v' + m.version;
      badge.style.display = 'inline-flex';

      if (self.auto() && nodeOk) self.run(true);
      else if (m.mandatory || !silent) self.open();
    });
  };

  /** O caminho de verdade: baixa, extrai, copia e confere. */
  Updater.prototype.run = function (background) {
    if (this.busy || !this.remote) return;
    var self = this, m = this.remote;

    if (!nodeOk) {
      this.open();
      this.status('Este painel não tem acesso ao sistema de arquivos. Abrindo o download.');
      openExternal(m.downloadUrl || this.cfg.fallbackUrl);
      return;
    }

    this.busy = true;
    if (!background) this.open();
    var go = document.getElementById('ascGo');
    if (go) { go.disabled = true; go.textContent = 'Atualizando…'; }
    this.bar(2);
    this.status('Preparando…');

    var url = m.downloadUrl || m.zipUrl;
    var tmp = pathM.join(os.tmpdir(), 'ascencio-' + this.cfg.pluginId + '-' + m.version);
    var pkg = pathM.join(os.tmpdir(), this.cfg.pluginId + '-' + m.version + '.zxp');
    rmrf(tmp);

    function fail(e, keepFile) {
      self.busy = false;
      if (go) { go.disabled = false; go.textContent = 'Baixar manualmente'; go.onclick = function () { openExternal(m.downloadUrl || self.cfg.fallbackUrl); }; }
      self.bar(0, true);
      self.status('Falhou: ' + (e && e.message ? e.message : e));
      if (!background) { /* já está aberto */ } else { self.open(); }
      if (keepFile) { try { reveal(pkg); } catch (x) {} }
      self.toast('A atualização automática falhou. Use o download manual.', 'err');
    }

    this.status('Baixando…');
    download(url, pkg, function (got, total) {
      var pct = total ? Math.round(got / total * 60) : 30;
      self.bar(2 + pct);
      self.status(total
        ? 'Baixando… ' + (got / 1048576).toFixed(1) + ' / ' + (total / 1048576).toFixed(1) + ' MB'
        : 'Baixando… ' + (got / 1048576).toFixed(1) + ' MB');
    }, function (err) {
      if (err) return fail(err);

      self.bar(66);
      self.status('Extraindo…');
      extract(pkg, tmp, function (err2) {
        if (err2) return fail(err2, true);

        var src = findExtensionRoot(tmp);
        if (!src) return fail(new Error('o pacote não contém CSXS/manifest.xml'), true);

        var dest = extensionDir();
        if (!dest) return fail(new Error('não achei a pasta da extensão'), true);

        self.bar(82);
        self.status('Instalando…');
        try {
          copyDir(src, dest);
        } catch (e3) {
          return fail(new Error('não deu para gravar em ' + dest + ' (' + e3.message + ')'), true);
        }

        // confere de verdade: relê o version.json instalado
        var after = localVersion(null);
        if (!after || cmpVersion(after, m.version) !== 0) {
          return fail(new Error('a cópia terminou mas a versão instalada ainda é ' + (after || 'desconhecida')), true);
        }

        self.bar(100);
        self.current = after;
        self.syncVersionLabels();
        rmrf(tmp);
        try { fs.unlinkSync(pkg); } catch (e) {}
        try { fs.unlinkSync(pkg.replace(/\.zxp$/i, '.zip')); } catch (e) {}

        self.busy = false;
        self.status('Pronto. Feche e reabra o painel para carregar a v' + after + '.');
        if (go) { go.disabled = false; go.textContent = 'Recarregar'; go.onclick = function () { root.location.reload(); }; }
        var badge = document.getElementById('ascUpdBadge');
        if (badge) badge.style.display = 'none';
        self.toast('Atualizado para a v' + after + '. Reabra o painel.', 'ok');
        if (background) self.open();
      });
    });
  };

  Updater.prototype.bar = function (pct, hide) {
    var b = document.getElementById('ascBar'), f = document.getElementById('ascBarFill');
    if (!b || !f) return;
    b.style.display = hide ? 'none' : 'block';
    f.style.width = Math.max(0, Math.min(100, pct)) + '%';
  };
  Updater.prototype.status = function (t) {
    var s = document.getElementById('ascSt');
    if (s) s.textContent = t;
  };

  /* ═══════════════ api ═══════════════ */
  root.AscencioUpdater = {
    init: function (cfg) {
      if (!cfg || !cfg.manifestUrl) return null;
      function start() {
        try { root.__ascUpd = new Updater(cfg); } catch (e) {}
      }
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
      } else { start(); }
      return root.__ascUpd;
    },
    checkNow: function () { if (root.__ascUpd) root.__ascUpd.check(false); }
  };

  /* export para teste em Node */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { cmpVersion: cmpVersion, normalizeChangelog: normalizeChangelog, validateManifest: validateManifest };
  }
})(typeof window !== 'undefined' ? window : globalThis);
