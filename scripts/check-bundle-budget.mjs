import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENTRY_BUDGET_BYTES = 220 * 1024;
const DIST_DIR = fileURLToPath(new URL('../dist/', import.meta.url));

const html = await readFile(join(DIST_DIR, 'index.html'), 'utf8');
const entryMatch = html.match(/<script[^>]+src="[^"]*\/assets\/(index-[^"]+\.js)"/);

if (!entryMatch) {
  console.error('Bundle budget check failed: entry script was not found in dist/index.html.');
  process.exit(1);
}

const entryFile = entryMatch[1];
const { size } = await stat(join(DIST_DIR, 'assets', entryFile));
const sizeKib = (size / 1024).toFixed(1);
const budgetKib = (ENTRY_BUDGET_BYTES / 1024).toFixed(0);

if (size > ENTRY_BUDGET_BYTES) {
  console.error(`Bundle budget exceeded: ${entryFile} is ${sizeKib} KiB (budget: ${budgetKib} KiB).`);
  process.exit(1);
}

console.log(`Bundle budget passed: ${entryFile} is ${sizeKib} KiB / ${budgetKib} KiB.`);
