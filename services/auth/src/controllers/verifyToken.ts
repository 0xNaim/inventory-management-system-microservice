import { config } from "@/config";
import prisma from "@/prisma";
import { AccessTokenSchema } from "@/schemas";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// Validate the request body
		const parseBody = AccessTokenSchema.safeParse(req.body);
		if (!parseBody.success) {
			return res.status(400).json({ errors: parseBody.error.errors });
		}

		const { accessToken } = parseBody.data;
		const decoded = jwt.verify(accessToken, config.jwt_secret as string);

		const user = await prisma.user.findUnique({
			where: {
				id: (decoded as any).userId,
			},
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
			},
		});

		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		return res.status(200).json({ message: "Authorized", user });
	} catch (error) {
		next(error);
	}
};

export default verifyToken;
