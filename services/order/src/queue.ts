import amqp from "amqplib";
import { config } from "./config";

const sendToQueue = async (queue: string, message: string) => {
	let connection: amqp.Connection | null = null;
	let channel: amqp.Channel | null = null;

	try {
		// Establish connection and channel
		connection = await amqp.connect(config.queue_url as string);
		channel = await connection.createChannel();

		// Declare exchange
		const exchange = "order";
		await channel.assertExchange(exchange, "direct", { durable: true });

		// Publish the message to the specified queue
		channel.publish(exchange, queue, Buffer.from(message));
		console.log(`Sent ${message} to ${queue}`);
	} catch (error) {
		console.error("Failed to send message to queue:", error);
	} finally {
		// Ensure connection is closed gracefully
		if (channel) await channel.close();
		if (connection) await connection.close();
	}
};

export default sendToQueue;
