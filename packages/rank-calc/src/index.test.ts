import { describe, expect, it } from 'vitest';

import { calculateRank } from './index.js';

describe('calculateRank', () => {
	it('returns S for >= 900', () => {
		expect(calculateRank(900)).toBe('S');
	});
});
