import { client } from "$services/redis";
import { itemsByEndingAtKey, itemsKey } from "$services/keys";
import { deserialize } from "./deserialize";
import { getItems } from "./items";

export const itemsByEndingTime = async (
	order: 'DESC' | 'ASC' = 'DESC',
	offset = 0,
	count = 10
) => {
	const ids = await client.zRange(
		itemsByEndingAtKey(),
		Date.now(),
		'+inf',
		{
			BY: 'SCORE',
			LIMIT: {
				offset,
				count
			}
		}
	)
	const results = await Promise.all(ids.map((id) => {
		return client.hGetAll(itemsKey(id))
	}));

	console.log(results)
	return results.map((item, i) => deserialize(ids[i], item));
};
