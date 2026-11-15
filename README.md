# マイ漢字タウン（KANJI_Town)

教育漢字1026字を「読み・意味・書字・筆順」の4技能で学ぶ、小学生向けの漢字学習アプリ。
学習するほど自分の町が育つ。GIGA山 学習アプリ群の一員として `https://kanji-town.giga-school.com/` で公開している。

- **対象**：小学1〜6年。学年別漢字配当表（2020年改訂）に準拠し、1年80字／2年160字／3年200字／4年202字／5年193字／6年191字＝**計1026字**を収録（`src/data/kanji-data.js`）。
- **必要なもの**：ブラウザだけ。アカウント登録・ログイン・課金はなく、サーバーも持たない。学習の記録は端末の `localStorage` にだけ保存する。
- **使い方マニュアル** → [`docs/manual/manual.md`](./docs/manual/manual.md)（画面写真40点・専門用語なし・「うまくいかないとき」付き）。
  児童向けに書き、ドリル配布やデータ移行など先生だけが使う章には「（先生向け）」と付けている。
  公開先は <https://giga-school.com/apps/kanji-town/manual/>（旗艦リポジトリが毎朝組み立てる）。

## 🎯 できること

### 毎日の学習（ホームの赤い大きなボタン）

学年（1〜6年）を選ぶと、その日に出す漢字を自動で組み立てる（`src/systems/learning-plan.js`）。

- **出題の内訳**：間隔反復（SRS）で復習期限が来た字を優先し、残りの枠にその学年の新出字を足す。
  ボタンには実際に出る内訳が出る（例：`きょうの10字：復習7＋新出3`）。
- **1回の量**：設定で「少なめ（復習10＋新出3）／ふつう（復習20＋新出5）／多め（復習30＋新出8）」から選ぶ。
- **1日の目標**：5／10／20字から選ぶ（既定10字）。目標に届くまでは、1回のセッションを目標の残り字数で短く区切る。
  達成後は設定どおりの量に戻り、続きを自由に学習できる。
- **1字の流れ**：`音読 → 書き順を見る → なぞる → テスト` の4段階。
  はじめての字は4段階を順に通る。既習の字は、4技能の習熟度から**その字に必要な段階**を選んで始める（`src/systems/mastery.js`）。
- **中断からの復帰**：学習中は回答と残りの出題を都度保存する。タブが落ちても次回起動時に途中から再開できる（`src/systems/session-checkpoint.js`）。

### 4技能の習熟度

読み・意味・書字・筆順を、それぞれ0〜100点で別々に記録する（`src/systems/mastery.js`）。
「読めるが書けない」「形は取れるが書き順が怪しい」を切り分け、次に出す練習段階の判断に使う。

### 書字の正誤判定

書き順・字形・とめはね・点画の交差の判定は `src/systems/strokeGrader.js` に集約し、
テスト・ドリル・ボスバトル・サバイバルで同じ採点を共有する。

- 100点満点の内訳は 字形30／書き順25／とめはね15／交差10／始点10／終点10（`src/constants/gameConfig.js`）。
- 書き順を間違えたときは上限69点。見た目が同じでも合格させない。
- マイドリルのテストは70点以上で合格。
- 配点と設計の根拠は [`docs/stroke-grading.md`](./docs/stroke-grading.md) を参照。

### 特別トレーニング（1字でも学習すると解放）

| モード | 出題 |
|---|---|
| フラッシュ | 学習済みの字からランダム10字 |
| サバイバル | 学習済みの字を続く限り |
| ボスバトル | まちがいの多い字10字。負けても報酬は半額で残り、失敗した字はすぐ復習対象へ戻る |

### 音読チャレンジ

音読フェーズで、マイクを使って「実際に声に出して読んだか」を確認する任意のチャレンジ。
クリアでボーナス10EXP。できなくても学習の進行はブロックしない（設定でオフにもできる）。

### マイドリル（先生が作って配る）

学年でしぼって漢字をタップで選び、名前を付けて保存する。作ったドリルは
**練習／テスト（10・20・50・100問から選択）／リンクで配る／4けたの数字で送る／削除** ができる。
テストのあとは、まちがえた字だけの練習へそのまま進める。

### 学習きろく・図鑑・実績

- **学習きろく**：習得／学習中／未学習の内訳、4技能の習熟度、7日間の学習グラフ、
  さいきんのとりくみ、これから7日間の復習予報、苦手な字だけの集中練習。
- **図鑑**：1026字を学年・漢字・読みで検索。学年ごとの習得数を表示し、選んだ1字だけの練習も始められる。
- **実績**：92種類。達成するとコイン・EXP・建物アイテムがもらえる。

### 町づくり（学習の動機づけ）

- 50×50マスのマップ。字を習得するとその字の**住民**が増え、レベルが上がると探索範囲が広がる。
- **クラフト**（Lv3で解放）：学習中に集まった素材で121種のレシピから建物・加工素材を作る。
- **ガチャ**：100コインで1回、10連もある。建物アイテムが手に入る。
- **住民の満足度**が獲得EXPの倍率になる（0.7〜1.3倍）。建物の種類・自然物・連続日数で上がり、過密や雑草で下がる。
- **デイリーミッション／ログインボーナス／天気**あり。
- **しばらく開かないと町は荒れる**：1日で雑草、3日で住民の一部が去り、7日で建物が荒れ地に戻る（学習するとその場で雑草を除去する）。
- **おやすみパス**：1日休んでも連続記録を自動で守る。使うと5日の学習で貯まり直す（`src/systems/habit.js`）。

### レベルと報酬

Lv1〜Lv100。上がるとコイン・建物アイテム・探索範囲の拡大・テーマ色が解放される（`src/utils/level-system.js`）。

### 設定でできること

テーマ7種（じどう＝レベル連動／ベーシック／さくら／うみ／ゆうやけ／おうごん／ダーク）、
画面のうごき（じどう・標準・少なめ）、音量4段階、ふりがな表示、お手本の自動再生、
音読チャレンジのオン/オフ、1回のセッション量、1日の学習目標、
データのエクスポート／インポート／全消去、ホーム画面へのインストール、
アプリの状態とサポート（診断）。

## 開発

```bash
npm install
npm run dev     # 開発サーバー
npm test        # node --test
npm run check   # 品質ゲート（GIGA Standard v4）
npm run build   # ビルド + バンドル予算チェック
```

CI（`.github/workflows`）は `main` への push と PR で `npm test` → `npm run check` →
`npm audit --omit=dev --audit-level=high` → `npm run build` を実行し、push のときだけ
GitHub Pages へデプロイして配信中のcommit SHAまで確認する。

## 📲 PWA

ホーム画面に入れるとアプリとして起動し、オフラインでも使える。

- `public/manifest.json` … `id` / `scope` / `start_url` はすべて `/`（独自ドメイン
  `kanji-town.giga-school.com` の直下で配信しているため）。**この3つは配信の基点と
  必ず一致させる。** ずれるとホーム画面から起動したときに存在しないパスへ飛び、
  真っ白な画面になる（`gigayama.github.io/KANJI_Town/` から移行した際に実際に起きた）。
  値は `quality.config.json` の `basePath` と突き合わせて `npm run check` が確認する。
- アプリ内で配信パスを直書きしない。`src/systems/base-path.js` から求める
  （`public/sw.js` は自分の `self.location` から求める）。直書きは配信先が変わった
  瞬間に404を指し、Service Worker の登録もインストールも黙って壊れる。
- `public/sw.js` … キャッシュ名は必ず `CACHE_PREFIX`（`kanji-town-`）で始める。
  **`activate` で接頭辞を確認せずにキャッシュを消してはいけない**（同一オリジンの
  他アプリのオフライン起動を壊す）。Service Worker から `localStorage` に触れるのも禁止。
- `APP_VERSION`（`public/sw.js`）は `package.json` の `version` と一致させる。
  ずれていると `npm run check` が落ちる。**リリースのたびに両方上げる。**
- 更新は無言で適用せず、`UpdateToast` で児童に確認してから切り替える
  （学習の途中で画面が飛ばないようにするため）。実装は `src/systems/pwa.js`。
- インストールの合図（`beforeinstallprompt`）は `index.html` の `<head>` の最初に読む
  `public/install-hook.js` で受け取る（CSP のためインラインには書かない）。**defer / async を付けたり、
  ほかの読み込みより後ろに移したりすると、通信が遅い端末で取りこぼす。**`npm run check`（C7）が見る。

## 🔐 セキュリティ設計

サーバーを持たない構成のため、信頼境界は「端末の中」だけで完結する。

- 学習の記録・ドリルはすべて端末の `localStorage` に保存し、外部送信しない。
  例外は、先生が「4けたの数字で送る」で送るドリル（下記）と、`*.giga-school.com` で開いたときに
  学習ログ（`study.records.v1`）を記録ボックスへ写すこと（同じ端末の iframe へ postMessage するだけ）。
  外部との通信の一覧は「制限とクォータ」と `privacy.html` の「5. 外部との通信」にある。
- ドリルの受け渡しはサーバーに保存しない。リンク配布はURLに内容を埋め込み
  （`src/systems/drill-share.js`）、教室内配布は PeerJS の P2P 通信を使う。
  **受け取ったドリルは外部入力として扱い、取り込み時に検証する。**
- 「4けたの数字で送る」は、PeerJS の公開サーバー（`0.peerjs.com`）の上で
  `kanji-town-` ＋ 4けたの ID を使う。この名前空間は全国の利用者で共有なので、
  打ちまちがい・偶然の衝突・先に同じ数字を取った第三者につながる余地がある。そのため:
  - 受け取ったメッセージは 8,192 字を超えたら開かずに捨て、リンクと同じ形（`param`）を
    `decodeDrillParam` に通す（名前40字・漢字300字・ID の形・重複除去。余分な欄は捨てる）。
    実装は `src/systems/drill-p2p.js`。このアプリに無い漢字 ID は保存の前に落とす。
  - 保存する前に、ドリルの名前と漢字に加えて「かくにんの しるし」（中身から作る絵2つ）を
    先生の画面と児童の画面の両方に出し、見くらべてから保存してもらう。違えば「うけとらない」。
  - 保存は即時（`saveStatsImmediate`）。受け取ったら接続を閉じ、確認中に差し替えられないようにする。
  - 数字を6けたにする・接頭辞を変えるといった手は、教室での入力の手間と、更新前の版の端末との
    互換が崩れるため取っていない。外部のサーバーを使わずに配りたいときは「リンクで配る」を使う
    （つながらないときは送る画面からそちらへ案内する）。
- 音読チャレンジの音声は音量（RMS）に変換して判定に使うだけで、録音・保存・送信をしない。
  クラウド音声認識（`SpeechRecognition`）は音声が外部へ出るため使用しない。
- APIキー・スプレッドシートID・メールアドレスの直書きはない。
  `.env` / `.clasp.json` は `.gitignore` 済み。
- `localStorage.clear()` は使わない。`study.records.v1` はアプリ間共有キーであり、
  リセット処理の対象に含めない。

- **CSP（Content-Security-Policy）を `index.html` の `<meta>` に置いている**（GitHub Pages は応答ヘッダを
  足せないため。`frame-ancestors` と `report-uri` は meta では効かない）。中身は
  `script-src 'self'`（同梱した JS だけ。インラインの script とイベント属性は動かない）、
  `connect-src 'self' https://0.peerjs.com wss://0.peerjs.com`（「4けたの数字で送る」の仲介だけ）、
  `frame-src https://gamification.giga-school.com`（学習ログの写し）、`img-src 'self' data: blob:`、
  `font-src 'self'`、`object-src 'none'` など。`style-src` だけは React が `<style>` 要素を作る箇所が
  あるため `'unsafe-inline'` を残している。
  - `privacy.html` / `terms.html` / `offline.html` は何も読みこまないので `default-src 'none'`。
    `offline.html` の「もう一度ためす」は、onclick ではなくアプリの入口へのリンク。
  - インストールの合図の捕捉は `public/install-hook.js` に出してある（インラインの script をなくすため）。
  - 開発サーバー（`npm run dev`）では `vite.config.js` が CSP を外す（Vite が開発用のインライン script を入れるため）。
    ビルドした配信物には必ず残り、`npm run check`（B5）が全ページの CSP・`script-src`・インラインの
    script とイベント属性・`dist/index.html` を見る。
  - 外部の接続先を足すときは、CSP・`quality.config.json`・`privacy.html`・下の「制限とクォータ」を同時に直す。
  - `public/records-export.html` は正本の配布物なので、CSP は正本（`standards/records/`）で入れる。

## ⚠️ 制限とクォータ

| 項目 | 制限 | 影響と対処 |
|---|---|---|
| 書き順データ | 同梱（`public/kanjivg/grade-1〜6.json`、計約0.9MB・gzip 約0.36MB） | 外部へは取りに行かない。Service Worker が全学年を先読みするので、一度開いた端末は圏外でも全学年の書き順が出る。それでも読めない字（データ破損など）は、音読だけ字（フォント）で続け、書く段階は「この字は あとで」で飛ばせる（正誤は記録しない。次の学習でまた出る） |
| 外部への接続（「4けたの数字で送る」だけ） | ライブラリ（PeerJS 1.5.4）は同梱。接続の仲介に PeerJS の公開サーバー `0.peerjs.com`（https / wss）、経路探しに `stun.l.google.com:19302`、直接つながらないときの中継に `eu-0.turn.peerjs.com` / `us-0.turn.peerjs.com`（3478）。値は `src/hooks/usePeerJS.js` の `PEER_OPTIONS` | 校内フィルタでこれらが止められていると送れない。そのときは送る画面に理由と「リンクで配る」ボタンが出る。リンク配布は外部へ通信しないので影響を受けない |
| 学習ログの写し | `*.giga-school.com` で開いたときだけ、`public/records-hub-client.js` が `https://gamification.giga-school.com/records-hub.html` を見えない iframe で開き、学習ログを postMessage で写す | ハブのページを読む通常のアクセスだけで、学習ログはサーバーへ送らない。止められていても学習には影響しない |
| QR（表示・読み取り） | `qrcode`（表示）と `jsQR`（カメラ読み取り）を同梱し、使う画面を開いたときに読む | 外部へは取りに行かない。読めなかったときは「URLをコピー」「4けたの数字」を使うよう画面に出る |
| 書体 | 同梱（`src/fonts/`、woff2 11本・計約1.17MB。`unicode-range` で束に分けてある） | 外部へは取りに行かない。端末は画面に要る束だけを読む。書体に無い字（児童が入力した珍しい字など）は端末の書体で出る（□にはならない） |
| 共有リンクの長さ | 目安1800字で警告 / QRは1000字まで | 漢字を入れすぎるとURLが長くなる。ドリルを分ける |
| 共有できるドリル | 名前40字・漢字300字まで（`?drill=` は4000字まで） | 超えた分は取り込み時に切り捨てる |
| localStorage | 端末ごと数MB | 上限に達すると `StorageErrorBanner` が出る。エクスポートして整理する |
| iOS Safari (ITP) | 未使用7日で localStorage が消える | ホーム画面追加を推奨し、エクスポートを案内する（`docs/manual/manual.md`） |
| Chromebook | メモリ4GBでタブが破棄される | `pagehide` で記録を確定。キャンバスの描画倍率は上限2に固定 |
| 初回JS | 220KiB（`scripts/check-bundle-budget.mjs`） | 超えるとビルドが落ちる |

外部ホストの許可理由は `quality.config.json` の `securityExceptions` に明記してあり、
`npm run check` がここに無いホストの追加を検出する。ただし検出はソースに書かれた `https://` の
文字列だけを見る。`stun:` / `turn:` のような URL は見えないので、PeerJS の接続先は
`src/hooks/usePeerJS.js` の `PEER_OPTIONS` に書き出し、`index.html` の CSP と並べて管理する。
外へ出る通信を実ブラウザで確かめるときは、ポータルの `standards/web/verify-no-external.mjs` を使う。

## マイドリルの配り方

先生が作ったマイドリル（マイドリル画面）は、2通りの方法で児童に配れる。

### リンクで配る（Google Classroom など）

マイドリル一覧の「リンク」ボタンから、ドリルの中身をそのまま埋め込んだURLを作る。
コピーしてClassroomの課題・資料に貼れば、児童はリンクを開くだけで受け取れる。
「Google Classroom で共有する」ボタンは Classroom の共有画面
（`https://classroom.google.com/share?url=...`）を開くだけなので、
アカウント連携もAPIキーも要らない。

- ドリルの中身（名前と漢字ID）は**URLの中だけ**にあり、サーバーへの保存・送信は一切しない。
  実装は `src/systems/drill-share.js`（JSONをbase64urlに変換。漢字IDは学年ごとに畳んで短縮する）。
- リンクを開くと確認画面（`drillImport`）になり、マイドリルへ保存するか、そのまま練習するかを選べる。
  受け取りは一度きりなので保存は即時保存で行い、確認画面は履歴に残さない（二重保存の防止）。
- 起動時に読んだ `?drill=` パラメータはURLから消す（再読み込みで受け取り直さないようにする）。
- 配ったあとにドリルを直しても、すでに配ったリンクの中身は変わらない。リンクを配り直す。
- URLが長くなりすぎる場合（目安1800字超）は共有画面で警告する。
  QRコードは読み取れる長さ（目安1000字まで）のときだけ表示する。

### 4けたの数字で送る（同じ教室にいるとき）

マイドリル一覧の「送る」ボタンから、PeerJS のP2P通信でその場にいる端末へ直接送る
従来の方法（`peerHost` / `peerClient`）。送る側の画面には4けたの数字とQRコードが出る。
電子黒板に映すための提示モード（`PresentationToggle`：文字1.5倍＋全画面）も同じ画面にある。

## 音読チャレンジとマイク

通常学習モードの音読フェーズには、マイクで「実際に声に出して読んだか」を
確認する任意の音読チャレンジがある（クリアでボーナスEXP。進行はブロックしない）。

- マイクの音声は**その場で音量（RMS）に変換して発声判定に使うだけ**で、
  録音・保存・外部送信は一切しない。判定後はマイクを即座に解放する。
- クラウド音声認識（Web Speech API の `SpeechRecognition`）は音声が外部サーバーへ
  送信されるため使用しない（上記「外部送信は一切行わない」方針による）。
- お手本の読み上げは端末内蔵（`localService`）の日本語音声だけを使う。
- マイクが使えない端末・許可されていない環境では、チャレンジは自動的に
  案内表示へ切り替わり、学習は通常どおり進められる。
- 設計と調整パラメータは [`docs/reading-check.md`](./docs/reading-check.md) を参照。

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
廃止した（仕様書 §8）。詳細は [`docs/study-log.md`](./docs/study-log.md) を参照。

## ドキュメント

| ファイル | 内容 |
|---|---|
| [`docs/manual/manual.md`](./docs/manual/manual.md) | 使い方マニュアル（画面写真つき・児童向け／先生向けの章あり） |
| [`docs/stroke-grading.md`](./docs/stroke-grading.md) | 書字採点の配点と設計の根拠 |
| [`docs/reading-check.md`](./docs/reading-check.md) | 音読チャレンジの判定設計と調整値 |
| [`docs/study-log.md`](./docs/study-log.md) | 学習ログ `study.v1` の実装 |
| [`docs/operations.md`](./docs/operations.md) | 運用・障害対応・診断ファイルの扱い |
| [`AUDIT.md`](./AUDIT.md) / [`ROLLOUT.md`](./ROLLOUT.md) | 監査結果とロールアウト記録 |


## 素材とライセンス

このアプリは、次の第三者の成果物を使っています。

| 使っているもの | 用途 | ライセンス |
| --- | --- | --- |
| [KanjiVG](https://kanjivg.tagaini.net/) | 漢字の字形と書き順（なぞり書き・お手本・採点） | **CC BY-SA 3.0** © Ulrich Apel / KanjiVG contributors |
| [jsQR](https://github.com/cozmo/jsQR) 1.4.0（npm で同梱） | QR コードの読み取り | Apache License 2.0 |
| [PeerJS](https://peerjs.com/) 1.5.4（npm で同梱） | 端末どうしの通信 | MIT License |
| [qrcode](https://github.com/soldair/node-qrcode) 1.5.4（npm で同梱） | QR コードの生成 | MIT License |
| Zen Maru Gothic / Klee One（Google Fonts から取り寄せて同梱） | 画面の書体 | SIL Open Font License 1.1（`public/fonts/OFL.txt`） |

**書き順データについて。** 本アプリは KanjiVG の **`r20260714`（commit `d95a9762`）** から、
教育漢字1026字の各画の `d` 属性と `kvg:type` だけを取り出した学年別の JSON
（`public/kanjivg/grade-1.json`〜`grade-6.json`）を同梱し、字形の表示・なぞり書きの採点に使っています。
実行時に外部から取得することはありません。版を固定しているので、端末によって手本や採点の基準が変わることもありません。

- 作り方: `node tools/build-kanjivg.mjs`（固定したコミットを `raw.githubusercontent.com` から取り寄せて書き出す。
  手元の SVG から作るときは `--src <フォルダ>`、コミット済みの生成物と同じかを見るだけなら `--check`）
- 版を上げるときは `tools/build-kanjivg.mjs` の `KANJIVG_TAG` と `KANJIVG_COMMIT` を両方変え、生成物をコミットする。
  `test/kanjivg-data.test.js` が、漢字一覧（学年の配当）と生成物がずれていないかを見る。

KanjiVG は **クリエイティブ・コモンズ 表示 - 継承 3.0（CC BY-SA 3.0）** で提供されており、
派生物である同梱データも同じ CC BY-SA 3.0 で配布します（出典・版・変更点は各 JSON の先頭と
`public/kanjivg/LICENSE.txt` に記載）。アプリの「このアプリについて」にも同じ表示を入れています。

**書体について。** 画面の書体は Google Fonts から**ビルドの前に**取り寄せ、必要な字だけにしたもの
（`src/fonts/*.woff2` と `src/fonts/fonts.css`）を同梱しています。実行時に Google Fonts へは通信しません。
`src/index.css` が `fonts.css` を取りこみ、ビルドでファイル名にハッシュが付いて `assets/` に出ます。

- Zen Maru Gothic 500/700/900: かな・英数・記号・教育漢字1026字と、`src/`・`index.html` に出る字（計1,681字、3束）
- Klee One 600: 教育漢字1026字だけ（漢字を1字だけ大きく見せる所にしか使わないため。400 は使っていないので入れない）
- 作り直し方: 設定は `fonts.config.json`。道具は艦隊の正本 `standards/fonts/build-fonts.mjs` で、
  このリポジトリにはまだ配られていない。ポータル（`GIGAyama.github.io`）を隣に置き、
  このリポジトリの直下で `node ../GIGAyama.github.io/standards/fonts/build-fonts.mjs` を走らせる
  （正本が `tools/fonts/` に配られたあとは `node tools/fonts/build-fonts.mjs`）。
  `src/fonts/` と `public/fonts/OFL.txt` が書き直されるので、そのままコミットする。
- 画面に新しい字を足したときは作り直す。作り直さなくても、その字だけ端末の書体で出る。
  `test/fonts-config.test.js` が、かな・英数・教育漢字が全ウェイトに入っていることを見て、
  画面に出るのに書体に無い字があれば知らせる。
- 両書体とも SIL Open Font License 1.1。本文と著作権表示を `public/fonts/OFL.txt` に置いている
  （Reserved Font Name は無い）。

**npm で同梱した部品について。** PeerJS・qrcode・jsQR とそれらが使うパッケージの著作権表示と
ライセンス本文は `public/licenses/third-party.txt` に置き、配信物にも入れています
（jsQR の Apache License 2.0 は、配る相手にライセンスの写しを渡すことを求めるため）。
依存の版を上げたら作り直してください。

このリポジトリの LICENSE（MIT）は、**自作のソースコードにのみ適用されます。**
上記の第三者の成果物には、それぞれのライセンスが適用されます。
