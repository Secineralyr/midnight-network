import { D1_MAX_VARIABLES } from "../consts";
import { chunk } from "../util";

export async function chunkFinder<A, R>(array: A[], finder: (chunkArray: A[]) => Promise<R[]>): Promise<R[]> {
	const results: R[][] = [];

	for (const chunkArray of chunk(array, Math.floor(D1_MAX_VARIABLES / 2))) {
		const result = await finder(chunkArray);
		results.push(result);
	}

	return results.flat();
}
