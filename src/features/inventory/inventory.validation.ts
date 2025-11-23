import { z } from "zod";

// Branch Inventory Schemas
export const adjustInventorySchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number(),
  reason: z.string().optional(),
});

export const setInventorySchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().min(0, "Quantity must be non-negative"),
  minimumStock: z.number().min(0).optional(),
  maximumStock: z.number().min(0).optional(),
});

// Inventory Transfer Schemas
export const createTransferSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  fromBranchId: z.string().min(1, "Source branch ID is required"),
  toBranchId: z.string().min(1, "Destination branch ID is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than zero"),
  notes: z.string().optional(),
});

export const approveTransferSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});

export type AdjustInventoryDto = z.infer<typeof adjustInventorySchema>;
export type SetInventoryDto = z.infer<typeof setInventorySchema>;
export type CreateTransferDto = z.infer<typeof createTransferSchema>;
export type ApproveTransferDto = z.infer<typeof approveTransferSchema>;
