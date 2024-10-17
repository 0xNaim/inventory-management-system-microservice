import amqp from "amqplib";
import { config } from "./config";
import redis from "./redis";

const receiveFromQueue = async (
	queue: string,
	callback: (
		message: string,
		channel: amqp.Channel,
		msg: amqp.ConsumeMessage
	) => Promise<void>
) => {
	let connection: amqp.Connection | null = null;
	let channel: amqp.Channel | null = null;

	try {
		// Establish connection and channel
		connection = await amqp.connect(config.queue_url as string);
		channel = await connection.createChannel();

		// Declare the exchange
		const exchange = "order";
		await channel.assertExchange(exchange, "direct", { durable: true });

		// Declare and bind the queue
		const q = await channel.assertQueue(queue, { durable: true });
		await channel.bindQueue(q.queue, exchange, queue);

		// Start consuming messages from the queue
		await channel.consume(
			q.queue,
			async (msg) => {
				if (msg) {
					try {
						// Process the message
						await callback(msg.content.toString(), channel!, msg);

						// Ensure channel is not null before acknowledging the message
						if (channel) {
							channel.ack(msg);
						} else {
							console.error("Channel is null, unable to acknowledge message");
						}
					} catch (error) {
						console.error("Error processing message:", error);

						// Ensure channel is not null before rejecting the message
						if (channel) {
							channel.nack(msg, false, true);
						} else {
							console.error("Channel is null, unable to nack message");
						}
					}
				}
			},
			{ noAck: false }
		);

		console.log(`[*] Waiting for messages in queue: ${queue}`);
	} catch (error) {
		console.error("Error receiving messages from queue:", error);
	}
};

// Sample call for "clear-cart" queue with acknowledgment
receiveFromQueue("clear-cart", async (msg, channel, consumeMsg) => {
	console.log("[x] Received from queue: clear-cart");
	
	const parsedMessage = JSON.parse(msg);
	const cartSessionId = parsedMessage.cartSessionId;


	try {
		// Perform Redis operations
		await redis.del(`session:${cartSessionId}`);
		await redis.del(`cart:${cartSessionId}`);

		console.log("Cart cleared successfully");
	} catch (error) {
		console.error("Error clearing cart:", error);

		// Reject and requeue the message if something goes wrong
		channel.nack(consumeMsg, false, true);
	}
});

export default receiveFromQueue;
