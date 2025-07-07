import { itemsByViewsKey, itemsKey, itemsViewsKey } from "$services/keys";
import { client } from "$services/redis";

export const incrementView = async (itemId: string, userId: string) => {
    const inserted = await client.pfAdd(itemsViewsKey(itemId), userId);
    if (inserted) {
        await client.hIncrBy(itemsKey(itemId), 'views', 1);
        await client.zIncrBy(itemsByViewsKey(), 1, itemId);
    }
};
