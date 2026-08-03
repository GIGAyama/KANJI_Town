# GIGA Standard v4 監査：マイ漢字タウン（KANJI_Town）

実施日：2026-08-03 / 対象コミット：`847d2f5` / 判定はすべて **実測値** に基づく。

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
