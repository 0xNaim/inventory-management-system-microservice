import amqp from "amqplib";
import { config, transporter } from "./config";
import prisma from "./prisma";

const receiveFromQueue = async (
	queue: string,
	callback: (message: string, channel: amqp.Channel, msg: amqp.Message) => void
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

						// Acknowledge the message after successful processing
						if (channel) {
							channel.ack(msg);
						} else {
							console.error("Channel is null, unable to acknowledge message");
						}
					} catch (error) {
						console.error("Error processing message:", error);

						// Reject the message and requeue it
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

// Sample call for "send-email" queue
receiveFromQueue("send-email", async (msg, channel, consumeMsg) => {
	console.log("[x] Received from queue: send-email");

	const { userEmail, grandTotal, id } = JSON.parse(msg);

	const emailOptions = {
		from: config.default_sender,
		to: userEmail,
		subject: "Order Confirmation",
		text: `Thank you for your order. Your order ID is ${id}. Your order total is ${grandTotal}`
	};

	try {
		// Send the email
		const { rejected } = await transporter.sendMail(emailOptions);

		if (rejected.length) {
			console.log("Email rejected:", rejected);
			return;
		}

		// Save the email record in the database
		await prisma.email.create({
			data: {
				sender: emailOptions.from!,
				recipient: userEmail,
				subject: emailOptions.subject,
				body: emailOptions.text,
				source: "OrderConfirmation"
			}
		});

		console.log("[x] Email sent successfully");
	} catch (error) {
		console.error("Error sending email:", error);
		channel.nack(consumeMsg, false, true);
	}
});

export default receiveFromQueue;
