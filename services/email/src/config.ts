import nodemailer from "nodemailer";

export const config = {
	default_sender: process.env.DEFAULT_SENDER_EMAIL,
};

export const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST || "smtp.mailtrap.io",
	port: parseInt(process.env.SMTP_PORT || "2525"),
});
