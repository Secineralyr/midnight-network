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
