import type { CreateBidAttrs, Bid } from '$services/types';
import { bidHistoryKey, itemsKey } from '$services/keys';
import { client } from '$services/redis';
import { DateTime } from 'luxon';
import { getItem } from './items';

export const createBid = async (attrs: CreateBidAttrs) => {

	return client.executeIsolated(async (isolatedClient) => {
		await isolatedClient.watch(itemsKey(attrs.itemId));
		const item = await getItem(attrs.itemId);
		if (!item) {
			throw new Error(`Item with ID ${attrs.itemId} does not exist.`);
		}
		if (item.endingAt.diff(DateTime.now()).toMillis() < 0) {
			throw new Error(`Item with ID ${attrs.itemId} has already ended.`);
		}
		if (attrs.amount <= item.price) {
			throw new Error(`Bid amount must be greater than the current price of the item.`);
		}
		const serialized = serializeHistory(attrs.amount, attrs.createdAt.toMillis());
		return isolatedClient
			.multi()
			.rPush(bidHistoryKey(attrs.itemId), serialized)
			.hSet(itemsKey(item.id), {
				price: attrs.amount,
				highestBidUserId: attrs.userId,
				bids: item.bids + 1
			})
		.exec()
	});
};

export const getBidHistory = async (itemId: string, offset = 0, count = 10): Promise<Bid[]> => {
	const startIndex  =  -1 * offset - count;
	const endIndex = -1 - offset;
	const history = await client.lRange(bidHistoryKey(itemId), startIndex, endIndex);
	return history.map(
		bid => deserializeHistory(bid)
	);
};


const serializeHistory = (amount: number, createdAt: number): string => {
	return  `${amount}:${createdAt}`;
};

const deserializeHistory = (history: string) => {
	const [amount, createdAt] = history.split(':');
	return {
		amount: parseFloat(amount),
		createdAt: DateTime.fromMillis(parseInt(createdAt, 10)),
	};
}
