import prisma from "@/prisma";
import { User } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

const getUserById = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { id } = req.params;
		const field = req.query.field as string;
		let user: User | null = null;

		// Input validation
		if (!id || typeof id !== "string" || !/^\d+$/.test(id)) {
			return res.status(400).json({ message: "Invalid user ID!" });
		}

		if (field === "authUserId") {
			user = await prisma.user.findUnique({
				where: { authUserId: String(id) },
			});
		} else {
			user = await prisma.user.findUnique({ where: { id: String(id) } });
		}

		if (!user) {
			return res.status(404).json({ message: "User not found!" });
		}

		return res.json(user);
	} catch (error) {
		next(error);
	}
};

export default getUserById;
