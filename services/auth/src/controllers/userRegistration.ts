import { authConfig } from "@/config";
import prisma from "@/prisma";
import { UserCreateSchema } from "@/schemas";
import axios from "axios";
import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";

const userRegistration = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		// Validate the request body
		const parseBody = UserCreateSchema.safeParse(req.body);
		if (!parseBody.success) {
			return res.status(400).json({ errors: parseBody.error.errors });
		}

		// Check if the user already exists
		const existingUser = await prisma.user.findUnique({
			where: {
				email: parseBody.data.email,
			},
		});

		if (existingUser) {
			return res.status(400).json({
				message: "User already exists",
			});
		}

		// Hash the password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(parseBody.data.password, salt);

		// Create the auth user
		const user = await prisma.user.create({
			data: {
				...parseBody.data,
				password: hashedPassword,
			},
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				status: true,
				verified: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		// Create the user profile by calling the user service
		await axios.post(`${authConfig.user_service}/users`, {
			authUserId: user.id,
			name: user.name,
			email: user.email,
		});

		// TODO: Generate verification code
		// TODO: Send verification code

		return res.status(201).json(user);
	} catch (error) {
		next(error);
	}
};

export default userRegistration;
