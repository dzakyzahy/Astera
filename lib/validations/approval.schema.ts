import { z } from 'zod';
import { userRoleSchema } from './incident.schema';

export const approveQuoteInputSchema = z.object({
  incidentId: z.string().min(1, 'Incident ID is required'),
  quoteId: z.string().min(1, 'Quote ID is required'),
  approverId: z.string().min(1, 'Approver ID is required'),
  approverName: z.string().min(1, 'Approver name is required'),
  approverRole: userRoleSchema,
  explicitAck: z.literal(true, {
    errorMap: () => ({ message: 'Explicit human acknowledgment checkbox is required for spending approval' }),
  }),
  notes: z.string().max(1000).optional(),
  idempotencyKey: z.string().min(8, 'Valid idempotency key is required'),
});

export const rejectQuoteInputSchema = z.object({
  incidentId: z.string().min(1, 'Incident ID is required'),
  quoteId: z.string().min(1, 'Quote ID is required'),
  approverId: z.string().min(1, 'Approver ID is required'),
  approverName: z.string().min(1, 'Approver name is required'),
  approverRole: userRoleSchema,
  reason: z.string().min(3, 'Rejection reason is required').max(1000),
  idempotencyKey: z.string().min(8, 'Valid idempotency key is required'),
});

export type ApproveQuoteInput = z.infer<typeof approveQuoteInputSchema>;
export type RejectQuoteInput = z.infer<typeof rejectQuoteInputSchema>;
