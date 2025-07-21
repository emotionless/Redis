import type { CreateBidAttrs, Bid } from '$services/types';
import { bidHistoryKey } from '$services/keys';
import { client } from '$services/redis';
import { DateTime } from 'luxon';

export const createBid = async (attrs: CreateBidAttrs) => {
	const serialized = serializeHistory(attrs.amount, attrs.createdAt.toMillis());
	return await client.rPush(bidHistoryKey(attrs.itemId), serialized);
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
