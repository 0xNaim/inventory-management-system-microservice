import { z } from "zod";

export const InventoryCreateDTOSchema = z.object({
	productId: z.string(),
	sku: z.string(),
	quantity: z.number().int().positive().optional().default(0),
});


