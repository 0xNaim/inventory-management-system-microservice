import prisma from "@/prisma";
import { NextFunction, Request, Response } from "express";

const getEmails = async (req: Request, res: Response, next: NextFunction) => {
	const emails = await prisma.email.findMany();
	return res.status(200).json(emails);
};

export default getEmails;
