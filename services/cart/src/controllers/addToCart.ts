// Import necessary modules and dependencies
import { config } from "@/config";
import redis from "@/redis";
import { CartItemSchema } from "@/schemas";
import { NextFunction, Request, Response } from "express";
import { v4 as uuid } from "uuid";

const addToCart = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// Validate the request body
		const parseBody = CartItemSchema.safeParse(req.body);
		if (!parseBody.success) {
			return res.status(400).json({ errors: parseBody.error.errors });
		}

		let cartSessionId = (req.headers["x-cart-session-id"] as string) || null;

		// Check if the cart session ID exists in Redis
		if (cartSessionId) {
			const exists = await redis.exists(`sessions:${cartSessionId}`);

			// If the session doesn't exist in Redis, set cartSessionId to null
			if (!exists) {
				cartSessionId = null;
			}
		}

		// If cartSessionId is still null, generate a new UUID and set it in Redis
		if (cartSessionId === null) {
			cartSessionId = uuid();

			await redis.setex(
				`sessions:${cartSessionId}`,
				config.redis_cart_ttl as string,
				cartSessionId
			);

			// Set the cart session ID in response headers
			res.setHeader("x-cart-session-id", cartSessionId);
		}

		// Add item to the cart
		await redis.hset(
			`cart:${cartSessionId}`,
			parseBody.data.productId,
			JSON.stringify({
				inventoryId: parseBody.data.inventoryId,
				quantity: parseBody.data.quantity,
			})
		);

		return res
			.status(200)
			.json({ message: "Item added to cart", cartSessionId });

		// TODO: Check inventory for availability
		// TODO: Update the inventory
	} catch (error) {
		next(error);
	}
};

export default addToCart;
