import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import reteLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { addToCart, clearCart, getMyCart } from "./controllers";
import "./events/onKeyExpires";

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// Rate limit middleware
const limiter = reteLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	handler: (_req, res) => {
		res
			.status(429)
			.json({ message: "Too many requests, please try again later." });
	},
});
app.use("/api", limiter);

// Request logger
app.use(morgan("dev"));
app.use(express.json());

// TODO: Auth middleware

// Routes
app.post("/cart/add-to-cart", addToCart);
app.get("/cart/me", getMyCart);
app.get("/cart/clear", clearCart);

// Health check
app.use("/health", (_req, res) => {
	res.json({ message: "API Gateway is running" });
});

// 404 handler
app.use((_req: Request, res: Response) => {
	res.status(404).json({ message: "Not Found" });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
	console.error(err.stack);
	res.status(500).json({ message: "Internal Server Error" });
});

const port = process.env.PORT || 4006;
const serviceName = process.env.SERVICE_NAME || "Cart-Service";

app.listen(port, () => {
	console.log(`${serviceName} is running on port ${port}`);
});
