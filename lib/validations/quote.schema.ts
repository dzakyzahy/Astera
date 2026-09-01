import { z } from 'zod';

export const quoteCostBreakdownSchema = z.object({
  laborMinorUnits: z.number().int().nonnegative('Labor cost must be non-negative integer'),
  partsMinorUnits: z.number().int().nonnegative('Parts cost must be non-negative integer'),
  permitMinorUnits: z.number().int().nonnegative().default(0),
  taxMinorUnits: z.number().int().nonnegative().default(0),
});

export const normalizedQuoteInputSchema = z.object({
  incidentId: z.string().min(1),
  vendorId: z.string().min(1),
  vendorName: z.string().min(1),
  vendorRating: z.number().min(1).max(5).default(4.5),
  totalAmountMinorUnits: z.number().int().positive('Total amount must be positive'),
  currency: z.string().length(3).default('IDR'),
  breakdown: quoteCostBreakdownSchema,
  etaHours: z.number().positive(),
  estimatedArrivalTimestamp: z.string().datetime(),
  warrantyMonths: z.number().int().nonnegative(),
  scopeDescription: z.string().min(5),
  riskRating: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('LOW'),
  aiRecommendationScore: z.number().min(0).max(100).default(80),
  aiRecommendationRationale: z.string().min(1),
  isAiRecommended: z.boolean().default(false),
  complianceVerified: z.boolean().default(true),
});

export type NormalizedQuoteInput = z.infer<typeof normalizedQuoteInputSchema>;
