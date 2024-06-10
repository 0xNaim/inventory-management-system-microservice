import redis from "@/redis";
import { NextFunction, Request, Response } from "express";

const getMyCart = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const cartSessionId = (req.headers["x-cart-session-id"] as string) || null;

		if (!cartSessionId) {
			return res.status(200).json({ data: [] });
		}

		// Check if the session id exists in the store
		const session = await redis.exists(`sessions:${cartSessionId}`);
		if (!session) {
			await redis.del(`cart:${cartSessionId}`);
			return res.status(200).json({ data: [] });
		}

		const items = await redis.hgetall(`cart:${cartSessionId}`);
		if (Object.keys(items).length === 0) {
			return res.status(200).json({ data: [] });
		}

		// Format the items
		const formattedItems = Object.keys(items).map((key) => {
			const { inventoryId, quantity } = JSON.parse(items[key]) as {
				inventoryId: string;
				quantity: number;
			};
			return {
				inventoryId,
				quantity,
				productId: key,
			};
		});

		return res.status(200).json({ items: formattedItems });
	} catch (error) {
		next(error);
	}
};

export default getMyCart;
