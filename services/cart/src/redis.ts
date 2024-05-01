import { Redis } from "ioredis";
import { config } from "./config";

const redis = new Redis({
	host: config.redis_host,
	port: parseInt(config.redis_port!),
});

export default redis;
