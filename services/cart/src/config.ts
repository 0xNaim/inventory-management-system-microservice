import dotenv from "dotenv";
dotenv.config({
	path: ".env",
});

export const config = {
	redis_host: process.env.REDIS_HOST,
	redis_port: process.env.REDIS_PORT,
	redis_cart_ttl: process.env.CART_TTL,
	inventory_service: process.env.INVENTORY_SERVICE_URL,
	queue_url: process.env.QUEUE_URL
};
