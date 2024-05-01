import { config } from "@/config";
import { Redis } from "ioredis";

const redis = new Redis({
	host: config.redis_host,
	port: parseInt(config.redis_port!),
});

const CHANNEL_KEY = "__keyevent@0__:expired";
redis.config("SET", "notify-keyspace-events", "Ex");
redis.subscribe(CHANNEL_KEY);

redis.on("message", async (ch, message) => {
	if (ch === CHANNEL_KEY) {
		console.log("Key expired: ", message);
	}
});
