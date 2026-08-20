import test from 'node:test';
import assert from 'node:assert/strict';
import { getBasePath, resolveFromBase } from '../src/systems/base-path.js';

/* 独自ドメインへ移ったとき、`/KANJI_Town/` の直書きが残っていたせいで
 * manifest の start_url も Service Worker の登録先も 404 になり、
 * ホーム画面から起動しても開かなくなった。同じ事故を繰り返さないよう、
 * 配信先ごとの解決結果をここで固定する。 */

function withPage(href, fn) {
  const prevDocument = globalThis.document;
  const prevLocation = globalThis.location;
  globalThis.document = { baseURI: href };
  globalThis.location = { origin: new URL(href).origin };
  try {
    return fn();
  } finally {
    globalThis.document = prevDocument;
    globalThis.location = prevLocation;
  }
}

test('独自ドメイン直下ではアプリの基点がルートになる', () => {
  withPage('https://kanji-town.giga-school.com/', () => {
    assert.equal(getBasePath(), '/');
    assert.equal(resolveFromBase('sw.js'), 'https://kanji-town.giga-school.com/sw.js');
  });
});

test('クエリや不正なサブパスがあっても基点は変わらない', () => {
  withPage('https://kanji-town.giga-school.com/?drill=abc', () => {
    assert.equal(getBasePath(), '/');
  });
  withPage('https://kanji-town.giga-school.com/undefined', () => {
    assert.equal(getBasePath(), '/');
    assert.equal(resolveFromBase('sw.js'), 'https://kanji-town.giga-school.com/sw.js');
  });
});

test('サブパス配信（旧 GitHub Pages 形式）でもそのまま動く', () => {
  withPage('https://gigayama.github.io/KANJI_Town/', () => {
    assert.equal(getBasePath(), '/KANJI_Town/');
    assert.equal(resolveFromBase('sw.js'), 'https://gigayama.github.io/KANJI_Town/sw.js');
  });
});

test('document が無い環境ではルートとして扱う', () => {
  const prevDocument = globalThis.document;
  globalThis.document = undefined;
  try {
    assert.equal(getBasePath(), '/');
  } finally {
    globalThis.document = prevDocument;
  }
});
