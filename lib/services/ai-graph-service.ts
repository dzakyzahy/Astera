import { StateGraph, END, START, Annotation } from '@langchain/langgraph';
import type {
  AdvisoryTriage,
  Evidence,
  NormalizedQuote,
  WorkOrder,
} from '../../types/domain';
import { AiOrchestrationService } from './ai-orchestration-service';
import { QuoteNormalizerService } from './quote-normalizer-service';

// Define the Graph State Schema using LangGraph Annotation
export const IncidentWorkflowAnnotation = Annotation.Root({
  incidentId: Annotation<string>(),
  summary: Annotation<string>(),
  description: Annotation<string>(),
  evidence: Annotation<Evidence[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  triage: Annotation<AdvisoryTriage | undefined>(),
  quotes: Annotation<NormalizedQuote[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  selectedQuoteId: Annotation<string | undefined>(),
  humanApproved: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),
  approverId: Annotation<string | undefined>(),
  workOrder: Annotation<WorkOrder | undefined>(),
  currentStage: Annotation<string>({
    reducer: (_, next) => next,
    default: () => 'INIT',
  }),
});

export type IncidentWorkflowState = typeof IncidentWorkflowAnnotation.State;

export class AsteraLangGraphOrchestrator {
  private aiService = new AiOrchestrationService();
  private quoteNormalizer = new QuoteNormalizerService();
  private appGraph;

  constructor() {
    this.appGraph = this.buildWorkflowGraph();
  }

  private buildWorkflowGraph() {
    const workflow = new StateGraph(IncidentWorkflowAnnotation)
      // 1. Triage Node: Advisory extraction & severity assignment
      .addNode('triage_node', async (state) => {
        const triage = this.aiService.generateAdvisoryTriage({
          summary: state.summary,
          description: state.description,
          evidence: state.evidence,
        });
        return {
          triage,
          currentStage: 'TRIAGED',
        };
      })
      // 2. Normalization & Quoting Node: Standardize vendor bids
      .addNode('quoting_node', async (state) => {
        const quotes: NormalizedQuote[] = [
          this.quoteNormalizer.normalizeVendorQuote({
            incidentId: state.incidentId,
            vendorId: 'VND-BLI-01',
            vendorName: 'Bali Climate Works',
            vendorRating: 4.9,
            laborAmountMinorUnits: 7500000,
            partsAmountMinorUnits: 9200000,
            taxAmountMinorUnits: 1800000,
            etaHours: 2,
            warrantyMonths: 12,
            scopeDescription: 'Emergency line blowout and ultrasonic sensor replacement.',
          }),
        ];
        return {
          quotes,
          selectedQuoteId: quotes[0]?.id,
          currentStage: 'AWAITING_APPROVAL',
        };
      })
      // 3. Human Approval Checkpoint Node (Enforces Human-in-the-Loop boundary)
      .addNode('human_approval_checkpoint', async (state) => {
        if (!state.humanApproved) {
          return { currentStage: 'AWAITING_APPROVAL' };
        }
        return { currentStage: 'APPROVED' };
      })
      // 4. Dispatch Node: Authorized Work Order creation
      .addNode('dispatch_node', async (state) => {
        if (!state.humanApproved || !state.selectedQuoteId) {
          throw new Error('Cannot dispatch without explicit human approval');
        }
        const selectedQuote = state.quotes.find((q) => q.id === state.selectedQuoteId);
        const workOrder: WorkOrder = {
          id: `WO-LANGGRAPH-${Date.now()}`,
          workOrderNumber: `WO-LG-${Date.now().toString().slice(-4)}`,
          incidentId: state.incidentId,
          quoteId: state.selectedQuoteId,
          estateId: 'EST-BLI-01',
          vendorId: selectedQuote?.vendorId || 'VND-01',
          vendorName: selectedQuote?.vendorName || 'Vendor',
          status: 'DISPATCHED',
          scheduledArrival: selectedQuote?.estimatedArrivalTimestamp || new Date().toISOString(),
          dispatchedAt: new Date().toISOString(),
          outboxDispatched: true,
          outboxAttempts: 1,
          slaTargetMinutes: (selectedQuote?.etaHours || 2) * 60,
        };
        return {
          workOrder,
          currentStage: 'DISPATCHED',
        };
      });

    // Define Graph Edges
    workflow.addEdge(START, 'triage_node');
    workflow.addEdge('triage_node', 'quoting_node');
    workflow.addEdge('quoting_node', 'human_approval_checkpoint');

    // Conditional routing based on human authorization
    workflow.addConditionalEdges(
      'human_approval_checkpoint',
      (state) => (state.humanApproved ? 'dispatch' : 'await_approval'),
      {
        dispatch: 'dispatch_node',
        await_approval: END,
      }
    );

    workflow.addEdge('dispatch_node', END);

    return workflow.compile();
  }

  public async runIntakeAndTriage(params: {
    incidentId: string;
    summary: string;
    description: string;
    evidence?: Evidence[];
  }): Promise<IncidentWorkflowState> {
    const initialState: IncidentWorkflowState = {
      incidentId: params.incidentId,
      summary: params.summary,
      description: params.description,
      evidence: params.evidence || [],
      triage: undefined,
      quotes: [],
      selectedQuoteId: undefined,
      humanApproved: false,
      approverId: undefined,
      workOrder: undefined,
      currentStage: 'INIT',
    };

    const finalState = await this.appGraph.invoke(initialState);
    return finalState;
  }

  public async processHumanDecision(
    currentState: IncidentWorkflowState,
    decision: { approved: boolean; approverId: string; selectedQuoteId: string }
  ): Promise<IncidentWorkflowState> {
    const updatedState: IncidentWorkflowState = {
      ...currentState,
      humanApproved: decision.approved,
      approverId: decision.approverId,
      selectedQuoteId: decision.selectedQuoteId,
    };

    const result = await this.appGraph.invoke(updatedState);
    return result;
  }
}
