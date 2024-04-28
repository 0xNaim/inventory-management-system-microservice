import { config, transporter } from "@/config";
import prisma from "@/prisma";
import { EmailCreateSchema } from "@/schemas";
import { NextFunction, Request, Response } from "express";

const sendEmail = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// Validate the request
		const parseBody = EmailCreateSchema.safeParse(req.body);
		if (!parseBody.success) {
			return res.status(400).json({ errors: parseBody.error.errors });
		}

		// Create mail option
		const { sender, recipient, subject, body, source } = parseBody.data;
		const from = sender || config.default_sender;

		const emailOption = {
			from,
			to: recipient,
			subject,
			text: body,
		};

		// Send the email
		const { accepted, rejected } = await transporter.sendMail(emailOption);
		if (rejected.length) {
			return res.status(500).json({ message: "Failed" });
		}

		if (accepted) {
			await prisma.email.create({
				data: {
					sender: from as string,
					recipient,
					subject,
					body,
					source,
				},
			});

			return res.status(200).json({ message: "Email sent" });
		}
	} catch (error) {
		next(error);
	}
};

export default sendEmail;
