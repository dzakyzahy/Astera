#!/usr/bin/env node
import { watchFile, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const TARGET_AGENT = process.argv[2] || 'scope_1_codex';
const SIGNAL_FILE = resolve(ROOT, `docs/coordination/.signal_${TARGET_AGENT.toLowerCase()}`);

console.log(`[AGENT_LISTENER] Listening for incoming events targeted at: ${TARGET_AGENT}`);
console.log(`[AGENT_LISTENER] Watching file: ${SIGNAL_FILE}`);

if (!existsSync(SIGNAL_FILE)) {
  console.log('[AGENT_LISTENER] Waiting for first signal...');
}

let lastSignalTime = 0;

watchFile(SIGNAL_FILE, { interval: 1000 }, () => {
  if (existsSync(SIGNAL_FILE)) {
    try {
      const content = readFileSync(SIGNAL_FILE, 'utf8');
      const data = JSON.parse(content);
      const signalTime = new Date(data.timestamp).getTime();

      if (signalTime > lastSignalTime) {
        lastSignalTime = signalTime;
        console.log('\n======================================================');
        console.log(`🔔 NEW AGENT EVENT RECEIVED [${data.messageId}]`);
        console.log(`From: ${data.sender} -> To: ${data.target}`);
        console.log(`Summary: ${data.summary}`);
        console.log(`Time: ${data.timestamp}`);
        console.log('Action: Check docs/coordination/ for details and proceed.');
        console.log('======================================================\n');
      }
    } catch {
      // Ignore parse errors while writing
    }
  }
});
