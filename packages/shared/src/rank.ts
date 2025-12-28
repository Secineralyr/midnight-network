export const RankType = {
	NoRank: -1,
	BeginnerBefore: 0,
	BeginnerAfter: 1,
	NormalBefore: 2,
	NormalAfter: 3,
	BronzeBefore: 4,
	BronzeAfter: 5,
	SilverBefore: 6,
	SilverAfter: 7,
	GoldBefore: 8,
	GoldAfter: 9,
	LuminalBefore: 10,
	LuminalAfter: 11,
	Tachyon: 12,
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
