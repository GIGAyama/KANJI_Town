# アカウント・クラウド同期の設定

漢字タウンはSupabase AuthとPostgresを使って、利用者本人の学習データだけを端末間で同期します。環境変数がないビルドではクラウド機能だけが無効になり、従来のローカル保存はそのまま利用できます。

## 1. Supabaseプロジェクト

1. Supabaseでプロジェクトを作成します。
2. SQL Editorで `supabase/migrations/202607210001_cloud_sync.sql` を実行します。
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
