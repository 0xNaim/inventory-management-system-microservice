import { config } from "@/config";
import prisma from "@/prisma";
import { CartItemSchema, OrderSchema } from "@/schemas";
import axios from "axios";
import { NextFunction, Request, Response } from "express";
import { z } from "zod";

const checkout = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// Validate request
		const parsedBody = OrderSchema.safeParse(req.body);
		if (!parsedBody.success) {
			return res.status(400).json({ errors: parsedBody.error.errors });
		}

		// Get cart details
		const { data: cartData } = await axios.get(
			`${config.cart_service}/cart/me`,
			{
				headers: {
					"x-cart-session-id": parsedBody.data.cartSessionId,
				},
			}
		);
		const cartItems = z.array(CartItemSchema).safeParse(cartData.items);
		if (!cartItems.success) {
			return res.status(400).json({ errors: cartItems.error.errors });
		}

		if (cartItems.data.length === 0) {
			return res.status(400).json({ message: "Cart is empty" });
		}

		// Get product details from cart items
		const productDetails = await Promise.all(
			cartItems.data.map(async (item) => {
				const { data: product } = await axios.get(
					`${config.product_service}/products/${item.productId}`
				);
				return {
					productId: product.id as string,
					productName: product.name as string,
					sku: product.sku as string,
					price: product.price as number,
					quantity: Number(item.quantity),
					total: product.price * Number(item.quantity),
				};
			})
		);

		const subtotal = productDetails.reduce((acc, item) => acc + item.total, 0);

		// TODO: Will handle tax calculation later
		const tax = 0;
		const grandTotal = subtotal + tax;

		// Create order
		const order = await prisma.order.create({
			data: {
				userId: parsedBody.data.userId,
				userName: parsedBody.data.userName,
				userEmail: parsedBody.data.userEmail,
				subtotal,
				tax,
				grandTotal,
				orderItems: {
					create: productDetails.map((item) => ({
						...item,
						quantity: Number(item.quantity),
					})),
				},
			},
		});

		console.log("Order created: ", order.id);

		// Clear cart
		await axios.get(`${config.cart_service}/cart/clear`, {
			headers: {
				"x-cart-session-id": parsedBody.data.cartSessionId,
			},
		});

		// Send email
		await axios.post(`${config.email_service}/emails/send`, {
			recipient: parsedBody.data.userEmail,
			subject: "Order Confirmation",
			body: `Thank you for your order. Your order id is ${order.id}. Your order total is $${grandTotal}`,
			source: "Checkout",
		});

		// send to queue
		// sendToQueue('send-email', JSON.stringify(order));
		// sendToQueue(
		// 	'clear-cart',
		// 	JSON.stringify({ cartSessionId: parsedBody.data.cartSessionId })
		// );

		return res.status(201).json(order);
	} catch (error) {
		next(error);
	}
};

export default checkout;
