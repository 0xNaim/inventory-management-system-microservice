import prisma from "@/prisma";
import { ProductUpdateDTOSchema } from "@/schemas";
import { NextFunction, Request, Response } from "express";

const updateProduct = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		// Validate request body
		const parseBody = ProductUpdateDTOSchema.safeParse(req.body);

		if (!parseBody.success) {
			return res
				.status(400)
				.json({ message: "Invalid request body", errors: parseBody.error });
		}

		// Check if the product exists
		const product = await prisma.product.findUnique({
			where: {
				id: req.params.id,
			},
		});

		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		// Update the product
		const updatedProduct = await prisma.product.update({
			where: {
				id: req.params.id,
			},
			data: parseBody.data,
		});

		return res.status(200).json({ data: updatedProduct });
	} catch (error) {
		next(error);
	}
};

export default updateProduct;
