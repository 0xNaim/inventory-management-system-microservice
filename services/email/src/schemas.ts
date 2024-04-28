import { z } from "zod";

export const EmailCreateSchema = z.object({
	sender: z.string().email().optional(),
	recipient: z.string().email(),
	subject: z.string(),
	body: z.string(),
	source: z.string(),
});
