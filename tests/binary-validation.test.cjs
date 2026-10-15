const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { Readable } = require('node:stream');
const { EventEmitter } = require('node:events');

const sources = ['app/src/js/binManager.js', 'com.alexascencio.mediadownloader/js/binManager.js'];
function load(source, dir, options = {}) {
  let executions = [], rootQueries = [];
  const child = {
    exec(command, opts, callback) { callback(null, options.system || ''); },
    execFile(file, args, opts, callback) {
      if (/powershell\.exe$/i.test(file)) {
        rootQueries.push({ file, args, opts });
        return callback(options.rootError ? Error("root retrieval failed") : null, options.rootOutput || "");
      }
      executions.push(file);
      let content;
      try { content = fs.readFileSync(file, 'utf8'); } catch (e) { return callback(e); }
      if (content === 'ERROR') return callback(Error('invalid executable'));
      callback(null, content);
    }
  };
  const network = {
    get(url, opts, callback) {
      assert.equal(opts.rejectUnauthorized, true);
      assert.match(url, /^https:/);
      const req = new EventEmitter();
      req.setTimeout = () => {};
      req.destroy = error => req.emit('error', error);
      process.nextTick(() => {
        const data = options.data || '2026.10.15';
        const res = Readable.from([Buffer.from(data)]);
        res.statusCode = 200;
        res.headers = { 'content-length': String(options.length || Buffer.byteLength(data)) };
        res.complete = options.complete !== false;
        callback(res);
        if (options.networkError) process.nextTick(() => res.destroy(Error("simulated network error")));
      });
      return req;
    }
  };
  const context = {
    window: {}, URL, process: { platform: 'win32', env: {}, cwd: () => dir }, __dirname: dir,
    localStorage: { getItem(key) { return options.custom && options.custom[key] || null; } },
    require(name) {
      if (name === 'child_process') return child;
      if (name === 'tls' && options.tls) return options.tls;
      if (name === 'https') return network;
      if (name === 'fs') return options.fs || fs;
      return require(name);
    }
  };
  vm.runInNewContext(fs.readFileSync(source, 'utf8'), context, { filename: source });
  const manager = context.window.BinManager;
  manager.getLocalBinDir = () => dir;
  manager.getBinaryCandidates = async name => [path.join(dir, name + '.exe')];
  return { manager, executions, rootQueries };
}
for (const source of sources) {
  test(source + ': validates candidates and caches only working engines', async t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md-bin-test-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const bad = path.join(dir, 'custom.exe'), invalidPath = path.join(dir, 'bad-path.exe'), validPath = path.join(dir, 'path.exe');
    fs.writeFileSync(bad, 'ERROR'); fs.writeFileSync(invalidPath, 'random text'); fs.writeFileSync(validPath, '2026.10.15');
    fs.writeFileSync(path.join(dir, 'yt-dlp.exe'), 'random text');
    const { manager, executions } = load(source, dir, { custom: { mediadownloader_custom_ytdlp: bad }, system: invalidPath + '\n' + validPath });
    assert.equal(await manager.checkBinaryVersion(bad), null);
    const found = await manager.findYtDlp();
    assert.equal(found.path, validPath); assert.equal(found.version, '2026.10.15'); assert.equal(found.source, 'system');
    const count = executions.length;
    assert.equal((await manager.findYtDlp()).source, 'cache'); assert.equal(executions.length, count);
    fs.unlinkSync(validPath);
    const missing = await manager.findYtDlp(); assert.equal(missing.found, false); assert.equal(manager.cachedYtDlpPath, null);
    fs.writeFileSync(path.join(dir, 'ffmpeg.exe'), 'ffmpeg version 6.1.1 Copyright');
    assert.equal((await manager.findFfmpeg()).version, '6.1.1');
    fs.writeFileSync(path.join(dir, 'aria2c.exe'), 'ERROR'); assert.equal((await manager.findAria2()).found, false);
  });
  for (const scenario of ['invalid', 'truncated', 'success', 'rollback', 'write-error', 'network-error', 'incomplete']) {
    test(source + ': update ' + scenario, async t => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md-update-test-'));
      t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
      const target = path.join(dir, 'yt-dlp.exe'); fs.writeFileSync(target, '2026.09.01');
      const wrappedFs = { ...fs };
      if (scenario === 'rollback') wrappedFs.renameSync = (from, to) => {
        if (from.includes('.download-')) throw Error('simulated replacement failure');
        return fs.renameSync(from, to);
      };
      if (scenario === 'write-error') wrappedFs.createWriteStream = () => { throw Error('simulated permission error'); };
      const { manager, executions } = load(source, dir, { fs: wrappedFs, networkError: scenario === 'network-error', complete: scenario !== 'incomplete', data: scenario === 'invalid' ? 'ERROR' : '2026.10.15', length: scenario === 'truncated' ? 999 : undefined });
      if (scenario === 'success') {
        const result = await manager.downloadStandaloneYtDlp();
        assert.equal(result.version, '2026.10.15'); assert.equal(manager.ytDlpVersion, '2026.10.15');
        assert.equal(fs.readFileSync(target, 'utf8'), '2026.10.15');
        assert(executions.some(file => /\.download-.*\.exe$/.test(file)));
      } else {
        await assert.rejects(manager.downloadStandaloneYtDlp());
        assert.equal(fs.readFileSync(target, 'utf8'), '2026.09.01');
        assert.equal(manager.cachedYtDlpPath, null);
      }
      await new Promise(resolve => setTimeout(resolve, 20));
      assert.deepEqual(fs.readdirSync(dir), ['yt-dlp.exe']);
    });
  }
  test(source + ': rejects HTTP update without touching current file', async t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'md-http-test-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const { manager } = load(source, dir);
    await assert.rejects(manager.downloadValidatedBinary('http://example.org/engine', path.join(dir, 'yt-dlp.exe'), 'yt-dlp'), /HTTPS/);
    assert.deepEqual(fs.readdirSync(dir), []);
  });
}

for (const source of sources) {
  test(source + ': Windows trusted root fallback is cached and retains bundled roots', async () => {
    const certificate = require('node:tls').rootCertificates[0];
    const { manager, rootQueries } = load(source, os.tmpdir(), { tls: { rootCertificates: ['bundled-root'] }, rootOutput: certificate });
    const roots = await manager.getTrustedCertificateAuthorities();
    assert.equal(roots[0], 'bundled-root'); assert.equal(roots[1], certificate);
    assert.equal(await manager.getTrustedCertificateAuthorities(), roots);
    assert.equal(rootQueries.length, 1);
    assert.deepEqual(Array.from(rootQueries[0].args.slice(0, 3)), ['-NoProfile', '-NonInteractive', '-Command']);
    assert(rootQueries[0].args[3].includes('Cert:\\CurrentUser\\Root'));
    assert(rootQueries[0].args[3].includes('Cert:\\LocalMachine\\Root'));
    assert(rootQueries[0].args[3].includes('Import-Module'));
    assert.equal(rootQueries[0].opts.windowsHide, true);
  });
  test(source + ': native system roots avoid PowerShell and preserve bundled roots', async () => {
    const { manager, rootQueries } = load(source, os.tmpdir(), { tls: { rootCertificates: ['bundled'], getCACertificates(kind) { assert.equal(kind, 'system'); return ['system']; } } });
    assert.deepEqual(Array.from(await manager.getTrustedCertificateAuthorities()), ['bundled', 'system']);
    assert.equal(rootQueries.length, 0);
  });
  test(source + ': trust-store errors fail closed and can retry', async () => {
    const { manager, rootQueries } = load(source, os.tmpdir(), { tls: { rootCertificates: ['bundled'] }, rootError: true });
    await assert.rejects(manager.getTrustedCertificateAuthorities(), /certificados confiáveis do Windows/);
    await assert.rejects(manager.getTrustedCertificateAuthorities(), /certificados confiáveis do Windows/);
    assert.equal(rootQueries.length, 2);
  });
}
