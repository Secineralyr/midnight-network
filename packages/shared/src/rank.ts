export const RankType = {
	NoRank: 14,
	BeginnerBefore: 13,
	BeginnerAfter: 12,
	NormalBefore: 11,
	NormalAfter: 10,
	BronzeBefore: 9,
	BronzeAfter: 8,
	SilverBefore: 7,
	SilverAfter: 6,
	GoldBefore: 5,
	GoldAfter: 4,
	LuminalBefore: 3,
	LuminalAfter: 2,
	Tachyon: 1,
} as const;

export const RankText = {
	NoRank: 'No Rank',
	BeginnerBefore: 'Ø',
	BeginnerAfter: 'Ⅻ',
	NormalBefore: 'Ⅺ',
	NormalAfter: 'Ⅹ',
	BronzeBefore: 'Ⅸ',
	BronzeAfter: 'Ⅷ',
	SilverBefore: 'Ⅶ',
	SilverAfter: 'Ⅵ',
	GoldBefore: 'Ⅴ',
	GoldAfter: 'Ⅳ',
	LuminalBefore: 'Ⅲ',
	LuminalAfter: 'Ⅱ',
	Tachyon: 'Ⅰ',
} as const satisfies Record<keyof typeof RankType, string>;

export const rankGradeRange = 1000 as const;
