# 学習ログ（study.v1）の実装メモ — 漢字タウン

本アプリの学習ログは「学習ログ共通スキーマ仕様書 `study.v1`」（版 1.3）に準拠する。
仕様書が唯一の正であり、このメモは漢字タウン固有の割り当てだけを記録する。

## 基本方針

- アプリは **保存のみ** を行い、外部送信は一切行わない（仕様 §0-1）
- 児童を識別する情報（氏名・出席番号・メールアドレス）はレコードに含めない（§0-2）
- 保存先: `localStorage` キー `study.records.v1`（全アプリ共通・上限500件）

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
同一オリジンの送信ページが `study.records.v1` を読む方式（仕様 §7・付録A）へ移行する。
`buildLearningReport()` は本スキーマの `ext` 生成元として存置している（§8.2）。
