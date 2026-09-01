import { z } from 'zod';

export const incidentSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const incidentStatusSchema = z.enum([
  'DRAFT',
  'TRIAGED',
  'QUOTING',
  'AWAITING_APPROVAL',
  'REJECTED',
  'APPROVED',
  'DISPATCHED',
  'IN_PROGRESS',
  'RESOLVED',
]);

export const userRoleSchema = z.enum([
  'principal',
  'estate_manager',
  'steward',
  'vendor',
  'auditor',
]);

export const evidenceTypeSchema = z.enum(['photo', 'document', 'voice', 'note']);

export const evidenceInputSchema = z.object({
  id: z.string().optional(),
  mediaType: evidenceTypeSchema,
  fileName: z.string().min(1, 'File name is required'),
  fileSizeBytes: z.number().int().nonnegative().max(50 * 1024 * 1024, 'Max 50MB per file'),
  checksumSha256: z.string().length(64, 'Valid SHA-256 hex string required').optional(),
  url: z.string().url().or(z.string().startsWith('/')),
  note: z.string().max(500).optional(),
});

export const containmentStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  action: z.string().min(1),
  targetRole: userRoleSchema,
  completed: z.boolean().default(false),
  completedAt: z.string().datetime().optional(),
});

export const advisoryTriageSchema = z.object({
  suggestedSeverity: incidentSeveritySchema,
  confidenceScore: z.number().min(0).max(1),
  reasoning: z.string().min(1),
  citations: z.array(z.string()),
  recommendedSpecialty: z.string().min(1),
  containmentSteps: z.array(containmentStepSchema),
  aiModelVersion: z.string(),
  triagedAt: z.string().datetime(),
  humanOverrideApplied: z.boolean().default(false),
  humanOverrideNotes: z.string().max(1000).optional(),
});

export const createIncidentInputSchema = z.object({
  estateId: z.string().min(1, 'Estate ID is required'),
  assetId: z.string().optional(),
  summary: z.string().min(3, 'Summary must be at least 3 characters').max(200),
  description: z.string().min(5, 'Description must be at least 5 characters').max(5000),
  severitySuggestion: incidentSeveritySchema.optional(),
  reportedBy: z.string().min(1).default('Staff Lead'),
  reportedByRole: userRoleSchema.default('estate_manager'),
  evidence: z.array(evidenceInputSchema).optional().default([]),
});

export const triageOverrideInputSchema = z.object({
  severity: incidentSeveritySchema,
  overrideNotes: z.string().min(3, 'Reason for overriding AI recommendation is required').max(1000),
  actorId: z.string().min(1),
  actorRole: userRoleSchema,
});

export type CreateIncidentInput = z.infer<typeof createIncidentInputSchema>;
export type TriageOverrideInput = z.infer<typeof triageOverrideInputSchema>;
