// 初回表示で読む JS の予算。npm run build のあとに走る。
//
// 以前は入口の1本（index-*.js）だけを測っていた。ところが dist/index.html は
// modulepreload で別のチャンク（React・framer-motion・漢字データなど）も同時に読みに行くので、
// ホームを出すまでに実際に読む量（約1MB）は予算の外で増え放題だった。
// 入口の1本の予算は残したうえで、初回に読む JS の合計（gzip 後）にも予算を置く。
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

/** 入口の1本（ブラウザが最初に実行するもの）の上限 */
const ENTRY_BUDGET_BYTES = 220 * 1024;
/**
 * 初回に読む JS の合計（入口＋modulepreload）を gzip したときの上限。
 * 学校の回線で40人が同時に開くことを考え、いまの大きさに少しだけ余裕を持たせて置く。
 * 上げるときは、何が増えたのかを README の「制限とクォータ」に書くこと。
 */
const INITIAL_GZIP_BUDGET_BYTES = 240 * 1024;

const DIST_DIR = fileURLToPath(new URL('../dist/', import.meta.url));
const html = await readFile(join(DIST_DIR, 'index.html'), 'utf8');

const entryMatch = html.match(/<script[^>]+type="module"[^>]+src="[^"]*\/assets\/([^"]+\.js)"/)
  || html.match(/<script[^>]+src="[^"]*\/assets\/(index-[^"]+\.js)"/);
if (!entryMatch) {
  console.error('Bundle budget check failed: entry script was not found in dist/index.html.');
  process.exit(1);
}
const entryFile = entryMatch[1];
const preloadFiles = [...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="[^"]*\/assets\/([^"]+\.js)"/g)].map((m) => m[1]);
const files = [entryFile, ...preloadFiles.filter((f) => f !== entryFile)];

const kib = (bytes) => (bytes / 1024).toFixed(1);
const rows = [];
for (const file of files) {
  const buffer = await readFile(join(DIST_DIR, 'assets', file));
  rows.push({ file, raw: buffer.length, gzip: gzipSync(buffer, { level: 9 }).length });
}
const entry = rows[0];
const totalRaw = rows.reduce((sum, r) => sum + r.raw, 0);
const totalGzip = rows.reduce((sum, r) => sum + r.gzip, 0);

for (const r of rows) console.log(`  ${r.file.padEnd(36)} ${kib(r.raw).padStart(7)} KiB  (gzip ${kib(r.gzip)} KiB)`);

let failed = false;
if (entry.raw > ENTRY_BUDGET_BYTES) {
  console.error(`Bundle budget exceeded: ${entry.file} is ${kib(entry.raw)} KiB (budget: ${kib(ENTRY_BUDGET_BYTES)} KiB).`);
  failed = true;
} else {
  console.log(`Bundle budget passed: ${entry.file} is ${kib(entry.raw)} KiB / ${kib(ENTRY_BUDGET_BYTES)} KiB.`);
}
if (totalGzip > INITIAL_GZIP_BUDGET_BYTES) {
  console.error(`Initial JS budget exceeded: ${files.length} files, ${kib(totalRaw)} KiB raw / ${kib(totalGzip)} KiB gzip (budget: ${kib(INITIAL_GZIP_BUDGET_BYTES)} KiB gzip).`);
  failed = true;
} else {
  console.log(`Initial JS budget passed: ${files.length} files, ${kib(totalRaw)} KiB raw / ${kib(totalGzip)} KiB gzip / ${kib(INITIAL_GZIP_BUDGET_BYTES)} KiB.`);
}
if (failed) process.exit(1);
