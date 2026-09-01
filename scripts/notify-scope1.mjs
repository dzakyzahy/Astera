#!/usr/bin/env node
import { emitAgentEvent } from './agent-event-bus.mjs';

const messageId = process.argv[2] || 'S2_LATEST';
const summary = process.argv.slice(3).join(' ') || 'Scope 2 updated backend/endpoints in SCOPE2_OUTBOX.md';

emitAgentEvent({
  sender: 'SCOPE_2_ANTIGRAVITY',
  target: 'SCOPE_1_CODEX',
  type: 'REPLY',
  messageId,
  summary,
});

console.log(`✓ Notification sent to Scope 1 (Codex). Message ID: ${messageId}`);
