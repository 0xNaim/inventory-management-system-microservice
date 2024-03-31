import { INVENTORY_URL } from "@/config";
import prisma from "@/prisma";
import { ProductCreateDTOSchema } from "@/schemas";
import axios from "axios";
import { NextFunction, Request, Response } from "express";

const createProduct = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		// Validate request body
		const parseBody = ProductCreateDTOSchema.safeParse(req.body);

		if (!parseBody.success) {
			return res
				.status(400)
				.json({ message: "Invalid request body", errors: parseBody.error });
		}

		// Check if product with the same sku already exists
		const existingProduct = await prisma.product.findFirst({
			where: { sku: parseBody.data.sku },
		});

		if (existingProduct) {
			return res
				.status(400)
				.json({ message: "Product with the same sku already exist" });
		}

		const product = await prisma.product.create({
			data: parseBody.data,
		});
		console.log("Product created successfully", product.id);

		// Create inventory record for the product
		const { data: inventory } = await axios.post(
			`${INVENTORY_URL}/inventories`,
			{
				productId: product.id,
				sku: product.sku,
			}
		);
		console.log("Inventory created successfully", inventory.id);

		// Update product and store inventory id
		await prisma.product.update({
			where: { id: product.id },
			data: { inventoryId: inventory.id },
		});
		console.log("Product updated successfully with inventory id", inventory.id);

		return res.status(201).json({ ...product, inventoryId: inventory.id });
	} catch (error) {
		next(error);
	}
};

export default createProduct;
