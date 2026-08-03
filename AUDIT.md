# GIGA Standard v4 監査：マイ漢字タウン（KANJI_Town）

実施日：2026-08-03 / 対象コミット：`847d2f5` / 判定はすべて **実測値** に基づく。

> **この文書は「着手前」の診断結果です。** 以降の P0〜P4 で対応した結果は
> 末尾の「対応後の状態」を参照してください。

**アプリ型**：**B型（Vite + React）**
`vite.config.js` あり・`base: '/KANJI_Town/'` 設定済み・`.gs` なし・Chrome拡張 manifest なし。

**総評**
土台はかなり良い。`dvh`・`visualViewport` 追従・`prefers-reduced-motion`・印刷CSS・学習ログ `study.v1`・
`pagehide` 確定保存・テスト132件・CI での配信検証まで、すでに実装済み。

一方で **他アプリを壊している重大な不具合が1件** ある。

> `public/sw.js` の `activate` が `caches.keys()` を走査し、
> **自分のキャッシュ名リストに無いものをすべて削除している**。
> `gigayama.github.io` は数十個のアプリで同一オリジンを共有しているため、
> **このアプリを開くと、他のアプリのオフライン起動が壊れる。**
> → P1 の最優先項目。

---

## A. 法務・配布

| # | 項目 | 判定 | 実測 |
|---|---|:--:|---|
| A1 | LICENSE 実ファイル | ❌ | ファイルなし |
| A2 | .gitignore | ⚠️ | あり。`node_modules / dist / .DS_Store / *.local` のみ。`.env` `.clasp.json` の記載なし |
| A3 | dependabot.yml | ❌ | `.github/dependabot.yml` なし |
| A4 | README.md / MANUAL.md 両方 | ⚠️ | README.md はあり（開発者向け）。**MANUAL.md（先生向け）なし** |

## B. セキュリティ

| # | 項目 | 判定 | 実測 |
|---|---|:--:|---|
| B1 | CSP（connect-src が最小） | ❌ | `Content-Security-Policy` を含む HTML：**0件** |
| B2 | 秘密情報・IDの直書きなし | ✅ | `git ls-files` に `.env` `.clasp.json` なし。APIキー・メールアドレスの直書きなし |
| B3 | OAuthスコープ最小 | — | GAS を使わないため対象外 |
| B4 | postMessage の宛先が `*` でない | ✅ | `postMessage(..., '*')`：0件 |
| B5 | サーバー側5段ガード | — | サーバーを持たない（P2P + 端末内保存）ため対象外 |
| B6 | 外部CDN依存 | ⚠️ | 実行時に外部から読む：`cdn.jsdelivr.net`（KanjiVG / peerjs / qrcode / jsQR）、`unpkg.com`（フォールバック）、`fonts.googleapis.com` / `fonts.gstatic.com` |
| B7 | npm audit | ⚠️ | 本番依存：**0件**（CI の `--omit=dev --audit-level=high` は通る）。開発依存に high 3件（vite / postcss） |

## C. 堅牢性

| # | 項目 | 判定 | 実測 |
|---|---|:--:|---|
| C1 | LockService + try/finally | — | GAS 非対象 |
| C2 | 自動復旧 | ✅ | `studyLog.js` が壊れた JSON を空から復旧。`vite:preloadError` で1回だけ再読込（10秒ガード付き） |
| C3 | pagehide で記録確定 | ✅ | `src/systems/studySession.js:265` |
| C4 | 通信失敗時のリトライと明示 | ✅ | CDN は jsdelivr → unpkg の順にフォールバック。`OfflineBanner` あり |
| C5 | localStorage.clear() を使っていない | ✅ | 0件 |

## D. 表示（Part I §2）

| # | 項目 | 判定 | 実測 |
|---|---|:--:|---|
| D1 | viewport に viewport-fit=cover | ⚠️ | `index.html` は ✅。**`public/offline.html` に `viewport-fit=cover` なし** |
| D2 | 100dvh を使用（100vh 単独でない） | ⚠️ | 本体は `dvh` 4箇所で ✅。**`public/offline.html:10` が `min-height: 100vh` 単独** |
| D3 | safe-area-inset を適用 | ⚠️ | 5箇所あり。ただし左右パディングが `@media (max-width: 767px)` の中だけ。横向きの Chromebook / iPad でノッチ側が欠ける |
| D4 | clamp() による fluid type | ❌ | `clamp()` は幅指定 2箇所のみ。**文字サイズは Tailwind 固定クラス（`text-xs` 等）。`--fs-*` 変数なし** |
| D5 | Canvas に devicePixelRatio 補正（上限2） | ❌ | `devicePixelRatio`：**0件**。手書き系5ファイルは `canvas.width = size * 2` の**固定2倍**（DPR1 の Chromebook では 4倍の面積を無駄に描画、DPR3 端末では補正不足）。`Confetti.jsx` `WeatherOverlay.jsx` は**補正なし＝ぼやける** |
| D6 | 320px 幅で横スクロールが出ない | ⚠️ | 未検証（P1 で実測する） |
| D7 | 画像に width/height、150KB以下 | ❌ | `favicon.png` **225KB**（上限30KB）、`icon-512.png` **207KB**（上限60KB）、`icon-maskable-512.png` **151KB**（上限60KB）。`<img>` は1箇所のみで `width/height` なし |
| D8 | コントラスト 4.5:1 以上 | ⚠️ | 本文 `#292f36` / 背景 `#fdfbf7` = 約13:1 ✅。ただし `opacity-40` のフッター文字は 4.5:1 を下回る |
| D9 | タップ領域 44px 以上・touch-action | ⚠️ | `touch-action: manipulation` は body に ✅。`min-h-[44px]` の明示は一部のみ。`.canvas-area { touch-action: none }` 相当のCSSクラスはなし（JSXで個別対応） |
| D10 | prefers-reduced-motion 対応 | ⚠️ | framer-motion の `useReducedMotionConfig` で ✅。**CSS 側の一括ブロックがない**（framer-motion を通らない CSS transition が残る） |
| D11 | 提示モード | ❌ | `.presentation` / `requestFullscreen`：**0件**。教員ホスト画面（`TeacherHostView`）を電子黒板に映す使い方があるため必要 |
| D12 | 印刷CSS | ✅ | `src/index.css` に `@media print` あり。ただし `@page` 指定・`break-inside: avoid` なし |

## E. PWA（Part I §3）

| # | 項目 | 判定 | 実測 |
|---|---|:--:|---|
| E1 | manifest の id/scope/start_url がリポジトリ名絶対パス | ⚠️ | `scope` `start_url` は `/KANJI_Town/` で ✅。**`id` が未指定**（同一オリジンに数十アプリがあるため取り違え事故のリスク）。`display_override` `launch_handler` `dir` なし |
| E2 | アイコン4種 + apple-touch-icon | ⚠️ | 4種 ✅。**apple-touch-icon 専用画像がなく `icon-192.png` を流用**（iOS は maskable 非対応・角丸処理が別） |
| E3 | beforeinstallprompt を head 最上部で捕捉 | ❌ | **0件**。React 読み込み後にも捕捉していないため、合図を完全に取りこぼす |
| E4 | インストールボタンをアプリ内に設置 | ❌ | なし |
| E5 | sw.js が自アプリ接頭辞のキャッシュのみ削除 | ❌ | **重大違反。`public/sw.js:36-41` が接頭辞を見ずに全走査削除。同一オリジンの他アプリのキャッシュを消している** |
| E6 | sw.js が localStorage に触れていない | ✅ | 0件 |
| E7 | 更新通知（あたらしいバージョンがあります） | ⚠️ | `controllerchange` で**無言の自動リロード**。学習中に予告なく画面が飛ぶ。児童向けの案内トーストがない |
| E8 | offline.html | ⚠️ | あり。ただし**オフライン時に届かない Google Fonts を `@import` している**（＝圏外でフォントが出ない）。`100vh` 単独 |
| E9 | APP_VERSION を今回のリリース値に更新した | ⚠️ | `CACHE_VERSION = 6` を手動管理。`package.json` の version と連動していない |
| E10 | iOS の「ホーム画面に追加」手順を MANUAL に記載 | ❌ | MANUAL.md 自体がない |
| E11 | precache が addAll | ⚠️ | `cache.addAll()` のため、1本失敗すると**インストール全体が失敗**する |

## F. アクセシビリティ・性能

| # | 項目 | 判定 | 実測 |
|---|---|:--:|---|
| F1 | alt / aria-label / aria-live | ✅ | `aria-label` 43件・`aria-live` 6件・`role="dialog"` 2件・`<img>` に alt あり |
| F2 | キーボードのみで全機能に到達 | ⚠️ | 未検証。手書きキャンバスに代替入力がない（書字は本質機能のため要検討） |
| F3 | 初回JS 300KB以下 | ✅ | `scripts/check-bundle-budget.mjs` が entry 220KiB でゲート済み |
| F4 | 1ファイル 5,000行 / 400KB 以内 | ⚠️ | `src/data/iso-svg.jsx` **4,859行 / 312KB**（上限すれすれ）。`src/App.jsx` 974行 |
| F5 | テスト | ✅ | `npm test` 132件すべて成功 |

## G. 学習ログ（study.v1）

| # | 項目 | 判定 | 実測 |
|---|---|:--:|---|
| G1 | study.v1 準拠・個人情報を持たない | ✅ | `localStorage['study.records.v1']`・氏名/メール/出席番号を持たない・外部送信なし |
| G2 | 中断記録・5分ルール | ✅ | `src/systems/studySession.js` に実装済み |

---

## 対応フェーズの割り当て

| フェーズ | 内容 | 対象 |
|---|---|---|
| **P0** | LICENSE / .gitignore 追補 / dependabot.yml | A1 A2 A3 |
| **P1** | **sw.js のキャッシュ削除範囲（最優先）**・PWA一式・DPR補正・fluid type・safe-area・offline.html・提示モード・reduced-motion CSS | D1〜D5 D9〜D11 E1〜E9 E11 |
| **P2** | アイコン圧縮・`<img>` の width/height | D7 |
| **P3** | MANUAL.md 作成・README 追補 | A4 E10 |
| **P4** | 品質ゲート `scripts/check-project.mjs` + CI 組込み | 全体 |
| **保留** | CSP・外部フォントのローカル化 | B1 B6（下記） |

## 保留・人間の判断を仰ぐ項目

1. **CSP と外部CDN**
   このアプリは実行時に `cdn.jsdelivr.net`（KanjiVG の書き順SVG・peerjs・qrcode・jsQR）と
   Google Fonts を読んでいる。完全な自己ホスト化には日本語Webフォントのサブセット数百ファイルの
   同梱（数MB）が伴い、豆腐（表示できない文字）の危険がある。
   → **今回は「ワイルドカードなしの明示ホスト許可リスト」で CSP を投入し、実ブラウザで
   `Refused to` が0件であることを確認してから入れる。** 確認できなければ投入せず手順書のみ添える。

2. **開発依存の npm audit high 3件**（vite / postcss）
   本番バンドルには入らず、CI の判定（`--omit=dev`）も通る。
   メジャー更新を伴わない範囲での更新可否を確認したい。

3. **アイコンの画質**（P2）
   225KB → 30KB などの圧縮後、画質が許容範囲か目視確認をお願いする。

4. **`src/data/iso-svg.jsx` の分割**（4,859行）
   上限5,000行に迫っている。分割は**自動で行わない**。方針の合意後に1機能ずつ。

---

# 対応後の状態（2026-08-03）

品質ゲート `npm run check`：**合格 33 件 / 注意 2 件 / 不合格 0 件**
`npm test`：**142件すべて成功**（キャンバス倍率の回帰テスト10件を追加）
`npm run build`：成功・初回JS **201.9KiB**（上限 220KiB）

## 直したもの

| # | 項目 | 前 | 後 |
|---|---|---|---|
| E5 | **sw.js が他アプリのキャッシュを削除** | ❌ 全走査削除 | ✅ `kanji-town-` 接頭辞のみ（実機で他3アプリの残存を確認） |
| — | **オフラインで真っ白になる** | ❌ 起動不可 | ✅ 起動する（着手前から存在した不具合） |
| E7 | 更新通知 | ⚠️ 無言で自動リロード | ✅ トーストで確認してから切替 |
| E3/E4 | インストール | ❌ 合図の捕捉もボタンも無し | ✅ `<head>`最上部で捕捉＋せってい画面にボタン＋iOS手順 |
| E1 | manifest の `id` | ⚠️ 未指定 | ✅ `/KANJI_Town/`（`display_override`・`launch_handler`・`dir` も追加） |
| E2 | apple-touch-icon | ⚠️ icon-192 を流用（透過が黒くなる） | ✅ 背景を敷いた180px専用画像 |
| E8 | offline.html | ⚠️ 圏外で届かない外部フォントを`@import` | ✅ 端末内フォント・`100dvh`・セーフエリア・44px |
| E9 | APP_VERSION | ⚠️ 手動管理・連動なし | ✅ `package.json` と一致（不一致はCIが検出） |
| E11 | precache | ⚠️ `addAll`（1本失敗で全滅） | ✅ 1件ずつ・失敗は無視 |
| D5 | Canvas の DPR 補正 | ❌ 一律2倍・紙吹雪と天気は補正なし | ✅ `min(dpr, 2)` に統一（回帰テスト付き） |
| D4 | fluid type | ❌ なし | ✅ `--fs-body/lead/title/hero` を `clamp()` で定義 |
| D3 | safe-area 左右 | ⚠️ 幅767px以下のみ | ✅ 全画面幅（横向きのノッチ対策） |
| D10 | reduced-motion | ⚠️ framer-motion のみ | ✅ CSS 側の一括指定を追加 |
| D11 | 提示モード | ❌ なし | ✅ 「ドリルを送る」に大きく表示＋全画面 |
| D12 | 印刷CSS | ⚠️ `@page` なし | ✅ A4縦・色保持・`break-inside: avoid` |
| D1/D2 | offline.html の viewport / 100vh | ❌ | ✅ |
| D7 | 画像サイズ | ❌ 合計688.9KB | ✅ 合計152.0KB（77%減・全て上限内） |
| A1/A2/A3 | LICENSE / .gitignore / dependabot | ❌ | ✅ |
| A4/E10 | MANUAL.md | ❌ なし | ✅ 作成（iOSのホーム画面追加手順を含む） |

## 320px〜1920px の実測（Chromium 実機）

| 画面幅 | 横スクロール | 描画 | JSエラー |
|---|:--:|:--:|:--:|
| 320×568（設計下限） | ✅ なし | ✅ | ✅ 0件 |
| 375×667（iPhone SE） | ✅ なし | ✅ | ✅ 0件 |
| 810×1080（iPad） | ✅ なし | ✅ | ✅ 0件 |
| 1366×768（Chromebook） | ✅ なし | ✅ | ✅ 0件 |
| 1920×1080（教員PC） | ✅ なし | ✅ | ✅ 0件 |

※ 検証環境のプロキシが `fonts.googleapis.com` と `cdn.jsdelivr.net` を遮断するため、
その2件の通信失敗は集計から除外している（アプリ側の不具合ではない）。

## 残していること（次のPRで扱う）

| # | 項目 | 理由 |
|---|---|---|
| B1 | **CSP 未導入** | 許可すべきホストは4件に確定した（`quality.config.json` に記録済み）。ただし本番相当の通信を通した確認が今回の環境ではできないため、未検証のまま入れない |
| B6 | 外部フォントのローカル化 | 日本語サブセット数百ファイル（数MB）の同梱が必要で、豆腐の危険がある。効果と副作用の判断を仰ぎたい |
| B7 | 開発依存の npm audit high 3件 | 本番バンドルには入らず CI も通る。メジャー更新を伴わない範囲での更新可否を確認したい |
| F4 | `src/data/iso-svg.jsx` 4,860行 | 上限5,000行に接近。**分割は自動で行わない**（規約§P3）。方針合意後に1機能ずつ |
| F2 | 手書きのキーボード代替 | 書字が本質機能のため、代替手段の設計自体に検討が必要 |
| D8 | `opacity-40` の文字コントラスト | フッター等。UIの見た目に関わるため別PR（規約§絶対安全規則6） |
