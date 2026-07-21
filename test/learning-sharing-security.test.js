import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL('../supabase/migrations/202607210002_learning_sharing.sql', import.meta.url);

test('見守り共有テーブルはRLSを有効化し匿名アクセスを拒否する', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /alter table public\.kanji_town_share_invites enable row level security/i);
  assert.match(sql, /alter table public\.kanji_town_learning_links enable row level security/i);
  assert.match(sql, /revoke all on table public\.kanji_town_share_invites from anon, authenticated/i);
  assert.match(sql, /revoke all on table public\.kanji_town_learning_links from anon, authenticated/i);
});

test('レポート関数は認証済み利用者にだけ実行を許可する', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /security definer[\s\S]*set search_path = ''/i);
  assert.match(sql, /revoke all on function public\.get_kanji_town_linked_reports\(\) from public, anon/i);
  assert.match(sql, /grant execute on function public\.get_kanji_town_linked_reports\(\) to authenticated/i);
  assert.doesNotMatch(sql, /select[\s\S]{0,200}save\.payload(?:\s|,)/i);
});

test('招待は短時間・一度限りで共有人数にも上限がある', async () => {
  const sql = await readFile(migrationUrl, 'utf8');
  assert.match(sql, /now\(\) \+ interval '15 minutes'/i);
  assert.match(sql, /delete from public\.kanji_town_share_invites where id = invite\.id/i);
  assert.match(sql, />= 10/);
});
