export type Rank = 'S' | 'A' | 'B' | 'C' | 'D';

export function calculateRank(score: number): Rank {
	if (!Number.isFinite(score)) {
		return 'D';
	}
	if (score >= 900) {
		return 'S';
	}
	if (score >= 750) {
		return 'A';
	}
	if (score >= 600) {
		return 'B';
	}
	if (score >= 450) {
		return 'C';
	}
	return 'D';
}
