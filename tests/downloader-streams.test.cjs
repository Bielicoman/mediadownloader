const fs = require('fs'), vm = require('vm'), assert = require('assert'), { EventEmitter } = require('events');
const source = fs.readFileSync('app/src/js/downloader.js', 'utf8');
const children = [];
const context = { window: {}, console, Buffer, localStorage: { getItem() { return null; } }, require(name) {
    if (name !== 'child_process') return require(name);
    return { spawn(file, args) { const child = new EventEmitter(); child.stdout = new EventEmitter(); child.stderr = new EventEmitter(); children.push({child,args}); return child; } };
}};
vm.createContext(context); vm.runInContext(source, context);
(async () => {
    const progress = [];
    const promise = context.window.Downloader._runYtDlp({procs:[]}, 'yt-dlp', [], 'audio_wav', p => progress.push(p));
    const child = children[0].child;
    // Actual progress templates are emitted on stderr. Split across arbitrary chunks.
    child.stderr.emit('data', Buffer.from('MDP|50|100|NA|1048576|2|140\nMD'));
    child.stderr.emit('data', Buffer.from('PP|started|ExtractAudio\n'));
    const filename = 'C:/Vídeos/Arqueologia Bíblica [id].wav';
    const output = Buffer.from('MDFILE|' + filename);
    const split = output.indexOf(Buffer.from('í')) + 1;
    child.stdout.emit('data', output.subarray(0, split));
    child.stdout.emit('data', output.subarray(split)); // final line deliberately has no newline
    child.emit('close', 0);
    assert.equal(await promise, filename);
    assert.equal(progress[0].percent, 50);
    assert.equal(progress[1].stage, 'post');
    assert.equal(progress[1].status, 'Convertendo o áudio...');
    const failed = context.window.Downloader._runYtDlp({procs:[]}, 'yt-dlp', [], 'best');
    const error = Buffer.from('ERROR: Falha de conexão');
    const cut = error.indexOf(Buffer.from('ã')) + 1;
    children[1].child.stderr.emit('data', error.subarray(0,cut));
    children[1].child.stderr.emit('data', error.subarray(cut));
    children[1].child.emit('close', 1);
    await assert.rejects(failed, /Falha de conexão/);
    assert.equal((source.match(/"--encoding", "utf-8"/g) || []).length, 3);
    assert.equal(source, fs.readFileSync('com.alexascencio.mediadownloader/js/downloader.js','utf8'));
    console.log('PASS: UTF-8 paths across chunks, unterminated final path, stderr download/postprocessing progress, preserved UTF-8 errors, shared engine parity');
})().catch(e => { console.error(e); process.exitCode=1; });
