import { config } from "@/config";
import prisma from "@/prisma";
import { UserCreateSchema } from "@/schemas";
import { generateVerificationCode } from "@/utils/generateVerificationCode";
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
		await axios.post(`${config.user_service}/users`, {
			authUserId: user.id,
			name: user.name,
			email: user.email,
		});

		// Generate verification code
		const code = generateVerificationCode();
		await prisma.verificationCode.create({
			data: {
				userId: user.id,
				code,
				expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
			},
		});

		// Send verification code
		await axios.post(`${config.email_service_url}/emails/send`, {
			recipient: user.email,
			subject: "Email Verification",
			body: `Your verification code is ${code}`,
			source: "user-registration",
		});

		return res.status(201).json({
			message: "User created successfully. Check your email for verification code",
			user,
		});
	} catch (error) {
		next(error);
	}
};

export default userRegistration;
