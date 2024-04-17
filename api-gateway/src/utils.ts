import axios from "axios";
import { Express, Request, Response } from "express";
import config from "./config.json";

// Function to sensitize params
const getSensitizedParams = (params: any) => {
	const sensitizedParams: { [key: string]: string } = {};
	Object.keys(params).forEach((param) => {
		sensitizedParams[param] = encodeURIComponent(params[param]);
	});
	return sensitizedParams;
};

// Create API request handler
export const createHandler = (
	hostname: string,
	path: string,
	method: string
) => {
	return async (req: Request, res: Response) => {
		try {
			// Sensitized params
			const sensitizedParams = getSensitizedParams(req.params);

			const url = `${hostname}${path}`;
			sensitizedParams &&
				Object.keys(req.params).forEach((param) => {
					url = url.replace(`:${param}`, req.params[param]);
				});

			const { data } = await axios({
				method,
				url,
				data: req.body,
				headers: {
					origin: "http://localhost:8081",
				},
			});

			res.json(data);
		} catch (error) {
			if (error instanceof axios.AxiosError) {
				return res
					.status(error.response?.status || 500)
					.json(error.response?.data);
			}

			return res.status(500).json({ message: "Internal Server Error" });
		}
	};
};

export const configureRoutes = (app: Express) => {
	Object.entries(config.services).forEach(([_name, service]) => {
		const hostname = service.url;
		service.routes.forEach((route) => {
			route.methods.forEach((method) => {
				const handler = createHandler(hostname, route.path, method);
				// Register the handler with the appropriate route and method
				app[method.toLowerCase()](`/api${route.path}`, handler);
			});
		});
	});
};
