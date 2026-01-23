# MidNight Network

`packages/*` 配下に frontend/backend を含むモノレポです。pnpm workspace + catalog で依存バージョンを集中管理しています。

## 必要要件

- Volta（`package.json#volta` で Node / pnpm を固定）
- Node.js: `24.12.0`（latest LTS）
- pnpm: `10.26.0`

## セットアップ

```bash
pnpm install
pnpm check
pnpm typecheck
```

## Dev Container (VS Code)

- VS Code の Dev Containers 拡張を有効化して "Reopen in Container" を実行
- 初回起動時に `pnpm install` が走ります
- backend を動かす場合は `packages/backend/.dev.vars.template` を元に `packages/backend/.dev.vars` を作成して値を設定
- 開発起動: `pnpm front:dev` / `pnpm back:dev`
