import dotenv from "dotenv";
dotenv.config({
	path: ".env",
});

export const config = {
	cart_service: process.env.CART_SERVICE_URL,
	email_service: process.env.EMAIL_SERVICE_URL,
	product_service: process.env.PRODUCT_SERVICE_URL,
};
