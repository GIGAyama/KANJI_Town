# 学習ログ（study.v1）の実装メモ — 漢字タウン

本アプリの学習ログは「学習ログ共通スキーマ仕様書 `study.v1`」（版 1.5）に準拠する。
仕様書が唯一の正であり、このメモは漢字タウン固有の割り当てだけを記録する。

## 基本方針

- アプリは **保存のみ** を行い、外部送信は一切行わない（仕様 §0-1）
- 児童を識別する情報（氏名・出席番号・メールアドレス）はレコードに含めない（§0-2）
- 保存先: `localStorage` キー `study.records.v1`（全アプリ共通・上限500件）
  - **キーが共通なだけで、保存先はアプリごとに別々**（独自ドメイン移行後。下の §9 を見ること）

## 3層構成（§6）

| ファイル | 役割 |
|---|---|
| `src/systems/studyLog.js` | 保存。参照実装ロジック版 1.1 と同一。単独で改変しない |
| `src/systems/studySession.js` | レコード組み立て。時間計測（`elapsedMs` / `activeMs`）、中断検知、`ext` 生成 |
| `src/systems/studyStats.js` | 読み出し専用。学習きろく画面の「さいきんのとりくみ」表示 |

## コア層の割り当て（§3.3）

- `appId`: `kanji-town` / `kind`: `session`
- `mode`: `drill`（通常学習・マイドリル・にがて特訓）/ `test`（ドリルテスト）/ `flashcard` / `survival` / `boss`
- `source`: `course`（通常）/ `custom`（マイドリル）/ `weak`（にがて特訓・ボスバトル）/ `review`（フラッシュカード・サバイバル）
- `grading`: `mixed`（通常学習: 自己評価＋strokeGrader）/ `objective`（テスト・サバイバル・ボス）/ `selfReport`（フラッシュカード）
- `unit.id`: `g{学年}-daily` / `g{学年}-single` / `weak-review` / `custom-{名前のdjb2ハッシュ}`（マイドリル、`preset: false`）/ `flashcard-read` / `survival` / `boss-battle`
- `items[].q`: 漢字ID（例 `k1_1`）。`skill` に `reading` / `writing` を付す
- `ext`: `buildLearningReport()`（`src/systems/learning-report.js`）から生成。
  4技能スコア・SRS状況・弱点漢字ID・連続学習日数

## `items` の切り詰め（§2.7）

`items` は1レコード200件が上限で、`studyLog.js` が201件目以降を捨てる。
サバイバル・ボスバトルは制限時間まで出題が続くため、学習済み漢字が多い児童では
実際に200種類を超えうる。組み立て側で何もしないと `attempted > items.length` となり、
`summary` から出す正答率と設問層から出す正答率が食い違ったまま蓄積される。

`studySession.js` の `finalize()` で先に切り詰め、`summary` は切り詰め後の `items` から数える。

- `summary.attempted` / `firstTryCorrect` / `correct` … 残した200件から算出（`attempted === items.length`）
- `summary.count` … 切り詰め前の解答実績のまま（サバイバル・ボスは実際に出した数が出題数）
- `ext.itemsTruncated` … 切り詰めが起きたときだけ `{ attempted, firstTryCorrect }` を付け、真の値を残す

## 中断の扱い（§5.4）

- 学習画面を「やめて町にもどる」で離れた／リザルトに到達せず離れた → `status: "aborted"`
- タブ非表示のまま **5分** 戻らなかった → タブを離れた時刻で締めて `aborted` 確定、
  復帰時は残り分で新しいレコードを開始する
- 1問も解答していないレコードは保存しない
- 学習途中のリロードはセッションチェックポイントで復元され、復帰後は残り分が新レコードになる

## Supabase 機能の廃止（§8）

かつてのクラウド同期・見守り共有（`cloud-client.js` / `cloud-sync.js` / `cloud-sharing.js` /
`useCloudSync` / `useLearningSharing` / `LearningSharePanel` / `AccountSyncPanel` /
`supabase/` / `@supabase/supabase-js` 依存）は削除した。教師への学習データ共有は、
送信ページが `study.records.v1` を読む方式（仕様 §7・付録A）へ移行する。
ただし独自ドメインへ移ったあとは「同一オリジン」ではなくなっているので、下の §9 の受け渡し口を使う。
`buildLearningReport()` は本スキーマの `ext` 生成元として存置している（§8.2）。


## 独自ドメイン移行後の横断集計（§9）

旧構成では、すべてのアプリが `gigayama.github.io` という**ひとつのオリジン**に
置かれていた。`localStorage` はオリジンごとに分かれるため、全アプリが文字どおり
同じ `study.records.v1` を読み書きしており、送信ページは自分の `localStorage` を
読むだけで横断集計ができていた。

独自ドメインに移り、アプリは `kanji-town.giga-school.com` のように
**サブドメインごとに別のオリジン**になった。キー名は共通のままだが、
**中身は共有されない。**

そこで、集計側から取りに来てもらう受け渡し口を置いた。

| ファイル | 役割 |
|---|---|
| `public/records-export.html` | 受け渡し口のページ（児童が開く画面ではない） |
| `public/records-export.js` | `study.records.v1` を読んで `postMessage` で返す |

- 集計ページが**同一サイトの `iframe`** でこのページを開き、`postMessage` で問い合わせる。
  サブドメイン同士は同一サイト（eTLD+1 が `giga-school.com`）なので、
  third-party ストレージ分割の対象にならず、`iframe` の中でも第一者と同じ
  `localStorage` が見える
- **読むだけ。書き込みも削除もしない。** 集計側の不具合でこのアプリの記録が
  壊れることが原理的に起きない形にしてある
- 渡す相手は `giga-school.com` とそのサブドメインだけ。判定は
  `test/records-export.test.js` で、通してはいけない例を並べて確かめている
- このページからは親へ声をかけない（宛先を `'*'` にする `postMessage` を残さない）。
  集計側は `iframe` の `load` を合図にする

旧 `gigayama.github.io` に保存されていた記録は、オリジンが変わったため
**引き継がれない。** 旧オリジンはホストごと転送されるようになっており、
そこで JavaScript を動かして読み出す手段がない。
