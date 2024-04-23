import { NextFunction, Request, Response } from "express";

export const corsMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const allowedOrigins = ["http://localhost:8081", "http://127.0.0.1:8081"];
	const origin = req.headers.origin as string;

	if (allowedOrigins.includes(origin)) {
		res.setHeader("Access-Control-Allow-Origin", origin);
		next();
	} else {
		res.status(403).json({ message: "Forbidden" });
	}
};
