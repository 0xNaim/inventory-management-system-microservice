import prisma from "@/prisma";
import { UserCreateSchema } from "@/schemas";
import { NextFunction, Request, Response } from "express";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// Validate request body
		const parsedBody = UserCreateSchema.safeParse(req.body);
		if (!parsedBody.success) {
			return res.status(400).json({ message: parsedBody.error.errors });
		}

		// Check if the authUserId already exists
		const existingUser = await prisma.user.findUnique({
			where: { authUserId: parsedBody.data.authUserId },
		});

		if (existingUser) {
			return res.status(400).json({ message: "User already exists" });
		}

		// Create a new user
		const user = await prisma.user.create({
			data: parsedBody.data,
		});

		return res.status(201).json(user);
	} catch (error) {
		next(error);
	}
};

export default createUser;
