import type {
  AdvisoryTriage,
  ContainmentStep,
  Evidence,
  IncidentSeverity,
} from '../../types/domain';

export class AiOrchestrationService {
  private static readonly MODEL_VERSION = 'astera-triage-advisory-v2.6';

  /**
   * Generates advisory triage analysis for an incoming incident based on text and evidence.
   * STRICT SAFETY BOUNDARY: AI recommendations are advisory only and require human approval.
   */
  public generateAdvisoryTriage(params: {
    summary: string;
    description: string;
    evidence?: Evidence[];
    severityHint?: IncidentSeverity;
    assetName?: string;
  }): AdvisoryTriage {
    const textLower = `${params.summary} ${params.description}`.toLowerCase();

    let suggestedSeverity: IncidentSeverity = params.severityHint || 'MEDIUM';
    let confidenceScore = 0.88;
    let reasoning = '';
    const citations: string[] = [];
    let recommendedSpecialty = 'General Facilities Maintenance';
    const containmentSteps: ContainmentStep[] = [];

    // Analyze domain keywords for critical infrastructure failure
    if (
      textLower.includes('leak') ||
      textLower.includes('water') ||
      textLower.includes('pipe') ||
      textLower.includes('flood') ||
      textLower.includes('condensate')
    ) {
      suggestedSeverity = 'HIGH';
      confidenceScore = 0.94;
      recommendedSpecialty = 'Commercial HVAC & Mechanical Plumbing';
      reasoning =
        'Active moisture/liquid containment risk detected. Potential structural finish damage and mold hazard if not mitigated within standard 4-hour SLA window.';
      citations.push('Sensor telemetry: Condensate Tray High Level Alert');
      if (params.evidence && params.evidence.length > 0) {
        citations.push(`Submitted visual evidence: ${params.evidence[0].fileName}`);
      }

      containmentSteps.push(
        {
          stepNumber: 1,
          action: 'Isolate primary drain valve and switch HVAC unit to fan-only mode.',
          targetRole: 'estate_manager',
          completed: true,
        },
        {
          stepNumber: 2,
          action: 'Place catchment basin and moisture sensor under ceiling cavity.',
          targetRole: 'steward',
          completed: true,
        },
        {
          stepNumber: 3,
          action: 'Review normalized vendor quotes and authorize certified technician dispatch.',
          targetRole: 'principal',
          completed: false,
        }
      );
    } else if (
      textLower.includes('generator') ||
      textLower.includes('power') ||
      textLower.includes('grid') ||
      textLower.includes('blackout') ||
      textLower.includes('voltage')
    ) {
      suggestedSeverity = 'CRITICAL';
      confidenceScore = 0.96;
      recommendedSpecialty = 'High-Voltage Power & Backup Generation';
      reasoning =
        'Critical power infrastructure degradation. Automated switchgear transfer requires immediate certified specialist inspection.';
      citations.push('Telemetry log: Utility Grid fluctuation / 80 kVA Genset automated run');

      containmentSteps.push(
        {
          stepNumber: 1,
          action: 'Verify fuel reservoir level (>80%) and secondary ATS controller status.',
          targetRole: 'estate_manager',
          completed: true,
        },
        {
          stepNumber: 2,
          action: 'Confirm critical server/security circuits are isolated on UPS buffer.',
          targetRole: 'steward',
          completed: true,
        },
        {
          stepNumber: 3,
          action: 'Authorize emergency dispatch for Perkins certified technician.',
          targetRole: 'principal',
          completed: false,
        }
      );
    } else if (textLower.includes('security') || textLower.includes('cctv') || textLower.includes('gate')) {
      suggestedSeverity = 'HIGH';
      confidenceScore = 0.91;
      recommendedSpecialty = 'Perimeter Access Control & Biometric Systems';
      reasoning =
        'Perimeter access control vulnerability identified. Manual guard override protocol initiated.';
      citations.push('Access control gateway telemetry alert');

      containmentSteps.push(
        {
          stepNumber: 1,
          action: 'Engage physical fail-secure magnetic lock on East Gate.',
          targetRole: 'estate_manager',
          completed: true,
        },
        {
          stepNumber: 2,
          action: 'Post static steward watch at secondary pedestrian gate.',
          targetRole: 'steward',
          completed: true,
        },
      );
    } else {
      suggestedSeverity = 'LOW';
      confidenceScore = 0.85;
      recommendedSpecialty = 'General Property Maintenance';
      reasoning =
        'Routine maintenance item identified without immediate safety or asset compromise risk.';
      citations.push('Standard operational log entry');

      containmentSteps.push({
        stepNumber: 1,
        action: 'Log work order into scheduled weekly vendor sweep.',
        targetRole: 'estate_manager',
        completed: false,
      });
    }

    return {
      suggestedSeverity,
      confidenceScore,
      reasoning,
      citations,
      recommendedSpecialty,
      containmentSteps,
      aiModelVersion: AiOrchestrationService.MODEL_VERSION,
      triagedAt: new Date().toISOString(),
      humanOverrideApplied: false,
    };
  }
}
