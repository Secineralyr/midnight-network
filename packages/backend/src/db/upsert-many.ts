// SPDX-FileCopyrightText: 2026 Secineralyr
// SPDX-License-Identifier: AGPL-3.0-or-later

import { D1_MAX_VARIABLES } from '../consts';
import { Prisma, type PrismaClient } from '../generated/prisma/client';

/**
 * SQLで使用可能な値の型
 */
type SqlValue = string | number | boolean | Date | null;

/**
 * SQLフィールドの型（ネストなしのフラットなオブジェクト）
 */
type SqlFields = Record<string, SqlValue>;

/**
 * Prismaデリゲートの基本型
 *
 * Prismaのデリゲート（例: prisma.user, prisma.record）は以下のような複雑なジェネリックシグネチャを持つ:
 * ```
 * upsert<T extends ModelUpsertArgs>(args: SelectSubset<T, ModelUpsertArgs<ExtArgs>>): Prisma__ModelClient<...>
 * ```
 *
 * このシグネチャから型を抽出するため、以下の理由で `(...args: never) => unknown` を使用:
 * 1. `never` は全ての型のサブタイプなので、どんな引数シグネチャにもマッチする
 * 2. `unknown` は全ての型のスーパータイプなので、どんな戻り値にもマッチする
 * 3. これにより、デリゲートの実際の型を保持したまま制約を満たせる
 */
type PrismaDelegate = {
	upsert: (...args: never) => unknown;
};

/**
 * 関数の第一引数の型を抽出
 * `never`引数を持つ関数型から実際の引数型を抽出するためのヘルパー
 *
 * `unknown`使用理由:
 * 条件型の extends 句で関数の戻り値型をマッチさせるために使用。
 * `unknown`は全ての型のスーパータイプなので、どんな戻り値型にもマッチする。
 * 実際の戻り値型は使用せず、第一引数の型のみを抽出するため安全。
 */
type FirstArg<T> = T extends (arg: infer A, ...rest: infer _R) => unknown ? A : never;

/**
 * デリゲートからUpsertの引数型を抽出
 */
type ExtractUpsertArgs<TDelegate extends PrismaDelegate> = FirstArg<TDelegate['upsert']>;

/**
 * デリゲートからUpsertのCreate型を抽出
 */
type ExtractUpsertCreate<TDelegate extends PrismaDelegate> =
	ExtractUpsertArgs<TDelegate> extends {
		create: infer TCreate;
	}
		? TCreate
		: never;

/**
 * upsertMany の引数型
 *
 * SQLiteの `INSERT ... ON CONFLICT ... DO UPDATE SET` に対応:
 * - conflictKeys: ON CONFLICT句で使用するカラム（全行共通）
 * - updateKeys: DO UPDATE SET句で更新するカラム（全行共通、excluded.columnを使用）
 * - data: INSERTするデータの配列
 *
 * 型安全性について:
 * dataの型は `ExtractUpsertCreate<TDelegate> & SqlFields` の交差型を使用。
 * これにより:
 * - ExtractUpsertCreate<TDelegate>: Prismaのcreate型からカラム名の型補完を提供
 * - SqlFields: SQL値（string | number | boolean | Date | null）のみを許可し、
 *   リレーションオブジェクト（connect, createなど）を型エラーで拒否
 * - executeBatch内の `as SqlFields` は特化→汎用のアップキャストとなり安全
 */
export type UpsertManyArgs<
	TDelegate extends PrismaDelegate,
	TConflictKey extends keyof ExtractUpsertCreate<TDelegate>,
	TUpdateKey extends keyof ExtractUpsertCreate<TDelegate>,
> = {
	/**
	 * ON CONFLICT句で使用するユニークキーのカラム名
	 * 例: ['noteId'] → ON CONFLICT ("noteId")
	 */
	conflictKeys: TConflictKey[];
	/**
	 * DO UPDATE SET句で更新するカラム名
	 * excluded.column を使用して挿入予定値で更新される
	 * 例: ['postedAt', 'place'] → DO UPDATE SET "postedAt" = excluded."postedAt", "place" = excluded."place"
	 */
	updateKeys: TUpdateKey[];
	/**
	 * INSERTするデータの配列
	 * ExtractUpsertCreate<TDelegate>で型補完を提供し、SqlFieldsでSQL値のみを許可
	 */
	data: (ExtractUpsertCreate<TDelegate> & SqlFields)[];
	/**
	 * Prismaの自動タイムスタンプ（createdAt/updatedAt）を自動設定するかどうか
	 * - true（デフォルト）: createdAt/updatedAtを自動設定
	 * - false: タイムスタンプの自動設定を無効化（createdAt/updatedAtカラムがないモデル用）
	 */
	autoTimestamps?: boolean;
};

/**
 * Prismaの自動タイムスタンプフィールド
 * - createdAt: @default(now()) に対応、INSERTのみ
 * - updatedAt: @updatedAt に対応、INSERT/UPDATE両方
 */
const TIMESTAMP_FIELDS = {
	createdAt: 'createdAt',
	updatedAt: 'updatedAt',
} as const;

/**
 * 値をSQL用にフォーマット
 */
function formatValue(value: SqlValue): Prisma.Sql {
	if (value === null) {
		return Prisma.sql`NULL`;
	}
	if (value instanceof Date) {
		// SQLite用のISO文字列フォーマット
		return Prisma.sql`${value.toISOString()}`;
	}
	if (typeof value === 'boolean') {
		return Prisma.sql`${value ? 1 : 0}`;
	}
	return Prisma.sql`${value}`;
}

/**
 * SQLite用のupsertMany実装
 * デリゲートから型を推論し、モデル名は明示的に指定
 *
 * @param prisma - PrismaClientインスタンス
 * @param modelName - テーブル名（CamelCase、例: 'Record', 'User'）
 * @param _delegate - Prismaデリゲート（型推論用、ランタイムでは未使用）
 * @param args - upsertMany引数（conflictKeys, updateKeys, data）
 *
 * @example
 * ```typescript
 * await upsertMany(prisma, 'Record', prisma.record, {
 *   conflictKeys: ['noteId'],
 *   updateKeys: ['postedAt', 'userId', 'place', 'matchDateId'],
 *   data: [
 *     { noteId: 'note1', postedAt: new Date(), userId: 'user1', place: 1, matchDateId: 1 },
 *     { noteId: 'note2', postedAt: new Date(), userId: 'user2', place: 2, matchDateId: 1 },
 *   ],
 * });
 * ```
 *
 * 生成されるSQL:
 * ```sql
 * INSERT INTO "Record" ("noteId", "postedAt", "userId", "place", "matchDateId")
 * VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)
 * ON CONFLICT ("noteId")
 * DO UPDATE SET "postedAt" = excluded."postedAt", "userId" = excluded."userId", ...
 * ```
 */
export async function upsertMany<
	TDelegate extends PrismaDelegate,
	TConflictKey extends keyof ExtractUpsertCreate<TDelegate> & string,
	TUpdateKey extends keyof ExtractUpsertCreate<TDelegate> & string,
>(
	prisma: PrismaClient,
	modelName: string,
	_delegate: TDelegate,
	args: UpsertManyArgs<TDelegate, TConflictKey, TUpdateKey>,
): Promise<number> {
	const { conflictKeys, updateKeys, data, autoTimestamps = true } = args;

	if (data.length === 0) {
		return 0;
	}

	// Prismaの自動タイムスタンプを模倣: createdAt/updatedAtを自動設定
	let processedData: (ExtractUpsertCreate<TDelegate> & SqlFields)[];
	if (autoTimestamps) {
		const now = new Date();
		processedData = data.map((item) => {
			const result = { ...item };
			// createdAt: データに含まれていない場合のみ現在時刻を設定（@default(now())相当）
			if (!(TIMESTAMP_FIELDS.createdAt in result)) {
				(result as SqlFields)[TIMESTAMP_FIELDS.createdAt] = now;
			}
			// updatedAt: 常に現在時刻を設定（@updatedAt相当）
			(result as SqlFields)[TIMESTAMP_FIELDS.updatedAt] = now;
			return result;
		});
	} else {
		processedData = data;
	}

	// カラム数に基づいてバッチサイズを動的に計算
	const firstItem = processedData[0];
	if (firstItem === undefined) {
		return 0;
	}
	const columnCount = Object.keys(firstItem).length;
	const batchSize = Math.max(1, Math.floor(D1_MAX_VARIABLES / columnCount));

	// バッチに分割して処理
	const batches: (ExtractUpsertCreate<TDelegate> & SqlFields)[][] = [];
	for (let i = 0; i < processedData.length; i += batchSize) {
		batches.push(processedData.slice(i, i + batchSize));
	}

	let totalAffected = 0;

	for (const batch of batches) {
		const affected = await executeBatch(prisma, modelName, conflictKeys, updateKeys, batch);
		totalAffected += affected;
	}

	return totalAffected;
}

/**
 * 1バッチ分のupsertを実行
 */
async function executeBatch<TDelegate extends PrismaDelegate>(
	prisma: PrismaClient,
	modelName: string,
	conflictKeys: string[],
	updateKeys: string[],
	batch: (ExtractUpsertCreate<TDelegate> & SqlFields)[],
): Promise<number> {
	const firstItem = batch[0];
	if (firstItem === undefined) {
		return 0;
	}

	const createColumns = Object.keys(firstItem);

	// INSERT部分のカラムリスト
	const columnList = createColumns.map((col) => `"${col}"`).join(', ');

	// VALUES部分を構築
	const valuesSqlParts: Prisma.Sql[] = batch.map((item) => {
		const values = createColumns.map((col) => {
			const value = item[col];
			if (value === undefined) {
				throw new Error(`upsertMany: Missing required column "${col}" in data`);
			}
			return formatValue(value);
		});
		return Prisma.sql`(${Prisma.join(values, ', ')})`;
	});
	const valuesSql = Prisma.join(valuesSqlParts, ', ');

	// ON CONFLICT部分のカラムリスト
	const conflictColumnList = conflictKeys.map((col) => `"${col}"`).join(', ');

	// DO UPDATE SET部分を構築
	// updatedAtがデータに含まれている場合、自動的にupdateKeysに追加
	const effectiveUpdateKeys = [...updateKeys];
	if (TIMESTAMP_FIELDS.updatedAt in firstItem && !effectiveUpdateKeys.includes(TIMESTAMP_FIELDS.updatedAt)) {
		effectiveUpdateKeys.push(TIMESTAMP_FIELDS.updatedAt);
	}
	const updateSetParts = effectiveUpdateKeys.map((col) => `"${col}" = excluded."${col}"`);
	const updateSetSql = updateSetParts.join(', ');

	// クエリ全体を構築
	const query = Prisma.sql`
		INSERT INTO "${Prisma.raw(modelName)}" (${Prisma.raw(columnList)})
		VALUES ${valuesSql}
		ON CONFLICT (${Prisma.raw(conflictColumnList)})
		DO UPDATE SET ${Prisma.raw(updateSetSql)}
	`;

	const result = await prisma.$executeRaw(query);
	return result;
}
