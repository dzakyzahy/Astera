import type { NormalizedQuote, QuoteCostBreakdown } from '../../types/domain';

export class QuoteNormalizerService {
  /**
   * Normalizes vendor submissions into standardized quotes for side-by-side comparison.
   */
  public normalizeVendorQuote(params: {
    incidentId: string;
    vendorId: string;
    vendorName: string;
    vendorRating: number;
    laborAmountMinorUnits: number;
    partsAmountMinorUnits: number;
    permitAmountMinorUnits?: number;
    taxAmountMinorUnits?: number;
    etaHours: number;
    warrantyMonths: number;
    scopeDescription: string;
    currency?: string;
  }): NormalizedQuote {
    const permit = params.permitAmountMinorUnits || 0;
    const tax = params.taxAmountMinorUnits || 0;
    const totalAmount =
      params.laborAmountMinorUnits + params.partsAmountMinorUnits + permit + tax;

    const breakdown: QuoteCostBreakdown = {
      laborMinorUnits: params.laborAmountMinorUnits,
      partsMinorUnits: params.partsAmountMinorUnits,
      permitMinorUnits: permit,
      taxMinorUnits: tax,
    };

    // Calculate risk rating
    let riskRating: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (params.etaHours > 6 || params.warrantyMonths < 3 || params.vendorRating < 4.0) {
      riskRating = 'HIGH';
    } else if (params.etaHours > 3 || params.warrantyMonths < 6 || params.vendorRating < 4.6) {
      riskRating = 'MEDIUM';
    }

    // Calculate AI score (weighted: ETA 35%, Rating 30%, Warranty 20%, Value/Cost 15%)
    let score = Math.round(
      params.vendorRating * 12 +
        Math.max(0, 10 - params.etaHours) * 3 +
        Math.min(12, params.warrantyMonths) * 2
    );
    score = Math.min(98, Math.max(40, score));

    const etaDate = new Date(Date.now() + params.etaHours * 60 * 60 * 1000).toISOString();

    const isAiRecommended = score >= 85 && riskRating === 'LOW';
    const rationale = isAiRecommended
      ? `Highest compliance rating (${params.vendorRating}/5.0), rapid ${params.etaHours}h SLA response, and comprehensive ${params.warrantyMonths}-month labor & parts warranty.`
      : `Standard vendor proposal. ETA: ${params.etaHours}h, Warranty: ${params.warrantyMonths}m.`;

    return {
      id: `QUO-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      incidentId: params.incidentId,
      vendorId: params.vendorId,
      vendorName: params.vendorName,
      vendorRating: params.vendorRating,
      totalAmountMinorUnits: totalAmount,
      currency: params.currency || 'IDR',
      breakdown,
      etaHours: params.etaHours,
      estimatedArrivalTimestamp: etaDate,
      warrantyMonths: params.warrantyMonths,
      scopeDescription: params.scopeDescription,
      riskRating,
      aiRecommendationScore: score,
      aiRecommendationRationale: rationale,
      isAiRecommended,
      complianceVerified: true,
      submittedAt: new Date().toISOString(),
    };
  }
}
