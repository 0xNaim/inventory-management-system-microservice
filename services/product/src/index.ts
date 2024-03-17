import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";


dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
	res.status(200).json({ status: "Service UP" });
});

// Routes


// 404 handler
app.use((_req, res) => {
	res.status(404).json({ message: "Not found" });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
	console.error(err.stack);
	res.status(500).json({ message: "Internal server error" });
});

const port = process.env.PORT || 4001;
const serviceName = process.env.SERVICE_NAME || "Product-Service";

app.listen(port, () => {
	console.log(`${serviceName} is running on port ${port}`);
});
