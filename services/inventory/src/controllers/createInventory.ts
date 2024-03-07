import prisma from "@/prisma";
import { InventoryCreateDTOSchema } from "@/schemas";
import { NextFunction, Request, Response } from "express";

const createInventory = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		// Validate request body
		const parseBody = InventoryCreateDTOSchema.safeParse(req.body);
		if (!parseBody.success) {
			return res.status(400).json({ error: parseBody.error.errors });
		}

		// Create inventory
		const inventory = await prisma.inventory.create({
			data: {
				...parseBody.data,
				histories: {
					create: {
						actionType: "IN",
						quantityChanged: parseBody.data.quantity,
						lastQuantity: 0,
						newQuantity: parseBody.data.quantity,
					},
				},
			},
			select: {
				id: true,
				quantity: true,
			},
		});

		return res.status(201).json(inventory);
	} catch (error) {
		next(error);
	}
};

export default createInventory;
