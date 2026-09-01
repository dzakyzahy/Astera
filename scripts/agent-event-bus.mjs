import { appendFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const EVENT_FILE = resolve(ROOT, 'docs/coordination/.agent_events.jsonl');

/**
 * @typedef {Object} AgentEvent
 * @property {string} id
 * @property {'SCOPE_1_CODEX' | 'SCOPE_2_ANTIGRAVITY'} sender
 * @property {'SCOPE_1_CODEX' | 'SCOPE_2_ANTIGRAVITY'} target
 * @property {'REQUEST' | 'REPLY' | 'CONTRACT_UPDATE' | 'BUILD_READY'} type
 * @property {string} messageId
 * @property {string} summary
 * @property {string} timestamp
 */

/**
 * Emit an agent event across the local event bridge.
 * @param {Omit<AgentEvent, 'id' | 'timestamp'>} event
 */
export function emitAgentEvent(event) {
  const fullEvent = {
    id: `EVT-${Date.now()}`,
    ...event,
    timestamp: new Date().toISOString(),
  };

  const line = JSON.stringify(fullEvent) + '\n';
  appendFileSync(EVENT_FILE, line, 'utf8');

  // Also update latest signal file for instant OS/fs file-watcher notification
  const signalFile = resolve(ROOT, `docs/coordination/.signal_${event.target.toLowerCase()}`);
  writeFileSync(signalFile, JSON.stringify(fullEvent, null, 2), 'utf8');

  console.log(`[EVENT_BRIDGE] Emitted event ${fullEvent.id} from ${event.sender} -> ${event.target} (${event.summary})`);
  return fullEvent;
}
