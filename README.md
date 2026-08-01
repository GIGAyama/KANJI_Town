# マイ漢字タウン（KANJI_Town)

教育漢字1026字を「読み・意味・書字・筆順」の4技能で学ぶ、小学生向けの漢字学習アプリ。
学習するほど自分の町が育つ。GIGA山 学習アプリ群の一員として `https://gigayama.github.io/KANJI_Town/` で公開している。

## 開発

```bash
npm install
npm run dev     # 開発サーバー
npm test        # node --test
npm run build   # ビルド + バンドル予算チェック
```

## 書字の正誤判定

書き順・字形・とめはね・点画の交差の判定は `src/systems/strokeGrader.js` に集約し、
テスト・ドリル・ボスバトル・サバイバルで同じ採点を共有する。
配点と設計の根拠は `docs/stroke-grading.md` を参照。

## 学習ログ（study.v1）

本アプリは「学習ログ共通スキーマ仕様書 `study.v1`」に準拠した学習ログを端末の
`localStorage` に保存する。**保存のみを行い、外部送信は一切行わない。**

- 出力スキーマ版: **`study.v1`**
- 保存キー: **`study.records.v1`**
- 実装は3層構成
  - `src/systems/studyLog.js` — 保存（全アプリ共通・ロジック版 1.1。単独で改変しない）
  - `src/systems/studySession.js` — アプリ固有のレコード組み立て（時間計測・中断処理を含む）
  - `src/systems/studyStats.js` — 読み出し専用（学習きろく画面の「さいきんのとりくみ」）

> `study.records.v1` は複数アプリ共通の学習ログです。このアプリ専用のキーではないため、
> リセット処理やクリーンアップの対象に含めないでください。

かつて実装していた Supabase によるクラウド同期・見守り共有は、本スキーマへの統合に伴い
廃止した（仕様書 §8）。詳細は `docs/study-log.md` を参照。
