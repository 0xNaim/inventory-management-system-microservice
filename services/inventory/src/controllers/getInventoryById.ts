import prisma from "@/prisma";
import { NextFunction, Request, Response } from "express";

const getInventoryById = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		// Check if inventory exist
		const { id } = req.params;
		const inventory = await prisma.inventory.findUnique({
			where: { id },
			select: { quantity: true },
		});

		if (!inventory) {
			return res.status(404).json({ message: "Inventory not found" });
		}

		return res.status(200).json(inventory);
	} catch (error) {
		next(error);
	}
};

export default getInventoryById;
