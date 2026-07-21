# アカウント・クラウド同期の設定

漢字タウンはSupabase AuthとPostgresを使って、利用者本人の学習データだけを端末間で同期します。環境変数がないビルドではクラウド機能だけが無効になり、従来のローカル保存はそのまま利用できます。

## 1. Supabaseプロジェクト

1. Supabaseでプロジェクトを作成します。
2. SQL Editorで次のmigrationを番号順に実行します。
   - `supabase/migrations/202607210001_cloud_sync.sql`
   - `supabase/migrations/202607210002_learning_sharing.sql`
3. AuthenticationのEmail providerを有効にします。
4. URL Configurationへ本番URLとローカル開発URLを登録します。
   - `https://gigayama.github.io/KANJI_Town/`
   - `http://localhost:5173/KANJI_Town/`

SQLにはRLSポリシーが含まれ、未認証利用者を拒否し、認証済み利用者も自分の1行だけを読み書きできます。ブラウザへservice role keyを設定してはいけません。

## 2. ローカル開発

`.env.example` を参考に `.env.local` を作成し、SupabaseのProject URLとpublishable/anon keyを設定します。

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
```

## 3. GitHub Pages

リポジトリのSettings → Secrets and variables → Actionsへ次のRepository secretsを登録します。

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

どちらもフロントエンド用の公開設定です。データ保護はキーの秘匿ではなく、認証トークンとRLSで行います。

## 4. 同期動作

- ログイン後、クラウドが空なら現在の端末データを初回保存します。
- 新しい端末が未学習状態ならクラウドデータを自動復元します。
- 一方だけが更新されていれば新しい側を自動採用します。
- 両方が更新されている場合は自動上書きせず、設定画面で「この端末」または「クラウド」を選択します。
- 共有端末で別のアカウントへ切り替えた場合、以前の利用者のデータは自動送信せず、明示的な選択を求めます。
- 更新はrevisionによる楽観ロックで、同時更新を検知します。

## 5. 教師・保護者との見守り共有

- 児童側が「児童の表示名」と共有先（保護者・先生）を選び、15分間・1回限りの招待コードを発行します。
- 招待コードは80bitの乱数で生成し、サーバーにはSHA-256ハッシュだけを保存します。
- 見守り側には、進捗、学習習慣、4技能、復習支援に必要な漢字だけを表示します。
- メールアドレス、まち、設定、ドリル、個々の回答履歴、クラウド保存本体は共有しません。
- 共有関係は児童側・見守り側のどちらからでも解除できます。1児童あたりの共有先は最大10人です。
- レポート取得は `security definer` のDB関数へ限定し、`authenticated` だけに実行権限を与えています。関数はログイン中の利用者が結ばれた児童の要約だけを返します。
