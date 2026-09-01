import { z } from 'zod';

export const assetCategorySchema = z.enum([
  'HVAC',
  'Power',
  'Water',
  'Security',
  'Structural',
  'Network',
]);

export const assetStateSchema = z.enum(['Healthy', 'Scheduled', 'Attention']);

export const telemetryReadingInputSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  status: z.enum(['good', 'warning', 'normal']),
  timestamp: z.string().datetime().optional(),
  unit: z.string().optional(),
});

export const addTelemetryBatchInputSchema = z.object({
  readings: z.array(telemetryReadingInputSchema).min(1),
});

export type TelemetryReadingInput = z.infer<typeof telemetryReadingInputSchema>;
export type AddTelemetryBatchInput = z.infer<typeof addTelemetryBatchInputSchema>;
