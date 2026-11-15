// 実ブラウザでの起動確認（npm run build のあと）。CI と手元の両方で走らせる。
//
// 静的検査（npm run check）は、ソースに外部 URL が書いてあるかしか見られない。
// ここでは dist/ を配信して実際に開き、次を確かめる。
//   1. 例外（pageerror）を出さずにホームが出る
//   2. ホーム → 学習の開始 → 書き順・テストの画面まで進める
//   3. その間に、このアプリ以外のホストへの通信が1件も出ない（Zero-CDN）
//   4. CSP の違反（securitypolicyviolation）が出ない
//
// ブラウザ本体はダウンロードしない。端末に入っている Chrome（CHROME_PATH、
// なければ /usr/bin/google-chrome）を playwright-core から動かす。
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require('playwright-core'); } catch { return require('playwright'); }
})();

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json',
};

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(DIST, path);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
  } catch {
    file = join(DIST, 'index.html');
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  args: ['--no-sandbox'],
  headless: true,
});
const problems = [];
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  const external = new Set();
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && url.origin !== origin) external.add(url.host);
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations = [...(window.__cspViolations || []), `${e.violatedDirective} ${e.blockedURI}`];
    });
  });

  await page.goto(`${origin}/`);
  await page.waitForTimeout(1500);
  // 初回のチュートリアル・ログインボーナスは閉じる（無ければ何もしない）
  for (const name of [/スキップ/, /とじる|閉じる/, /はじめる|始める/]) {
    const button = page.getByRole('button', { name }).first();
    if (await button.isVisible().catch(() => false)) { await button.click().catch(() => {}); await page.waitForTimeout(400); }
  }
  const start = page.locator('button').filter({ hasText: /きょうの/ }).first();
  await start.scrollIntoViewIfNeeded();
  await start.click();
  await page.waitForTimeout(2500);
  for (const tab of ['書き順', 'テスト']) {
    const button = page.locator('button').filter({ hasText: tab }).first();
    if (await button.isEnabled().catch(() => false)) { await button.click(); await page.waitForTimeout(1000); }
  }
  if (await page.locator('canvas').count() === 0) problems.push('学習画面にキャンバスが出ていない');
  const violations = await page.evaluate(() => window.__cspViolations || []);
  if (violations.length) problems.push(`CSP 違反: ${violations.join(' / ')}`);
  if (external.size) problems.push(`外部への通信: ${[...external].join(', ')}`);
  console.log(`smoke: home → session → test を開いた。外部への通信 ${external.size} 件 / CSP 違反 ${violations.length} 件`);
} finally {
  await browser.close();
  server.close();
}

if (problems.length) {
  console.error(`❌ 実ブラウザでの起動確認に失敗しました:\n  - ${problems.join('\n  - ')}`);
  process.exit(1);
}
console.log('✅ 実ブラウザでの起動確認に合格しました');
