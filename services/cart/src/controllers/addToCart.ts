// Import necessary modules and dependencies
import { config } from "@/config";
import redis from "@/redis";
import { CartItemSchema } from "@/schemas";
import axios from "axios";
import { NextFunction, Request, Response } from "express";
import { v4 as uuid } from "uuid";

const addToCart = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// Validate the request body
		const parsedBody = CartItemSchema.safeParse(req.body);
		if (!parsedBody.success) {
			return res.status(400).json({ errors: parsedBody.error.errors });
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

		// Check if the inventory is available
		const { data } = await axios.get(
			`${config.inventory_service}/inventories/${parsedBody.data.inventoryId}`
		);

		if (Number(data.quantity) < parsedBody.data.quantity) {
			return res.status(400).json({ message: "Inventory not available" });
		}

		// Add item to the cart
		await redis.hset(
			`cart:${cartSessionId}`,
			parsedBody.data.productId,
			JSON.stringify({
				inventoryId: parsedBody.data.inventoryId,
				quantity: parsedBody.data.quantity,
			})
		);

		// Update inventory
		await axios.put(
			`${config.inventory_service}/inventories/${parsedBody.data.inventoryId}`,
			{
				quantity: parsedBody.data.quantity,
				actionType: "OUT",
			}
		);

		return res
			.status(200)
			.json({ message: "Item added to cart", cartSessionId });
	} catch (error) {
		next(error);
	}
};

export default addToCart;
