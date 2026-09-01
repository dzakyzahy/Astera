import { z } from 'zod';

export const vendorComplianceSchema = z.object({
  insuranceValidUntil: z.string(),
  licenseNumber: z.string().min(1),
  backgroundCheckPassed: z.boolean(),
  ndaSigned: z.boolean(),
  verifiedStatus: z.enum(['VERIFIED', 'PENDING_RENEWAL', 'SUSPENDED']),
});

export const vendorInputSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  primaryContact: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  serviceRegions: z.array(z.string()).min(1),
  averageSlaMinutes: z.number().int().positive(),
  compliance: vendorComplianceSchema,
  rating: z.number().min(1).max(5),
  activeStatus: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export type VendorInput = z.infer<typeof vendorInputSchema>;
