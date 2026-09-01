#!/usr/bin/env node
import { emitAgentEvent } from './agent-event-bus.mjs';

const messageId = process.argv[2] || 'S1_LATEST';
const summary = process.argv.slice(3).join(' ') || 'Scope 1 posted a new request in SCOPE1_OUTBOX.md';

emitAgentEvent({
  sender: 'SCOPE_1_CODEX',
  target: 'SCOPE_2_ANTIGRAVITY',
  type: 'REQUEST',
  messageId,
  summary,
});

console.log(`✓ Notification sent to Scope 2 (Antigravity). Message ID: ${messageId}`);
