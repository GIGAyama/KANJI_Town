#!/usr/bin/env node
/* GIGA Standard v4 品質ゲート
 *
 * 一度直した不具合が、次のリリースで静かに戻ってくるのを防ぐための検査。
 * とくに「Service Worker が他アプリのキャッシュを消す」「manifest の id が
 * コピー元のまま」の2つは、同一オリジンを共有している他のアプリを壊すため、
 * 人の目に頼らず機械で止める。
 *
 * 検査を緩めたいときは quality.config.json の securityExceptions に
 * 理由を書いて明示的に許可する（黙って検査を消さない）。
 *
 *   実行: npm run check
 */
import { readFile, stat, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(await readFile(join(ROOT, 'quality.config.json'), 'utf8'));
const pkg = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));

const failures = [];
const warnings = [];
const passes = [];

const fail = (id, msg) => failures.push(`${id}: ${msg}`);
const warn = (id, msg) => warnings.push(`${id}: ${msg}`);
const pass = (id, msg) => passes.push(`${id}: ${msg}`);

const allowed = (rule, value) =>
  config.securityExceptions?.some((e) => e.rule === rule && e.value === value);

const read = async (p) => {
  try { return await readFile(join(ROOT, p), 'utf8'); } catch { return null; }
};
const exists = async (p) => {
  try { await stat(join(ROOT, p)); return true; } catch { return false; }
};

/** node_modules / dist / .git を除いた対象ファイルを集める */
async function walk(dir, out = []) {
  let entries;
  try { entries = await readdir(join(ROOT, dir), { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    if (['node_modules', 'dist', '.git', '.assets-original'].includes(e.name)) continue;
    const rel = dir ? `${dir}/${e.name}` : e.name;
    if (e.isDirectory()) await walk(rel, out);
    else out.push(rel);
  }
  return out;
}
const allFiles = await walk('');
const sourceFiles = allFiles.filter((f) => /\.(js|jsx|css|html|gs)$/.test(f));
// テストは実行時の依存ではない。ダミーのURLや文字列を本番の参照と数えない。
const runtimeFiles = sourceFiles.filter((f) => !f.startsWith('test/') && !f.startsWith('scripts/'));

/* コメントを取り除いた本文を返す。
 * 「localStorage を触ってはいけない」と書いた注意書き自体を違反として
 * 数えてしまわないようにするため。 */
const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')
    .replace(/<!--[\s\S]*?-->/g, ' ');

// ── A. 法務・配布 ──────────────────────────────────────────────
for (const f of config.requiredFiles) {
  if (await exists(f)) pass('A', `${f} がある`);
  else fail('A', `${f} が無い`);
}

// ── B. セキュリティ ────────────────────────────────────────────
{
  // localStorage.clear() は他アプリと共有する学習ログまで消してしまう
  const offenders = [];
  for (const f of runtimeFiles) {
    const s = await read(f);
    if (s && /localStorage\s*\.\s*clear\s*\(/.test(stripComments(s))) offenders.push(f);
  }
  if (offenders.length) fail('B1', `localStorage.clear() を使っている: ${offenders.join(', ')}`);
  else pass('B1', 'localStorage.clear() を使っていない');
}
{
  const offenders = [];
  for (const f of runtimeFiles) {
    const s = await read(f);
    if (s && /postMessage\s*\([^)]*,\s*['"]\*['"]/.test(stripComments(s))) offenders.push(f);
  }
  if (offenders.length) fail('B2', `postMessage の宛先が '*' になっている: ${offenders.join(', ')}`);
  else pass('B2', "postMessage の宛先に '*' を使っていない");
}
{
  // 実行時に読む外部ホストは、許可リストに理由付きで登録されているものだけ
  // https に限る。XMLの名前空間URI(http://kanjivg.tagaini.net など)は
  // 通信先ではなく識別子なので、実行時の外部依存には数えない。
  const hostPattern = /https:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi;
  const found = new Map();
  for (const f of runtimeFiles) {
    const raw = await read(f);
    if (!raw) continue;
    const s = stripComments(raw);
    for (const m of s.matchAll(hostPattern)) {
      const host = m[1].toLowerCase();
      // ドキュメントへのリンクや作者ページは実行時の依存ではない
      // 自分の公開先・作者ページ・仕様URIは実行時の外部依存ではない
      if (['note.com', 'github.com', 'www.w3.org', 'classroom.google.com',
           'gigayama.github.io'].includes(host)) continue;
      if (!found.has(host)) found.set(host, f);
    }
  }
  const unlisted = [...found].filter(([h]) => !allowed('external-runtime-host', h));
  if (unlisted.length) {
    fail('B3', `許可リストに無い外部ホストを参照している（quality.config.json に理由を書いて追加すること）: ${unlisted.map(([h, f]) => `${h} (${f})`).join(', ')}`);
  } else {
    pass('B3', `外部ホストはすべて許可リスト済み（${[...found.keys()].join(', ') || 'なし'}）`);
  }
}
{
  const html = await read('index.html');
  if (html && /Content-Security-Policy/i.test(html)) pass('B4', 'CSP がある');
  else if (allowed('no-csp', 'index.html')) warn('B4', 'CSP 未導入（理由付きで許可済み）');
  else fail('B4', 'CSP が無い');
}

// ── C. PWA ─────────────────────────────────────────────────────
{
  const raw = await read('public/manifest.json');
  if (!raw) fail('C1', 'public/manifest.json が読めない');
  else {
    let mf;
    try { mf = JSON.parse(raw); } catch { mf = null; }
    if (!mf) fail('C1', 'public/manifest.json が JSON として壊れている');
    else {
      const base = config.basePath;
      for (const key of ['id', 'scope', 'start_url']) {
        if (!mf[key]) fail('C1', `manifest に ${key} が無い（同一オリジンの別アプリと取り違えられる）`);
        else if (!String(mf[key]).startsWith(base)) {
          fail('C1', `manifest の ${key} が "${mf[key]}" になっている。リポジトリ名の絶対パス "${base}" にすること`);
        } else pass('C1', `manifest の ${key} = ${mf[key]}`);
      }
      const purposes = new Set((mf.icons || []).map((i) => i.purpose));
      if (!purposes.has('maskable')) fail('C2', 'manifest に maskable アイコンが無い');
      else pass('C2', 'manifest に maskable アイコンがある');
    }
  }
}
{
  for (const icon of config.icons.required) {
    const p = `${config.icons.dir}/${icon}`;
    if (await exists(p)) pass('C3', `${p} がある`);
    else fail('C3', `${p} が無い`);
  }
}
{
  const sw = await read('public/sw.js');
  if (!sw) fail('C4', 'public/sw.js が読めない');
  else {
    // 最重要。接頭辞で絞らずにキャッシュを消すと他アプリを壊す。
    const hasPrefix = /CACHE_PREFIX/.test(sw);
    const deletesUnscoped = /caches\.keys\(\)/.test(sw)
      && !/startsWith\(\s*CACHE_PREFIX\s*\)/.test(sw);
    if (!hasPrefix) fail('C4', 'sw.js に CACHE_PREFIX が無い');
    else if (deletesUnscoped) {
      fail('C4', 'sw.js が接頭辞で絞らずにキャッシュを削除している。同一オリジンの他アプリを壊す');
    } else pass('C4', 'sw.js は自アプリ接頭辞のキャッシュだけを削除している');

    if (/localStorage/.test(stripComments(sw))) fail('C5', 'sw.js が localStorage を触っている（学習データに触れてはいけない）');
    else pass('C5', 'sw.js は localStorage を触っていない');

    // sw.js の APP_VERSION と package.json の version がずれると更新が届かない
    const m = sw.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
    if (!m) fail('C6', 'sw.js に APP_VERSION が無い');
    else if (m[1] !== pkg.version) {
      fail('C6', `sw.js の APP_VERSION (${m[1]}) が package.json の version (${pkg.version}) と違う。リリース時は両方上げること`);
    } else pass('C6', `APP_VERSION = ${m[1]}（package.json と一致）`);
  }
}
{
  const html = await read('index.html');
  if (!html) fail('C7', 'index.html が読めない');
  else {
    // 合図は <head> の最上部で受けないと、通信が遅い端末で取りこぼす
    const bip = html.indexOf('beforeinstallprompt');
    const firstLink = html.search(/<link|<script[^>]+src=/);
    if (bip === -1) fail('C7', 'index.html が beforeinstallprompt を捕捉していない');
    else if (firstLink !== -1 && bip > firstLink) {
      fail('C7', 'beforeinstallprompt の捕捉が他の読み込みより後ろにある。<head> の最上部へ移すこと');
    } else pass('C7', 'beforeinstallprompt を <head> 最上部で捕捉している');

    if (/viewport-fit=cover/.test(html)) pass('C8', 'viewport に viewport-fit=cover がある');
    else fail('C8', 'viewport に viewport-fit=cover が無い');
  }
}

// ── D. 表示 ────────────────────────────────────────────────────
{
  // 100vh 単独はモバイルのアドレスバー分だけはみ出す
  const offenders = [];
  for (const f of runtimeFiles) {
    const s = await read(f);
    if (!s) continue;
    for (const line of s.split('\n')) {
      if (/100vh/.test(line) && !/100dvh/.test(line)) {
        // 直後に dvh のフォールバックがある書き方は許容する
        if (!new RegExp('100vh[\\s\\S]{0,120}100dvh').test(s)) offenders.push(f);
        break;
      }
    }
  }
  if (offenders.length) fail('D1', `100vh を単独で使っている: ${[...new Set(offenders)].join(', ')}`);
  else pass('D1', '100vh は必ず 100dvh とセットで使われている');
}
{
  // DPR補正なしの Canvas はぼやける
  const users = [];
  for (const f of runtimeFiles) {
    const s = await read(f);
    if (!s || !/getContext\(\s*['"]2d['"]\s*\)/.test(s)) continue;
    // 補正ヘルパー経由か、自前で devicePixelRatio を見ていれば良い
    if (!/canvas-dpr|fitSquareCanvas|fitCanvasToSize|devicePixelRatio/.test(s)) users.push(f);
  }
  // QRの読み取りは映像の解像度そのままで扱う必要があるため対象外
  const offenders = users.filter((f) => !/StudentClientView/.test(f));
  if (offenders.length) fail('D2', `Canvas に DPR 補正が無い: ${offenders.join(', ')}`);
  else pass('D2', 'Canvas はすべて DPR 補正を通している');
}
{
  const css = await read('src/index.css');
  if (css && /prefers-reduced-motion/.test(css)) pass('D3', 'prefers-reduced-motion に対応している');
  else fail('D3', 'CSS に prefers-reduced-motion の指定が無い');
  if (css && /safe-area-inset/.test(css)) pass('D4', 'safe-area-inset を使っている');
  else fail('D4', 'safe-area-inset の指定が無い');
  if (css && /clamp\(/.test(css)) pass('D5', 'clamp() による可変文字サイズがある');
  else fail('D5', 'clamp() による可変文字サイズが無い');
}

// ── E. 性能 ────────────────────────────────────────────────────
{
  const budgets = config.imageBudgetBytes;
  for (const f of allFiles.filter((x) => /\.(png|jpe?g|webp|gif)$/i.test(x))) {
    const { size } = await stat(join(ROOT, f));
    const limit = budgets[f] ?? budgets.default;
    if (size > limit) fail('E1', `${f} が ${(size / 1024).toFixed(1)}KB（上限 ${(limit / 1024).toFixed(0)}KB）`);
  }
  if (!failures.some((x) => x.startsWith('E1'))) pass('E1', '画像はすべて上限内');
}
{
  const { maxLines, maxBytes } = config.sourceLimits;
  for (const f of sourceFiles) {
    const s = await read(f);
    if (!s) continue;
    const lines = s.split('\n').length;
    const bytes = Buffer.byteLength(s, 'utf8');
    if (lines > maxLines) fail('E2', `${f} が ${lines}行（上限 ${maxLines}行）`);
    else if (lines > maxLines * 0.9) warn('E2', `${f} が ${lines}行（上限 ${maxLines}行に接近）`);
    if (bytes > maxBytes) fail('E2', `${f} が ${(bytes / 1024).toFixed(0)}KB（上限 ${(maxBytes / 1024).toFixed(0)}KB）`);
  }
  if (!failures.some((x) => x.startsWith('E2'))) pass('E2', 'ソースファイルはすべて上限内');
}

// ── 結果 ───────────────────────────────────────────────────────
console.log(`\nGIGA Standard v4 品質ゲート — ${config.repoName}\n`);
console.log(`  合格 ${passes.length} 件 / 注意 ${warnings.length} 件 / 不合格 ${failures.length} 件\n`);
for (const w of warnings) console.log(`  ⚠️  ${w}`);
if (warnings.length) console.log('');
if (failures.length) {
  for (const f of failures) console.log(`  ❌ ${f}`);
  console.log('\n不合格があります。検査を緩めるのではなく、quality.config.json の');
  console.log('securityExceptions に理由を書いて明示的に許可してください。\n');
  process.exit(1);
}
console.log('  ✅ すべて合格\n');
