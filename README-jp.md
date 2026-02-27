# MidNight Network

[Misskey](https://misskey-hub.net/)サーバー上で毎日定時開催される、
投稿時間競技ゲームのランキング集計・リーダーボードシステム

[English README](./README.md)

## 概要

MidNight Networkは、毎日同時刻に開催されるMisskey上のノートをすることに酔って参加できるゲームで、
特定の文字列を投稿すると、そのノートの投稿時間を集計してランク付け・可視化する総合Webアプリケーションです。

### 主な機能

- **7(中間ランク含め13)段階のランクシステム** - ポイントベースの段位制(ランクなし〜最上位ランク)
- **自動マッチ処理** - Misskeyタイムラインから日次の結果を Cron ジョブで自動集計
- **複数のリーダーボード** - ランクポイント、勝率、平均タイム、マッチタイム
- **ユーザープロフィール・分析** - 獲得ポイント推移、ヒートマップ、レーダーチャート、投稿時間傾向などの詳細統計
- **連続記録トラッキング** - 連続参加、連続圏内、連続欠席、連続フライングの記録とボーナスポイント
- **降格保護** - ランク境界付近のプレイヤー向けの降格防止システム
- **プッシュ通知** - Web Push API によるマッチ結果の通知
- **プライバシー設定** - リーダーボードやプロフィールの公開範囲を細かく設定可能

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| **フロントエンド** | SvelteKit (Svelte 5), Vite, TanStack Query, TanStack Table, ECharts, Motion |
| **バックエンド** | Cloudflare Workers, Elysia, oRPC |
| **認証** | Better Auth + MiAuth (Misskey) |
| **データベース** | Cloudflare D1 (SQLite) + Prisma ORM |
| **共有** | oRPC コントラクト, Zod スキーマバリデーション |
| **ランクエンジン** | TypeScript 製カスタム計算モジュール |
| **コード品質** | Biome (lint + format), Lefthook (git hooks) |

## プロジェクト構成

pnpm workspace を使用したモノレポ構成です:

```
packages/
├── backend/     Cloudflare Workers API サーバー (Elysia + Prisma + D1)
├── frontend/    SvelteKit Web アプリケーション (静的アダプター)
├── shared/      oRPC コントラクト・共有型定義
└── rank-calc/   ランキング計算エンジン
```

## 必要要件

- [Volta](https://volta.sh/): Node.jsとpnpmのバージョンを自動管理(`package.json`で固定)
  - Node.js: `24^`
  - pnpm: `10^`
- [Cloudflare](https://www.cloudflare.com/): アカウント(D1, KV, R2, Workers, Queues用)
- [Misskey](https://misskey-hub.net/): インスタンスへのアクセスと API トークン

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/Secineralyr/midnight-network.git
cd midnight-network
```

### 2. 依存関係のインストール

```bash
pnpm install --frozen-lockfile
```

### 3. 環境変数の設定

バックエンド側でテンプレートをコピーして値を設定:

```bash
cp packages/backend/.dev.vars.template packages/backend/.dev.vars
```

| 変数 | 説明 |
|------|------|
| `MK_HOST` | Misskeyインスタンスのホスト名 |
| `API_TOKEN` | Misskey APIトークン |
| `WEB_HOST` | フロントエンドのホスト名 |
| `BACKEND_HOST` | バックエンドのホスト名 |
| `BOT_USER_NAME` | Misskey上のボットユーザー名 |
| `DISABLE_USER_NAME` | 除外するユーザーId(JSON配列 `string[]`) |
| `ADMIN_USER_NAME` | 管理者ユーザー名 |
| `WEBHOOK_SECRET` | Webhookシークレットキー |
| `VAPID_PRIVATE_KEY` | プッシュ通知用VAPID秘密鍵 |
| `BETTER_AUTH_SECRET` | 認証セッション暗号化用シークレットキー(32文字以上) |

**フロントエンド** - テンプレートをコピーして設定:

```bash
cp packages/frontend/template.env packages/frontend/.env
```

| 変数 | 説明 |
|------|------|
| `VITE_API_ROOT` | バックエンドAPIのURL(同一オリジンの場合は空) |
| `VITE_MOCK_AUTH` | 開発用モック認証の有効化 |
| `VITE_TARGET_HOUR` | マッチ目標時刻(UTC)の「時」(デフォルト: `15`) |
| `VITE_TARGET_MINUTES` | マッチ目標時刻(UTC)の「分」（デフォルト: `0`） |
| `VITE_VAPID_PUBLIC_KEY` | プッシュ通知用VAPID公開鍵 |

### 4. ローカルデータベースのマイグレーション

prismaの型を生成するため、この操作は開発をしない場合でも必須です。

```bash
pnpm --filter @midnight-network/backend migrate:local
```

### 5. 開発サーバーの起動(開発時)

```bash
# フロントエンド（ポート 5173）
pnpm front:dev

# バックエンド（ポート 8787）
pnpm back:dev
```

フロントエンドの開発サーバーは `/api` へのリクエストを自動的にバックエンドへプロキシします。

### 6. ビルド(デプロイ時)

```bash
pnpm -r build
```

### 7. バックエンド`wrangler.toml`設定

以下の項目をwranglerで定義する必要があります。
このとき、変更項目に対してEnvironmentを分割することを推奨します。

以下の項目は主にデプロイ時に必要になります。

- `routes`: Backendではhostに対してapiとwebhookパスを許可します
- `kv_namespaces`: `id`を`pnpm wrangler kv namespace create <name>`で生成されたidに置き換える(SESSIONとCACHEで2つ必要であることに注意！)
- `r2_buckets`: `bucket_name`を`pnpm wrangler r2 bucket create <bucket_name>`で生成されたbucket_nameに置き換える
- `queues`(producersとconsumers): `queue`を`pnpm wrangler queues create <name>`で生成されたnameに置き換える(producersとconsumersで使われるqueueは同一のものでないといけないことに注意！)
- `d1_databases`: `database_name`と`database_id`を`pnpm wrangler d1 create <name>`で生成されたものに置き換える

その他状況に合わせて以下の項目を編集します。

| 変数 | 説明 |
|------|------|
| `ENVIRONMENT` | 現在のEnvironment、本番環境以外ではproductionにしないこと |
| `GAME_JOIN_POST_TEXT_REGEX` | ノート集計対象の文字列を含む正規表現 |
| `TARGET_MATCH_HOUR` | 集計対象の指定時間(UTC)の「時」 |
| `TARGET_MATCH_MINUTES` | 集計対象の指定時間(UTC)の「分」 |
| `POST_MATCH_RESULT_TITLE` | 集計結果をノートする際のタイトル |
| `POST_MATCH_RESULT_URL` | 集計結果をノートに入れるフロントエンドURL |
| `POST_MATCH_RESULT_TEMPLATE` | 集計結果をノートの文章(波括弧でフォーマットに対する文章割当をします。`{title}`: タイトル / `{ranks}`: ランキング(10位) / `{valid}`: 有効記録数 / `{flying}`: フライング記録数 / `{url}`: URL) |
| `DISABLE_POST_MATCH_RESULT` | 集計した際の結果ノート投稿を無効にします |
| `POST_MATCH_REMIND_TEXT` | 試合前のリマインド投稿の文章 |
| `DISABLE_WEBHOOK_BEFORE_TARGET_MATCH` | 集計時にwebhookによる応答を無視する、集計時間からどれだけ前から無効にするか(ms) |
| `DISABLE_WEBHOOK_AFTER_TARGET_MATCH` | 集計時にwebhookによる応答を無視する、集計時間からどれだけ後に有効にするか(ms) |
| `VAPID_PUBLIC_KEY` | プッシュ通知用VAPID公開鍵 |
| `DB_QUERY_LOGGING` | 実行クエリをログに残すか(検証用) |

また、cron用の実行設定もあります。
これは`triggers.cron`では各種プロセスの制御が不可能なため、制御するための定義です。
そのため、**必ず実行したいcronトリガーの文字列を実行したいプロセスに割り当ててください**。

| 変数 | 説明 |
|------|------|
| `CRON_DAILY` | 集計開始プロセス |
| `CRON_DAILY_REMIND` | リマインド投稿プロセス |

### 8. フロントエンド`wrangler.toml`設定

Cloudflare Workersでフロントエンドをデプロイする場合、以下の項目をwranglerで定義する必要があります。
このとき、変更項目に対してEnvironmentを分割することを推奨します。

- `routes`: Backendではhostに対して任意のパスを許可します

## Dev Container (VS Code)

VS Code 用の Dev Container 設定が含まれています:

1. [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) 拡張機能をインストール
2. プロジェクトを開き、**「Reopen in Container」** を選択
3. 初回起動時に依存関係が自動的にインストールされます
4. 上記の手順にしたがって `packages/backend/.dev.vars` を設定
5. `pnpm front:dev` / `pnpm back:dev` で開発を開始

**ポートフォワーディング:**
| ポート | サービス |
|--------|---------|
| `5173` | フロントエンド（SvelteKit 開発サーバー） |
| `8787` | バックエンド（Wrangler 開発サーバー） |

## 利用可能なスクリプト

### ルート（全パッケージ共通）

| コマンド | 説明 |
|---------|------|
| `pnpm install` | 全依存関係のインストール |
| `pnpm check` | Biome による lint + フォーマットチェック |
| `pnpm check:write` | lint・フォーマット問題の自動修正 |
| `pnpm typecheck` | 全パッケージの型チェック |
| `pnpm build` | 全パッケージのビルド |
| `pnpm test` | 全テストの実行 |
| `pnpm front:dev` | フロントエンド開発サーバーの起動 |
| `pnpm back:dev` | バックエンド開発サーバーの起動 |

### バックエンド

| コマンド | 説明 |
|---------|------|
| `pnpm --filter @midnight-network/backend dev` | Wrangler 開発サーバーの起動 |
| `pnpm --filter @midnight-network/backend build` | ビルド(型生成 + コンパイル) |
| `pnpm --filter @midnight-network/backend migrate:local` | D1 マイグレーションをローカルに適用 |
| `pnpm --filter @midnight-network/backend migrate:remote` | D1 マイグレーションを本番に適用 |
| `pnpm --filter @midnight-network/backend deploy` | Cloudflare Workers にデプロイ |
| `pnpm --filter @midnight-network/backend auth:gen` | Better Authの定義が変更された際にprismaの定義を更新する |
| `pnpm --filter @midnight-network/backend prisma:format` | prismaファイルのフォーマットを実行 |
| `pnpm --filter @midnight-network/backend prisma:mig` | prisma定義から差分をマイグレーションファイルに書き込む(正しくない可能性があるので、基本的には自身で定義した方が良い) |

### フロントエンド

| コマンド | 説明 |
|---------|------|
| `pnpm --filter @midnight-network/frontend dev` | Vite 開発サーバーの起動 |
| `pnpm --filter @midnight-network/frontend build` | 静的サイトのビルド |
| `pnpm --filter @midnight-network/frontend test` | Playwright E2E テストの実行 |

## デプロイ

### バックエンド

Cloudflare Worker としてデプロイ

```bash
pnpm --filter @midnight-network/backend deploy
# 状況に合わせてEnvironmentでデプロイを推奨
# pnpm --filter @midnight-network/backend deploy --env <env>
```

**必要な Cloudflare リソース:**
- **D1 Database**: メインデータストア
- **KV Namespaces**: `SESSION`（認証セッション）, `CACHE`（汎用キャッシュ）
- **R2 Bucket**: ランクステータスのスナップショット
- **Queue**: 再実行ジョブの処理

リソースバインディングは `packages/backend/wrangler.toml` で設定してください。

### フロントエンド

フロントエンドは`@sveltejs/adapter-static`を使用して静的サイトとしてビルドされます:

```bash
pnpm --filter @midnight-network/frontend build
```

出力は`packages/frontend/dist/`に生成され、任意の静的ホスティングサービス(Cloudflare Workers, Vercel, Netlifyなど)にデプロイできます。
基本的には同じくCloudflare Workersにデプロイすることを推奨します。

```bash
pnpm --filter @midnight-network/frontend deploy
# 状況に合わせてEnvironmentでデプロイを推奨
# pnpm --filter @midnight-network/frontend deploy --env <env>
```

## コントリビューション

コントリビューションを歓迎します！
ガイドラインは [CONTRIBUTING.md](./CONTRIBUTING.md) をご覧ください。

## ライセンス

このプロジェクトのソースコードはAGPL-3.0-or-laterライセンスで提供されています。
詳細は[LICENSE](./LICENSE)を参照してください。

ただし、`packages/frontend/static/`ディレクトリ内のmanifest以外の画像およびアセットはオープンソースではなく、
プロプライエタリライセンスで提供されています。詳細は[packages/frontend/static/LICENSE](./packages/frontend/static/LICENSE)を参照してください。

このプロジェクトをフォークする場合、独自のアセットを自身のものに変更する必要があります。
