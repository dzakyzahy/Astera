import { db } from '../db';
import { policySettings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AsteraApiError } from '../api-response';

export class PolicyEngine {
  
  /**
   * Evaluates if a given actor role is authorized to approve a spending amount.
   * 
   * @param organizationId The organization ID to fetch policy settings for
   * @param actorRole The role of the actor attempting to approve
   * @param amountMinorUnits The quote amount in minor units (e.g. IDR amount)
   * @throws AsteraApiError if the policy denies approval
   */
  public async evaluateApprovalPolicy(organizationId: string, actorRole: string, amountMinorUnits: number): Promise<void> {
    // Principal can approve everything
    if (actorRole === 'principal') {
      return;
    }

    // Fetch policy settings for the org
    const settingsResult = await db.select().from(policySettings).where(eq(policySettings.organizationId, organizationId)).limit(1);
    
    // Default threshold is 10,000,000 IDR if not explicitly set
    let threshold = 10000000;
    
    if (settingsResult.length > 0) {
      threshold = settingsResult[0].approvalThresholdMinorUnits;
    }

    if (amountMinorUnits >= threshold) {
      throw new AsteraApiError(403, 'Forbidden', `Amount exceeds the approval threshold (${threshold}). Principal authorization required.`);
    }

    // Manager can approve below threshold
    if (actorRole === 'manager') {
      return;
    }

    throw new AsteraApiError(403, 'Forbidden', 'Role not authorized to approve quotes.');
  }
}
