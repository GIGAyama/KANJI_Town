import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowUrl = new URL('../.github/workflows/deploy.yml', import.meta.url);
const viteConfigUrl = new URL('../vite.config.js', import.meta.url);

test('本番ビルドはバージョンとcommitを配信確認用に埋め込む', async () => {
  const config = await readFile(viteConfigUrl, 'utf8');
  assert.match(config, /__APP_VERSION__/);
  assert.match(config, /__BUILD_COMMIT__/);
  assert.match(config, /fileName:\s*'release\.json'/);
  assert.match(config, /process\.env\.GITHUB_SHA/);
});

test('mainのデプロイ後に配信中commitと対象commitを照合する', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');
  assert.match(workflow, /npm audit --omit=dev --audit-level=high/);
  assert.match(workflow, /verify-deployment:[\s\S]*needs: deploy/);
  assert.match(workflow, /EXPECTED_SHA:\s*\$\{\{ github\.sha \}\}/);
  assert.match(workflow, /release\.commit !== expectedSha/);
});
