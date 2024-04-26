import prisma from "@/prisma";
import { UserLoginSchema } from "@/schemas";
import { LoginAttempt } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type LoginHistory = {
	userId: string;
	userAgent: string | undefined;
	ipAddress: string | undefined;
	attempt: LoginAttempt;
};

// Create login history
const createLoginHistory = async (info: LoginHistory) => {
	await prisma.loginHistory.create({
		data: {
			userId: info.userId,
			userAgent: info.userAgent,
			ipAddress: info.ipAddress,
			attempt: info.attempt,
		},
	});
};

const userLogin = async (req: Request, res: Response, next: NextFunction) => {
	// Get info from headers
	const ipAddress =
		(req.headers["x-forwarded-for"] as string) ||
		req.connection.remoteAddress ||
		"";
	const userAgent = req.headers["user-agent"] || "";

	// Validate the request
	const parseBody = UserLoginSchema.safeParse(req.body);
	if (!parseBody.success) {
		return res.status(400).json({ errors: parseBody.error.errors });
	}

	// Check if the user already exists
	const user = await prisma.user.findUnique({
		where: {
			email: parseBody.data.email,
		},
	});

	if (!user) {
		await createLoginHistory({
			userId: "Guest",
			userAgent,
			ipAddress,
			attempt: "FAILED",
		});

		return res.status(400).json({
			message: "Invalid credentials",
		});
	}

	// Compare user password
	const isMatch = await bcrypt.compare(parseBody.data.password, user.password);
	if (!isMatch) {
		await createLoginHistory({
			userId: user.id,
			userAgent,
			ipAddress,
			attempt: "FAILED",
		});

		return res.status(400).json({
			message: "Invalid credentials",
		});
	}

	// Check if the user is verified
	if (!user.verified) {
		await createLoginHistory({
			userId: user.id,
			userAgent,
			ipAddress,
			attempt: "FAILED",
		});

		return res.status(400).json({ message: "User not verified" });
	}

	// Check if the user account is active
	if (user.status !== "ACTIVE") {
		await createLoginHistory({
			userId: user.id,
			userAgent,
			ipAddress,
			attempt: "FAILED",
		});

		return res
			.status(400)
			.json({ message: `Your account is ${user.status.toLocaleLowerCase()}` });
	}

	// Generate access token
	const accessToken = jwt.sign(
		{ userId: user.id, name: user.name, email: user.email, role: user.role },
		process.env.JWT_SECRET as string,
		{
			expiresIn: "2h",
		}
	);

	await createLoginHistory({
		userId: user.id,
		userAgent,
		ipAddress,
		attempt: "SUCCESS",
	});

	return res.status(200).json({ accessToken });
};

export default userLogin;
