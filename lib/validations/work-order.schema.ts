import { z } from 'zod';
import { userRoleSchema } from './incident.schema';

export const workOrderStatusSchema = z.enum([
  'PENDING_DISPATCH',
  'DISPATCHED',
  'ACKNOWLEDGED',
  'EN_ROUTE',
  'ON_SITE',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

export const dispatchWorkOrderInputSchema = z.object({
  workOrderId: z.string().min(1, 'Work Order ID is required'),
  idempotencyKey: z.string().min(8, 'Valid idempotency key is required'),
  assignedTechnician: z.string().optional(),
  technicianContact: z.string().optional(),
  notes: z.string().max(1000).optional(),
  actorId: z.string().min(1),
  actorRole: userRoleSchema,
});

export const updateWorkOrderStatusInputSchema = z.object({
  status: workOrderStatusSchema,
  notes: z.string().max(1000).optional(),
  assignedTechnician: z.string().optional(),
  technicianContact: z.string().optional(),
  actorId: z.string().min(1),
  actorRole: userRoleSchema,
});

export type DispatchWorkOrderInput = z.infer<typeof dispatchWorkOrderInputSchema>;
export type UpdateWorkOrderStatusInput = z.infer<typeof updateWorkOrderStatusInputSchema>;
