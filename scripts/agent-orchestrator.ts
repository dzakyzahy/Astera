import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const ROOT = process.cwd();
const SCOPE1_OUTBOX = resolve(ROOT, 'docs/coordination/SCOPE1_OUTBOX.md');
const SCOPE2_OUTBOX = resolve(ROOT, 'docs/coordination/SCOPE2_OUTBOX.md');
const STATE_FILE = resolve(ROOT, 'docs/coordination/.orchestrator_state.json');

interface OrchestratorState {
  lastScope1Hash?: string;
  lastScope2Hash?: string;
  lastPollTimestamp: string;
  activeRound: number;
}

async function getFileContent(path: string): Promise<string> {
  if (!existsSync(path)) return '';
  return readFile(path, 'utf8');
}

export async function checkOutboxUpdates(): Promise<{
  scope1Updated: boolean;
  scope2Updated: boolean;
  state: OrchestratorState;
}> {
  let state: OrchestratorState = {
    lastPollTimestamp: new Date().toISOString(),
    activeRound: 1,
  };

  if (existsSync(STATE_FILE)) {
    try {
      state = JSON.parse(await readFile(STATE_FILE, 'utf8'));
    } catch {
      // Use initial state
    }
  }

  const s1Content = await getFileContent(SCOPE1_OUTBOX);
  const s2Content = await getFileContent(SCOPE2_OUTBOX);

  const scope1Updated = state.lastScope1Hash !== s1Content && s1Content.length > 0;
  const scope2Updated = state.lastScope2Hash !== s2Content && s2Content.length > 0;

  state.lastScope1Hash = s1Content;
  state.lastScope2Hash = s2Content;
  state.lastPollTimestamp = new Date().toISOString();

  await writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');

  return { scope1Updated, scope2Updated, state };
}
