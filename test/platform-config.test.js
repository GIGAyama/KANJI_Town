import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readProjectFile = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('インストール版PWAは縦向きと横向きの両方を許可する', async () => {
  const manifest = JSON.parse(await readProjectFile('public/manifest.json'));

  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, 'any');
  assert.equal(manifest.lang, 'ja');
});

test('PRの品質ゲートはテスト後に本番ビルドを検証する', async () => {
  const workflow = await readProjectFile('.github/workflows/deploy.yml');
  const testStep = workflow.indexOf('- run: npm test');
  const buildStep = workflow.indexOf('- run: npm run build');

  assert.match(workflow, /pull_request:\s*\n\s+branches: \[main\]/);
  assert.ok(testStep >= 0, 'npm test が品質ゲートに含まれている');
  assert.ok(buildStep > testStep, '本番ビルドはテスト成功後に実行される');
  assert.match(workflow, /if: github\.event_name == 'push'/);
});
